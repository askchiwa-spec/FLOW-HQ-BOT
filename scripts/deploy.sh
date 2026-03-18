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

# 1. Pull latest code
echo "→ Pulling latest code..."
git pull origin main

# 2. Install/update dependencies
echo "→ Installing dependencies..."
npm ci

# 3. Generate Prisma client (must happen before builds)
echo "→ Generating Prisma client..."
npx prisma generate --schema=packages/shared/src/prisma/schema.prisma

# 4. Run database migrations (deploy mode — no interactive prompts)
# NOTE: Uses directUrl (non-pooled) for advisory lock support.
# Non-fatal: Neon direct connection can time out on advisory locks when no migrations are pending.
echo "→ Running database migrations..."
set +e
npx prisma migrate deploy --schema=packages/shared/src/prisma/schema.prisma
MIGRATE_STATUS=$?
set -e
if [ $MIGRATE_STATUS -ne 0 ]; then
  echo "⚠️  Migration step failed (exit $MIGRATE_STATUS) — skipping. Run manually if migrations are pending."
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

echo "=== Deploy complete ==="
pm2 status
