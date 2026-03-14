#!/bin/bash
# Production deployment script — run on the server via SSH
# Called by .github/workflows/deploy.yml
set -e

echo "=== Chatisha Deploy: $(date) ==="

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
npm run build --workspace=@chatisha/web

# 6. Reload PM2 processes (zero-downtime for control-plane and web)
echo "→ Reloading PM2 processes..."
# Verify Next.js build exists before reloading web process
if [ ! -f "apps/web/.next/BUILD_ID" ]; then
  echo "⚠️  Next.js build missing — skipping web reload. Run: pm2 restart flowhq-web"
  pm2 reload flowhq-control-plane --update-env
else
  pm2 reload ecosystem.config.js --update-env
fi

echo "=== Deploy complete ==="
pm2 status
