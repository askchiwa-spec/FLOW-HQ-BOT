# Flow HQ - WhatsApp Chatbot Platform MVP

A multi-tenant WhatsApp chatbot platform with isolated sessions per client, managed from a central admin backend.

## Architecture

- **Control Plane**: Admin API and dashboard (Express + EJS)
- **Worker**: Per-tenant WhatsApp bot process (whatsapp-web.js)
- **Shared**: Common types, Prisma client, and utilities

## Prerequisites

- Node.js 18+
- PostgreSQL 14+
- PM2 (for process management)
- A WhatsApp account for testing

## Quick Start

### 1. Install Dependencies

```bash
# Install root dependencies
npm install

# Install all workspace dependencies
npm install --workspaces
```

### 2. Setup Environment

```bash
cp .env.example .env
# Edit .env with your database credentials and admin password
```

### 3. Setup Database

```bash
# Generate Prisma client
npm run db:generate

# Run migrations
npm run db:migrate
```

### 4. Build Applications

```bash
npm run build
```

### 5. Start Control Plane

Development mode:
```bash
npm run dev:api
```

Production mode with PM2:
```bash
pm2 start ecosystem.config.js
```

### 6. Access Admin Dashboard

Open http://localhost:3000/admin/tenants

Use the password set in `ADMIN_PASSWORD` env variable.

## Usage Guide

### Create a Tenant

1. Go to the admin dashboard
2. Fill in the form:
   - **Business Name**: Internal name for the tenant
   - **Phone Number**: The WhatsApp number (format: +255XXXXXXXXX)
   - **Template Type**: Select BOOKING for the demo
   - **Display Name**: Name shown to customers
   - **Language**: SW (Swahili) or EN (English)
3. Click "Create Tenant"

### Start Worker and Connect WhatsApp

1. Click "Start" on the tenant row
2. Click "View" to open tenant details
3. Wait for the QR code to appear (may take 10-30 seconds)
4. Open WhatsApp on your phone
5. Go to Settings → Linked Devices → Link a Device
6. Scan the QR code displayed
7. Status will change to "ACTIVE" when connected

### Test the Bot

Send a message to the connected WhatsApp number:

**Booking Template (Swahili)**:
- Message: "booking" or "miadi"
- Reply: "Karibu [business_name]. Tafadhali taja huduma unayotaka na tarehe..."

- Message: "hello" or any other text
- Reply: "Karibu [business_name]. Andika: 1) Booking 2) Huduma 3) Bei 4) Mawasiliano"

### View Logs

The tenant detail page shows the last 50 messages. Check the logs directory for detailed logs:
```bash
tail -f logs/<tenant_id>.log
```

### Stop/Restart Worker

Use the Stop and Restart buttons in the admin dashboard. The WhatsApp session will persist (no need to rescan QR) unless you delete the session files.

## Project Structure

```
.
├── apps/
│   ├── control-plane/     # Admin API & dashboard
│   └── worker/            # Tenant WhatsApp worker
├── packages/
│   └── shared/            # Shared types & Prisma client
├── sessions/              # WhatsApp session data (per tenant)
├── logs/                  # Log files (per tenant)
├── ecosystem.config.js    # PM2 configuration
└── .env                   # Environment variables
```

## API Endpoints

All endpoints require the admin password via Basic Auth or query parameter.

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /admin/tenants | Create new tenant |
| GET | /admin/tenants | List all tenants |
| GET | /admin/tenants/:id | Get tenant details |
| POST | /admin/tenants/:id/worker/start | Start worker |
| POST | /admin/tenants/:id/worker/stop | Stop worker |
| POST | /admin/tenants/:id/worker/restart | Restart worker |
| GET | /admin/tenants/:id/qr | Get QR code |
| GET | /admin/tenants/:id/logs | Get message logs |

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| DATABASE_URL | PostgreSQL connection string | - |
| ADMIN_PASSWORD | Admin dashboard password | - |
| NODE_ENV | Environment (development/production) | development |
| PORT | API server port | 3000 |
| LOG_LEVEL | Logging level | info |
| SESSIONS_PATH | WhatsApp session storage path | ./sessions |
| LOGS_PATH | Log files path | ./logs |
| RATE_LIMIT_MAX_PER_MINUTE | Max replies per minute per tenant | 10 |
| HEARTBEAT_INTERVAL_MS | Worker heartbeat interval | 30000 |
| STALE_THRESHOLD_MINUTES | Minutes before worker marked stale | 2 |
| STALE_CHECK_INTERVAL_MS | Stale worker check interval | 60000 |
| PUPPETEER_EXECUTABLE_PATH | Path to Chrome/Chromium binary | - |

## Database Schema

### Tenant
- Core tenant information and status

### TenantConfig
- Template settings (BOOKING, ECOMMERCE, SUPPORT)
- Business name and language preferences

### WhatsAppSession
- Session state (DISCONNECTED, QR_READY, CONNECTED)
- QR code storage
- Last seen timestamp

### MessageLog
- All incoming and outgoing messages
- Linked to tenant for isolation

### WorkerProcess
- PM2 process tracking
- Status and error logging

## Troubleshooting

### QR Code not appearing
- Check worker logs: `logs/<tenant_id>.log`
- Ensure worker started: Check PM2 status with `pm2 list`
- Restart worker and wait 10-30 seconds

### Session not persisting
- Ensure `sessions/` directory exists and is writable
- Check that `SESSIONS_PATH` env variable is set correctly

### Database connection errors
- Verify PostgreSQL is running
- Check `DATABASE_URL` format: `postgresql://user:password@host:port/database`

### WhatsApp Web errors
- whatsapp-web.js requires Chromium. On some systems you may need to install additional dependencies:
  ```bash
  # Ubuntu/Debian
  sudo apt-get install -y chromium-browser
  
  # macOS (Chromium should work out of the box)
  ```

## Development

### Run in Development Mode

```bash
# Terminal 1: Control Plane
npm run dev:api

# Terminal 2: Worker (for specific tenant)
TENANT_ID=<tenant-id> SESSIONS_PATH=./sessions npm run dev --workspace=@flowhq/worker
```

### Run Multi-Tenant Stress Test

The stress test verifies tenant isolation by creating 3 tenants, simulating messages, and checking for data leakage:

```bash
# Ensure control plane is running
npm run dev:api

# Run stress test
npx tsx scripts/stress-test.ts
```

Expected output:
```
✓ Tenant Isolation - StressTest-Tenant-1: All 10 logs correctly isolated
✓ Tenant Isolation - StressTest-Tenant-2: All 10 logs correctly isolated
✓ Tenant Isolation - StressTest-Tenant-3: All 10 logs correctly isolated
✓ Cross-Tenant Data Leakage: No data leakage detected
✓ Session Isolation - StressTest-Tenant-1: Session properly isolated
...
✓ All tests passed! Multi-tenant isolation verified.
```

### Add New Template

1. Create template file in `apps/worker/src/templates/`
2. Add response logic in `apps/worker/src/templates/index.ts`
3. Update `TemplateType` enum in Prisma schema if needed

### Database Migrations

```bash
# Create new migration
npm run db:migrate -- --name <migration-name>

# Deploy migrations in production
npm run db:deploy
```

## Production Deployment

### VPS Setup (Ubuntu/Debian)

#### 1. Install System Dependencies

```bash
# Update system
sudo apt-get update && sudo apt-get upgrade -y

# Install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PostgreSQL
sudo apt-get install -y postgresql postgresql-contrib

# Install PM2 globally
sudo npm install -g pm2

# Install Chrome/Chromium for whatsapp-web.js
sudo apt-get install -y chromium-browser

# Install Git
sudo apt-get install -y git
```

#### 2. Setup Database

```bash
# Switch to postgres user
sudo -u postgres psql

# Create database and user
CREATE DATABASE flowhq;
CREATE USER flowhq_user WITH ENCRYPTED PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE flowhq TO flowhq_user;
\q
```

#### 3. Deploy Application

```bash
# Clone repository
cd /opt
git clone <your-repo-url> flowhq
cd flowhq

# Install dependencies
cd packages/shared && npm install && npm run build
cd ../../apps/control-plane && npm install && npm run build
cd ../worker && npm install && npm run build

# Setup environment
cp .env.example .env
# Edit .env with production values
```

#### 4. Environment Configuration

Edit `.env`:

```bash
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://flowhq_user:your_secure_password@localhost:5432/flowhq
ADMIN_PASSWORD=your_very_secure_admin_password
PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
RATE_LIMIT_MAX_PER_MINUTE=10
HEARTBEAT_INTERVAL_MS=30000
STALE_THRESHOLD_MINUTES=2
```

#### 5. Run Database Migrations

```bash
cd packages/shared
npx prisma migrate deploy
```

#### 6. Start with PM2

```bash
# Start control plane
pm2 start ecosystem.config.js

# Save PM2 config to restart on boot
pm2 save
pm2 startup
```

#### 7. Setup Nginx (Reverse Proxy)

```bash
sudo apt-get install -y nginx

# Create config
sudo tee /etc/nginx/sites-available/flowhq << 'EOF'
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

# Enable site
sudo ln -s /etc/nginx/sites-available/flowhq /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

#### 8. Setup SSL (Let's Encrypt)

```bash
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

### Verification Steps

After deployment, verify:

1. **Control Plane**: Access https://your-domain.com/admin/tenants
2. **Database**: Check connection logs
3. **Create Test Tenant**: Create a tenant and verify it appears in the list
4. **Start Worker**: Click "Start" and check PM2 status: `pm2 list`
5. **Health Dashboard**: Verify "Last Seen" column updates every 30 seconds
6. **Rate Limiting**: Send 11+ messages quickly, verify rate limit warning
7. **Stress Test**: Run the stress test script:
   ```bash
   npx tsx scripts/stress-test.ts
   ```

### Monitoring & Maintenance

#### View Logs

```bash
# Control plane logs
pm2 logs control-plane

# Worker logs (specific tenant)
tail -f logs/<tenant-id>.log

# All PM2 logs
pm2 logs
```

#### Check Worker Health

```bash
# PM2 status
pm2 list

# Database check
psql $DATABASE_URL -c "SELECT id, name, status FROM tenants;"
```

#### Restart Services

```bash
# Restart control plane
pm2 restart control-plane

# Restart specific worker
pm2 restart worker-<tenant-id>

# Restart all
pm2 restart all
```

### Security Checklist

- [ ] Change default admin password
- [ ] Use strong PostgreSQL password
- [ ] Enable firewall (ufw) - allow only 22, 80, 443
- [ ] Setup fail2ban
- [ ] Regular security updates: `sudo apt-get update && sudo apt-get upgrade`
- [ ] Backup database regularly
- [ ] Store session files securely (sessions/ directory)

### Troubleshooting Production

#### Worker won't start

1. Check Chrome path: `which chromium-browser`
2. Verify PUPPETEER_EXECUTABLE_PATH is set correctly
3. Check worker logs: `pm2 logs worker-<tenant-id>`

#### Stale workers

- Dashboard shows "STALE" when worker hasn't sent heartbeat for 2+ minutes
- Auto-marked as ERROR by control-plane
- Use "Force Restart" button to recover

#### Database connection issues

```bash
# Test connection
psql $DATABASE_URL -c "SELECT 1;"

# Check PostgreSQL status
sudo systemctl status postgresql
```

## Stability Features

This release includes production hardening:

- **Multi-tenant isolation**: Verified by stress-test script
- **Global error boundary**: Workers never crash on message errors
- **Rate limiting**: 10 replies/minute per tenant (configurable)
- **Heartbeat monitoring**: 30-second health updates
- **Disconnect recovery**: Exponential backoff reconnect
- **Per-chat queue**: Sequential message processing
- **Message de-duplication**: Prevents duplicate processing
- **Stale worker detection**: Auto-mark workers without heartbeat
- **Worker lifecycle safety**: Prevents duplicate starts

## License

MIT
