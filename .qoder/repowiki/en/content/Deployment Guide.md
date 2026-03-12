# Deployment Guide

<cite>
**Referenced Files in This Document**
- [README.md](file://README.md)
- [package.json](file://package.json)
- [ecosystem.config.js](file://ecosystem.config.js)
- [.env.example](file://.env.example)
- [apps/control-plane/package.json](file://apps/control-plane/package.json)
- [apps/control-plane/src/server.ts](file://apps/control-plane/src/server.ts)
- [apps/control-plane/src/middleware/auth.ts](file://apps/control-plane/src/middleware/auth.ts)
- [apps/control-plane/src/routes/admin.ts](file://apps/control-plane/src/routes/admin.ts)
- [apps/worker/src/worker.ts](file://apps/worker/src/worker.ts)
- [apps/web/next.config.js](file://apps/web/next.config.js)
- [packages/shared/src/prisma/schema.prisma](file://packages/shared/src/prisma/schema.prisma)
- [packages/shared/src/utils/logger.ts](file://packages/shared/src/utils/logger.ts)
- [.github/workflows/ci.yml](file://.github/workflows/ci.yml)
- [.github/workflows/deploy.yml](file://.github/workflows/deploy.yml)
- [scripts/deploy.sh](file://scripts/deploy.sh)
</cite>

## Update Summary
**Changes Made**
- Added comprehensive CI/CD workflow documentation with GitHub Actions
- Updated deployment procedures to include automated testing and deployment
- Enhanced package management documentation with workspace configuration
- Added new deployment script documentation with zero-downtime deployment
- Updated architecture diagrams to reflect the new CI/CD pipeline

## Table of Contents
1. [Introduction](#introduction)
2. [Project Structure](#project-structure)
3. [Core Components](#core-components)
4. [Architecture Overview](#architecture-overview)
5. [CI/CD Pipeline](#cicd-pipeline)
6. [Detailed Component Analysis](#detailed-component-analysis)
7. [Dependency Analysis](#dependency-analysis)
8. [Performance Considerations](#performance-considerations)
9. [Troubleshooting Guide](#troubleshooting-guide)
10. [Conclusion](#conclusion)
11. [Appendices](#appendices)

## Introduction
This guide provides end-to-end deployment instructions for the Flow HQ platform on a production VPS running Ubuntu/Debian. It covers system prerequisites, PostgreSQL setup, application builds, PM2 process management, reverse proxy configuration with Nginx, SSL certificates with Let's Encrypt, environment configuration, and production verification. The platform now includes automated CI/CD workflows with GitHub Actions for continuous integration and deployment, along with enhanced package management using npm workspaces for better separation of concerns.

## Project Structure
The platform consists of:
- Control Plane: Admin API and dashboard (Express + EJS)
- Worker: Per-tenant WhatsApp bot process (whatsapp-web.js)
- Shared: Common types, Prisma client, and utilities
- Web: Next.js frontend that proxies API calls to the Control Plane
- Sessions and Logs: Persistent directories for session data and logs
- CI/CD: Automated testing and deployment workflows

```mermaid
graph TB
subgraph "GitHub Repository"
subgraph "CI/CD Workflows"
CI["CI Workflow<br/>Type Check & Build"]
DEPLOY["Deploy Workflow<br/>Production Deployment"]
END
subgraph "Source Code"
CONTROL["Control Plane<br/>@chatisha/control-plane"]
WORKER["Worker<br/>@chatisha/worker"]
SHARED["Shared<br/>@chatisha/shared"]
WEB["Web<br/>@chatisha/web"]
END
end
subgraph "VPS"
subgraph "Control Plane"
CP_API["Express API<br/>Port 3000"]
CP_AUTH["Admin Auth Middleware"]
CP_ROUTES["Admin Routes"]
CP_DB["Prisma Client"]
end
subgraph "Worker"
W_PROC["PM2 Worker Process<br/>Per Tenant"]
W_BOT["WhatsAppBot"]
W_SESS["Sessions Storage"]
W_LOGS["Tenant Logs"]
end
subgraph "Web Frontend"
WEB_NEXT["Next.js App"]
WEB_PROXY["Rewrite /api/control-plane/* -> localhost:3000"]
end
subgraph "Infrastructure"
DB["PostgreSQL"]
NGINX["Nginx Reverse Proxy"]
PM2["PM2 Process Manager"]
OS["Ubuntu/Debian OS"]
end
end
CI --> CONTROL
CI --> WORKER
CI --> SHARED
CI --> WEB
DEPLOY --> OS
OS --> CP_API
OS --> W_PROC
OS --> WEB_NEXT
WEB_NEXT --> WEB_PROXY
WEB_PROXY --> CP_API
CP_API --> CP_AUTH
CP_API --> CP_ROUTES
CP_ROUTES --> W_PROC
W_PROC --> W_BOT
W_BOT --> W_SESS
W_BOT --> W_LOGS
CP_API --> CP_DB
CP_DB --> DB
NGINX --> CP_API
PM2 --> CP_API
PM2 --> W_PROC
OS --> NGINX
OS --> PM2
```

**Diagram sources**
- [.github/workflows/ci.yml](file://.github/workflows/ci.yml#L1-L79)
- [.github/workflows/deploy.yml](file://.github/workflows/deploy.yml#L1-L42)
- [apps/control-plane/src/server.ts](file://apps/control-plane/src/server.ts#L10-L89)
- [apps/control-plane/src/middleware/auth.ts](file://apps/control-plane/src/middleware/auth.ts#L1-L40)
- [apps/control-plane/src/routes/admin.ts](file://apps/control-plane/src/routes/admin.ts#L174-L332)
- [apps/worker/src/worker.ts](file://apps/worker/src/worker.ts#L1-L46)
- [apps/web/next.config.js](file://apps/web/next.config.js#L1-L17)
- [packages/shared/src/prisma/schema.prisma](file://packages/shared/src/prisma/schema.prisma#L1-L178)

**Section sources**
- [README.md](file://README.md#L119-L132)
- [package.json](file://package.json#L5-L8)

## Core Components
- Control Plane API: Validates environment, connects to PostgreSQL, exposes admin and portal endpoints, and manages stale workers.
- Worker: Starts per-tenant WhatsApp sessions, persists sessions, and writes tenant-specific logs.
- Shared: Provides Prisma schema, logger utilities, and common types.
- Web: Rewrites API traffic to the Control Plane for the portal.
- CI/CD Pipeline: Automated testing and deployment workflows using GitHub Actions.

Key deployment scripts and configuration:
- Root build and workspace scripts are defined at the root with npm workspaces support.
- PM2 configuration defines the Control Plane process and logging.
- Environment variables define database, admin credentials, ports, logging, and worker behavior.
- CI/CD workflows automate testing and deployment processes.

**Section sources**
- [package.json](file://package.json#L9-L16)
- [ecosystem.config.js](file://ecosystem.config.js#L1-L19)
- [.env.example](file://.env.example#L1-L22)
- [apps/control-plane/src/server.ts](file://apps/control-plane/src/server.ts#L16-L39)
- [apps/control-plane/src/routes/admin.ts](file://apps/control-plane/src/routes/admin.ts#L174-L230)
- [apps/worker/src/worker.ts](file://apps/worker/src/worker.ts#L7-L24)
- [packages/shared/src/utils/logger.ts](file://packages/shared/src/utils/logger.ts#L5-L30)
- [apps/web/next.config.js](file://apps/web/next.config.js#L6-L13)
- [.github/workflows/ci.yml](file://.github/workflows/ci.yml#L10-L79)
- [.github/workflows/deploy.yml](file://.github/workflows/deploy.yml#L14-L42)

## Architecture Overview
The Control Plane runs on port 3000 and is proxied by Nginx. The Web app proxies API calls to the Control Plane. PM2 manages the Control Plane and per-tenant Worker processes. PostgreSQL stores tenant, session, and messaging data. Sessions and logs are persisted on disk. The CI/CD pipeline automates testing and deployment processes.

```mermaid
sequenceDiagram
participant Dev as "Developer"
participant GitHub as "GitHub Actions"
participant Server as "Production Server"
participant PM2 as "PM2 Process Manager"
participant DB as "PostgreSQL"
Dev->>GitHub : Push code to main branch
GitHub->>GitHub : CI Workflow : Type Check & Build
GitHub->>Server : Deploy Workflow via SSH
Server->>Server : scripts/deploy.sh
Server->>DB : Run Prisma migrations
Server->>PM2 : Reload ecosystem.config.js
PM2->>PM2 : Zero-downtime reload
PM2->>Server : Services restarted
Server-->>Dev : Deployment complete
```

**Diagram sources**
- [.github/workflows/ci.yml](file://.github/workflows/ci.yml#L3-L7)
- [.github/workflows/deploy.yml](file://.github/workflows/deploy.yml#L23-L33)
- [scripts/deploy.sh](file://scripts/deploy.sh#L30-L42)
- [ecosystem.config.js](file://ecosystem.config.js#L38-L41)

## CI/CD Pipeline

### Continuous Integration (CI) Workflow
The CI workflow automates testing and building of all workspace packages:

- **Triggers**: Runs on push to any branch and pull requests to main
- **Services**: Uses PostgreSQL 14 container for testing database operations
- **Environment**: Sets up Node.js 18.19.0 with npm cache
- **Steps**: 
  - Checks out code and sets up Node.js environment
  - Installs dependencies with `npm ci`
  - Generates Prisma client from shared package
  - Runs database migrations on CI database
  - Builds shared, control-plane, worker, and web packages
  - Performs type checking for control-plane and worker

```mermaid
flowchart TD
Start(["Push/Pull Request"]) --> Checkout["Checkout Code"]
Checkout --> SetupNode["Setup Node.js 18.19.0"]
SetupNode --> InstallDeps["Install Dependencies (npm ci)"]
InstallDeps --> SetupDB["Setup PostgreSQL Service"]
SetupDB --> GeneratePrisma["Generate Prisma Client"]
GeneratePrisma --> MigrateDB["Run DB Migrations"]
MigrateDB --> BuildShared["Build Shared Package"]
BuildShared --> BuildControlPlane["Build Control Plane"]
BuildControlPlane --> BuildWorker["Build Worker"]
BuildWorker --> BuildWeb["Build Web (Next.js)"]
BuildWeb --> TypeCheck["Type Check Control Plane & Worker"]
TypeCheck --> Complete(["CI Complete"])
```

**Diagram sources**
- [.github/workflows/ci.yml](file://.github/workflows/ci.yml#L33-L78)

**Section sources**
- [.github/workflows/ci.yml](file://.github/workflows/ci.yml#L1-L79)

### Continuous Deployment (CD) Workflow
The deployment workflow handles production deployments:

- **Triggers**: Runs on push to main branch or manual trigger via GitHub UI
- **Concurrency**: Ensures only one deployment runs at a time
- **SSH Deployment**: Uses appleboy/ssh-action to connect to production server
- **Zero-Downtime**: Calls deployment script that reloads PM2 processes

```mermaid
flowchart TD
Trigger(["Push to main or Manual Trigger"]) --> Concurrency["Check Concurrency Group"]
Concurrency --> SSH["SSH to Production Server"]
SSH --> Script["Execute scripts/deploy.sh"]
Script --> Pull["Git Pull Latest Code"]
Pull --> InstallDeps["Install Dependencies (--omit=dev)"]
InstallDeps --> GeneratePrisma["Generate Prisma Client"]
GeneratePrisma --> MigrateDB["Run DB Migrations"]
MigrateDB --> BuildPackages["Build All Packages in Order"]
BuildPackages --> ReloadPM2["Reload PM2 Processes"]
ReloadPM2 --> Success(["Deployment Complete"])
```

**Diagram sources**
- [.github/workflows/deploy.yml](file://.github/workflows/deploy.yml#L3-L33)

**Section sources**
- [.github/workflows/deploy.yml](file://.github/workflows/deploy.yml#L1-L42)

### Deployment Script
The deployment script (`scripts/deploy.sh`) handles production deployments:

- **Zero-Downtime**: Uses `pm2 reload` instead of restart for seamless updates
- **Dependency Management**: Installs production dependencies only (`--omit=dev`)
- **Build Order**: Builds packages in correct dependency order (shared → control-plane → worker → web)
- **Environment Updates**: Reloads PM2 with `--update-env` flag

**Section sources**
- [scripts/deploy.sh](file://scripts/deploy.sh#L1-L43)

## Detailed Component Analysis

### VPS Setup (Ubuntu/Debian)
Follow the official steps to prepare the system:
- Update and upgrade the system.
- Install Node.js 18+, PostgreSQL, PM2 globally, Chromium for whatsapp-web.js, and Git.
- Create the application directory and clone the repository.
- Install dependencies for each workspace and build the applications.
- Configure environment variables and run database migrations.

Verification steps include accessing the admin dashboard, verifying database connectivity, creating a test tenant, starting a worker, and running the stress test.

**Section sources**
- [README.md](file://README.md#L265-L352)
- [README.md](file://README.md#L392-L406)

### PostgreSQL Database Configuration
- Create the database and user with appropriate privileges.
- Set the DATABASE_URL environment variable to match the database host, user, password, and port.
- Run Prisma migrations in production to apply schema changes.

```mermaid
flowchart TD
Start(["Start"]) --> CreateDB["Create database and user"]
CreateDB --> SetURL["Set DATABASE_URL in .env"]
SetURL --> Migrate["Run Prisma migrate deploy"]
Migrate --> Verify["Verify connection and schema"]
Verify --> End(["Done"])
```

**Diagram sources**
- [README.md](file://README.md#L290-L301)
- [README.md](file://README.md#L336-L341)
- [.env.example](file://.env.example#L2)

**Section sources**
- [README.md](file://README.md#L290-L301)
- [README.md](file://README.md#L336-L341)
- [.env.example](file://.env.example#L2)

### PM2 Process Management
- PM2 configuration defines the Control Plane process with production environment, logging, and restart policies.
- Start the Control Plane with PM2 and save the configuration to enable auto-start on boot.
- Workers are started dynamically by the Control Plane via PM2 using per-tenant names and environment variables.

```mermaid
sequenceDiagram
participant Admin as "Admin Action"
participant CP as "Control Plane"
participant PM2 as "PM2"
participant Worker as "Worker Process"
Admin->>CP : POST /admin/tenants/ : id/worker/start
CP->>PM2 : pm2 start worker.js --name "worker-<tenant>" --env TENANT_ID
PM2-->>CP : Started
CP->>CP : Update DB status to RUNNING
CP-->>Admin : Success
```

**Diagram sources**
- [apps/control-plane/src/routes/admin.ts](file://apps/control-plane/src/routes/admin.ts#L174-L230)
- [ecosystem.config.js](file://ecosystem.config.js#L1-L19)

**Section sources**
- [ecosystem.config.js](file://ecosystem.config.js#L1-L19)
- [apps/control-plane/src/routes/admin.ts](file://apps/control-plane/src/routes/admin.ts#L174-L230)

### Reverse Proxy with Nginx
- Install Nginx and configure a site to proxy HTTP traffic to the Control Plane on port 3000.
- Enable the site, test the configuration, and restart Nginx.
- Obtain SSL certificates using Certbot with the Nginx plugin for automatic HTTPS.

```mermaid
flowchart TD
A["HTTP Request"] --> B["Nginx listens on 80"]
B --> C["Proxy to http://localhost:3000"]
C --> D["Control Plane responds"]
D --> E["Optional: Let's Encrypt via Certbot"]
```

**Diagram sources**
- [README.md](file://README.md#L354-L383)
- [README.md](file://README.md#L385-L390)

**Section sources**
- [README.md](file://README.md#L354-L383)
- [README.md](file://README.md#L385-L390)

### Environment Configuration
Critical environment variables include:
- DATABASE_URL: PostgreSQL connection string
- ADMIN_PASSWORD: Admin dashboard password
- PORTAL_INTERNAL_KEY: Shared secret for internal portal API
- NODE_ENV, PORT, LOG_LEVEL: Runtime and logging settings
- SESSIONS_PATH, LOGS_PATH: Paths for persistent data
- Worker tuning: RATE_LIMIT_MAX_PER_MINUTE, HEARTBEAT_INTERVAL_MS, STALE_THRESHOLD_MINUTES, STALE_CHECK_INTERVAL_MS
- PUPPETEER_EXECUTABLE_PATH: Path to Chromium for whatsapp-web.js

Ensure these are set in the production environment and validated by the Control Plane on startup.

**Section sources**
- [.env.example](file://.env.example#L1-L22)
- [apps/control-plane/src/server.ts](file://apps/control-plane/src/server.ts#L16-L39)
- [apps/control-plane/src/server.ts](file://apps/control-plane/src/server.ts#L54-L63)

### SSL Certificate Setup with Let's Encrypt
- Install Certbot with the Nginx plugin.
- Obtain and automatically configure the certificate for your domain.
- Renewals are handled automatically by Certbot.

**Section sources**
- [README.md](file://README.md#L385-L390)

### Production Verification Procedures
- Access the admin dashboard over HTTPS and authenticate with ADMIN_PASSWORD.
- Confirm database connectivity and create a test tenant.
- Start a worker and verify PM2 status.
- Monitor the health dashboard for periodic updates.
- Validate rate limiting and run the stress test to confirm multi-tenant isolation.

**Section sources**
- [README.md](file://README.md#L392-L406)

### Monitoring and Maintenance
- View Control Plane logs via PM2 and tail tenant-specific logs.
- Check PM2 status and database connectivity regularly.
- Restart services as needed using PM2 commands.

**Section sources**
- [README.md](file://README.md#L407-L443)

### Log Management
- Centralized logging uses Pino with pretty output to console and tenant-specific files under logs/.
- The logger creates the logs directory if it does not exist and rotates logs via file transport.

**Section sources**
- [packages/shared/src/utils/logger.ts](file://packages/shared/src/utils/logger.ts#L5-L30)

### Backup Strategies and Disaster Recovery
- Back up PostgreSQL databases regularly using pg_dump or your cloud provider's backup solution.
- Back up the sessions/ directory to preserve WhatsApp session data.
- Maintain offsite backups and test restoration procedures.

### Scaling Considerations
- Horizontal scaling: Run multiple Control Plane instances behind a load balancer and share the PostgreSQL database.
- Worker scaling: Each tenant runs a dedicated Worker process managed by PM2; ensure sufficient CPU/RAM per tenant workload.
- Database scaling: Use managed PostgreSQL with read replicas and proper indexing aligned to the schema.

## Dependency Analysis
The Control Plane depends on Prisma for database operations and uses PM2 to manage itself and Workers. The Worker depends on the shared package and external libraries for WhatsApp integration. The Web app proxies API calls to the Control Plane. The CI/CD pipeline coordinates these dependencies across multiple packages.

```mermaid
graph LR
CP_PKG["Control Plane Package.json"] --> CP_DEPS["@chatisha/shared", "express", "pm2"]
W_PKG["Worker Package.json"] --> W_DEPS["@chatisha/shared", "whatsapp-web.js"]
SH_PKG["Shared Package.json"] --> SH_DEPS["@prisma/client", "pino"]
WEB_PKG["Web Package.json"] --> WEB_DEPS["@chatisha/shared", "next"]
CI_WORKFLOW["CI Workflow"] --> BUILD_ORDER["Build Order: Shared → Control Plane → Worker → Web"]
CD_WORKFLOW["CD Workflow"] --> DEPLOY_SCRIPT["scripts/deploy.sh"]
DEPLOY_SCRIPT --> ZERO_DOWNTIME["Zero-Downtime Reload"]
```

**Diagram sources**
- [apps/control-plane/package.json](file://apps/control-plane/package.json#L9-L18)
- [apps/worker/package.json](file://apps/worker/package.json#L9-L14)
- [packages/shared/package.json](file://packages/shared/package.json#L12-L15)
- [apps/web/package.json](file://apps/web/package.json#L10-L20)
- [.github/workflows/ci.yml](file://.github/workflows/ci.yml#L52-L70)
- [scripts/deploy.sh](file://scripts/deploy.sh#L24-L35)

**Section sources**
- [apps/control-plane/package.json](file://apps/control-plane/package.json#L9-L18)
- [apps/worker/package.json](file://apps/worker/package.json#L9-L14)
- [packages/shared/package.json](file://packages/shared/package.json#L12-L15)
- [apps/web/package.json](file://apps/web/package.json#L10-L20)
- [.github/workflows/ci.yml](file://.github/workflows/ci.yml#L52-L70)
- [scripts/deploy.sh](file://scripts/deploy.sh#L24-L35)

## Performance Considerations
- Tune rate limiting and heartbeat intervals to balance responsiveness and resource usage.
- Monitor memory usage and set PM2 max_memory_restart thresholds appropriately.
- Use a reverse proxy and caching layer for static assets if needed.
- Optimize database queries and maintain indexes as the dataset grows.
- Leverage CI/CD pipeline benefits: automated testing reduces production risks and improves deployment reliability.

## Troubleshooting Guide
Common production issues and resolutions:
- Worker fails to start: Verify Chromium path and PUPPETEER_EXECUTABLE_PATH, check worker logs via PM2, and ensure sessions directory permissions.
- Stale workers: The Control Plane marks workers as ERROR after exceeding STALE_THRESHOLD_MINUTES; use Force Restart from the admin panel.
- Database connection failures: Test connectivity with psql and verify PostgreSQL service status.
- Admin authentication: Ensure ADMIN_PASSWORD is set and matches the value used for Basic Auth or query parameter.
- CI/CD failures: Check GitHub Actions logs for specific error messages, verify secrets are properly configured, and ensure all workspace dependencies are installed.

**Section sources**
- [README.md](file://README.md#L455-L477)
- [apps/control-plane/src/server.ts](file://apps/control-plane/src/server.ts#L34-L38)
- [apps/control-plane/src/routes/admin.ts](file://apps/control-plane/src/routes/admin.ts#L30-L80)
- [.github/workflows/ci.yml](file://.github/workflows/ci.yml#L14-L27)
- [.github/workflows/deploy.yml](file://.github/workflows/deploy.yml#L23-L33)

## Conclusion
By following this deployment guide, you can reliably operate Flow HQ on a production VPS with automated CI/CD workflows. The platform now includes comprehensive automation for testing and deployment, enhanced package management with npm workspaces, and improved deployment procedures with zero-downtime updates. Ensure all prerequisites are met, environment variables are correctly configured, PM2 manages processes, Nginx proxies traffic, SSL is enabled, and the CI/CD pipeline is properly configured. Monitor logs, maintain backups, and validate performance and stability with the provided verification steps.

## Appendices

### A. Environment Variables Reference
- DATABASE_URL: PostgreSQL connection string
- ADMIN_PASSWORD: Admin dashboard password
- PORTAL_INTERNAL_KEY: Shared internal API key
- NODE_ENV: Environment (development/production)
- PORT: API server port
- LOG_LEVEL: Logging level
- SESSIONS_PATH: WhatsApp session storage path
- LOGS_PATH: Log files path
- RATE_LIMIT_MAX_PER_MINUTE: Rate limit per tenant
- HEARTBEAT_INTERVAL_MS: Worker heartbeat interval
- STALE_THRESHOLD_MINUTES: Threshold for stale worker detection
- STALE_CHECK_INTERVAL_MS: Interval to check stale workers
- PUPPETEER_EXECUTABLE_PATH: Path to Chromium binary

**Section sources**
- [.env.example](file://.env.example#L1-L22)

### B. Control Plane Startup and Validation
- Validate environment variables and database connectivity during startup.
- Start stale worker checker on interval.
- Redirect root to admin tenants page.

**Section sources**
- [apps/control-plane/src/server.ts](file://apps/control-plane/src/server.ts#L16-L39)
- [apps/control-plane/src/server.ts](file://apps/control-plane/src/server.ts#L54-L76)

### C. Worker Lifecycle Management
- Start worker with PM2 using TENANT_ID and SESSIONS_PATH.
- Graceful shutdown on SIGTERM/SIGINT.
- Uncaught exceptions and rejections are logged and handled.

**Section sources**
- [apps/control-plane/src/routes/admin.ts](file://apps/control-plane/src/routes/admin.ts#L174-L230)
- [apps/worker/src/worker.ts](file://apps/worker/src/worker.ts#L26-L45)

### D. Web API Proxy Configuration
- Next.js rewrites /api/control-plane/* to the Control Plane on localhost:3000.

**Section sources**
- [apps/web/next.config.js](file://apps/web/next.config.js#L6-L13)

### E. CI/CD Pipeline Configuration
- **CI Workflow**: Automated testing with PostgreSQL service, type checking, and multi-package builds
- **Deploy Workflow**: SSH-based deployment with concurrency control and zero-downtime updates
- **Workspace Management**: npm workspaces configuration for efficient dependency management

**Section sources**
- [.github/workflows/ci.yml](file://.github/workflows/ci.yml#L1-L79)
- [.github/workflows/deploy.yml](file://.github/workflows/deploy.yml#L1-L42)
- [package.json](file://package.json#L5-L8)

### F. Deployment Script Details
- **Zero-Downtime**: Uses `pm2 reload` for seamless service updates
- **Dependency Optimization**: Installs production dependencies only (`--omit=dev`)
- **Build Order**: Ensures correct dependency resolution across packages
- **Environment Updates**: Reloads PM2 with updated environment variables

**Section sources**
- [scripts/deploy.sh](file://scripts/deploy.sh#L1-L43)