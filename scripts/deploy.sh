#!/bin/bash
# Production deployment script — run on the server via SSH
# Called by .github/workflows/deploy.yml
set -e

echo "=== Chatisha Deploy: $(date) ==="

# 0. Validate required env files are present and correct
echo "→ Validating environment..."
WEB_ENV="apps/web/.env.local"
CP_ENV="apps/control-plane/.env"
MISSING_ENV=0

if [ ! -f "$WEB_ENV" ]; then
  echo "❌ Missing $WEB_ENV — create it with NEXTAUTH_URL, NEXTAUTH_SECRET, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, CONTROL_PLANE_URL, PORTAL_INTERNAL_KEY, DATABASE_URL"
  MISSING_ENV=1
else
  for VAR in NEXTAUTH_URL NEXTAUTH_SECRET GOOGLE_CLIENT_ID GOOGLE_CLIENT_SECRET PORTAL_INTERNAL_KEY DATABASE_URL; do
    if ! grep -q "^${VAR}=" "$WEB_ENV"; then
      echo "⚠️  $WEB_ENV is missing $VAR"
      MISSING_ENV=1
    fi
  done
  # Warn if NEXTAUTH_URL still points to localhost
  if grep -q "NEXTAUTH_URL=http://localhost" "$WEB_ENV"; then
    echo "⚠️  $WEB_ENV: NEXTAUTH_URL is set to localhost — should be https://app.chatisha.com in production"
  fi
  # Warn if CONTROL_PLANE_URL points to wrong port
  if grep -q "CONTROL_PLANE_URL=http://localhost:3000" "$WEB_ENV"; then
    echo "⚠️  $WEB_ENV: CONTROL_PLANE_URL uses port 3000 but control-plane runs on 3100 in production"
  fi
fi

if [ ! -f "$CP_ENV" ]; then
  echo "❌ Missing $CP_ENV"
  MISSING_ENV=1
fi

if [ "$MISSING_ENV" = "1" ]; then
  echo "⚠️  Env issues detected — continuing deploy but portal auth may fail"
fi

# Cross-service key consistency check
WEB_KEY=$(grep "^PORTAL_INTERNAL_KEY=" "$WEB_ENV" 2>/dev/null | cut -d= -f2-)
CP_KEY=$(grep "^PORTAL_INTERNAL_KEY=" "$CP_ENV" 2>/dev/null | cut -d= -f2-)
if [ -n "$WEB_KEY" ] && [ -n "$CP_KEY" ] && [ "$WEB_KEY" != "$CP_KEY" ]; then
  echo "❌ PORTAL_INTERNAL_KEY mismatch between $WEB_ENV and $CP_ENV — portal API will return 401 for all users. Fix before deploying."
  exit 1
fi

# 1. Pull latest code
echo "→ Pulling latest code..."
git fetch origin main
git reset --hard origin/main

# 2. Install/update dependencies
echo "→ Installing dependencies..."
npm install --prefer-offline
# Apply patches (whatsapp-web.js Chrome 145 fix, etc.)
echo "→ Applying patches..."
npx patch-package || echo "⚠️  patch-package failed — continuing"

# 3. Generate Prisma client (must happen before builds)
echo "→ Generating Prisma client..."
npx prisma generate --schema=packages/shared/src/prisma/schema.prisma

# 4. Run database migrations (deploy mode — no interactive prompts)
# Load DATABASE_URL from control-plane .env so migrations always hit the correct DB.
echo "→ Running database migrations..."
CP_DB_URL=$(grep "^DATABASE_URL=" apps/control-plane/.env 2>/dev/null | cut -d= -f2-)
if [ -z "$CP_DB_URL" ]; then
  echo "⚠️  Could not read DATABASE_URL from apps/control-plane/.env — skipping migrations."
else
  set +e
  DATABASE_URL="$CP_DB_URL" DIRECT_URL="$CP_DB_URL" \
    npx prisma migrate deploy --schema=packages/shared/src/prisma/schema.prisma
  MIGRATE_STATUS=$?
  set -e
  if [ $MIGRATE_STATUS -ne 0 ]; then
    echo "⚠️  Migration step failed (exit $MIGRATE_STATUS) — skipping. Run manually if needed."
  else
    echo "✓ Migrations applied"
  fi
fi

# 5. Build all packages in correct dependency order
echo "→ Building shared package..."
npm run build --workspace=@chatisha/shared

echo "→ Building control-plane..."
npm run build --workspace=@chatisha/control-plane

echo "→ Building worker..."
npm run build --workspace=@chatisha/worker

echo "→ Building web (Next.js)..."
rm -rf apps/web/.next
npm run build --workspace=@chatisha/web

# 6. Reload PM2 processes (zero-downtime for control-plane and web)
echo "→ Reloading PM2 processes..."
# Verify Next.js build exists before reloading web process
if [ ! -f "apps/web/.next/BUILD_ID" ]; then
  echo "⚠️  Next.js build missing — skipping web reload. Run: pm2 restart flowhq-web"
  pm2 reload flowhq-control-plane --update-env
  pm2 reload flowhq-scheduler --update-env 2>/dev/null || pm2 start ecosystem.config.js --only flowhq-scheduler
else
  pm2 reload ecosystem.config.js --update-env 2>/dev/null || pm2 start ecosystem.config.js
fi

# 7. Restart all tenant workers (picks up new worker build)
echo "→ Restarting tenant workers..."
WORKER_NAMES=$(pm2 jlist 2>/dev/null | python3 -c "
import sys, json
try:
    procs = json.load(sys.stdin)
    names = [p['name'] for p in procs if p['name'].startswith('worker-')]
    print(' '.join(names))
except:
    pass
" 2>/dev/null)
if [ -n "$WORKER_NAMES" ]; then
  # Load DB URL for QR_PENDING check
  CP_DB_URL_W=$(grep "^DATABASE_URL=" apps/control-plane/.env 2>/dev/null | cut -d= -f2-)
  for W in $WORKER_NAMES; do
    # Extract tenant ID from worker name (format: worker-<timestamp>)
    # Skip workers whose WhatsApp session is in QR_PENDING/QR_READY state — restarting would invalidate a live QR scan
    SKIP=0
    if [ -n "$CP_DB_URL_W" ]; then
      WA_STATE=$(psql "$CP_DB_URL_W" -tAc "
        SELECT ws.state FROM worker_processes wp
        JOIN whatsapp_sessions ws ON ws.tenant_id = wp.tenant_id
        WHERE wp.pm2_name = '$W' LIMIT 1;" 2>/dev/null || echo "")
      if [ "$WA_STATE" = "QR_PENDING" ] || [ "$WA_STATE" = "QR_READY" ]; then
        echo "  Skipping $W (session state: $WA_STATE — QR scan in progress)"
        SKIP=1
      fi
    fi
    if [ "$SKIP" = "0" ]; then
      echo "  Restarting $W..."
      pm2 restart "$W" --update-env 2>/dev/null || echo "  ⚠️  Could not restart $W"
    fi
  done
else
  echo "  No tenant workers running"
fi

echo "=== Deploy complete ==="
pm2 status
