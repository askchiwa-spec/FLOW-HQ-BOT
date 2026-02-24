# Data Flow Architecture

<cite>
**Referenced Files in This Document**
- [schema.prisma](file://packages/shared/src/prisma/schema.prisma)
- [prisma.ts](file://apps/web/src/lib/prisma.ts)
- [auth.ts](file://apps/web/src/lib/auth.ts)
- [server.ts](file://apps/control-plane/src/server.ts)
- [auth-middleware.ts](file://apps/control-plane/src/middleware/auth.ts)
- [admin-routes.ts](file://apps/control-plane/src/routes/admin.ts)
- [worker.ts](file://apps/worker/src/worker.ts)
- [bot.ts](file://apps/worker/src/bot.ts)
- [web-setup-request-route.ts](file://apps/web/src/app/api/portal/setup-request/route.ts)
- [web-current-status-route.ts](file://apps/web/src/app/api/portal/tenant/current/status/route.ts)
- [web-current-logs-route.ts](file://apps/web/src/app/api/portal/tenant/current/logs/route.ts)
- [logger.ts](file://packages/shared/src/utils/logger.ts)
</cite>

## Table of Contents
1. [Introduction](#introduction)
2. [Project Structure](#project-structure)
3. [Core Components](#core-components)
4. [Architecture Overview](#architecture-overview)
5. [Detailed Component Analysis](#detailed-component-analysis)
6. [Dependency Analysis](#dependency-analysis)
7. [Performance Considerations](#performance-considerations)
8. [Troubleshooting Guide](#troubleshooting-guide)
9. [Conclusion](#conclusion)
10. [Appendices](#appendices)

## Introduction
This document explains the complete data flow across the system, from user authentication through tenant creation, worker process initialization, WhatsApp Web message processing, and response generation. It documents multi-tenant data isolation patterns, database transaction flows, inter-component communication, message flows between the web portal, control plane, and worker processes, along with data validation, error propagation, and audit trail mechanisms. It also maps Prisma models to real-world data transformations.

## Project Structure
The system is organized into three primary applications:
- Web portal: Next.js frontend with authentication and API routes that proxy to the control plane.
- Control plane: Express server managing administrative operations, tenant lifecycle, worker orchestration, and audit logging.
- Worker: Per-tenant process that runs WhatsApp Web automation and handles inbound/outbound messaging.

```mermaid
graph TB
subgraph "Web Portal"
WEB_AUTH["NextAuth (Google)"]
WEB_API_SETUP["Portal Setup Request API"]
WEB_API_STATUS["Portal Current Status API"]
WEB_API_LOGS["Portal Logs API"]
end
subgraph "Control Plane"
CP_SERVER["Express Server"]
CP_ADMIN["Admin Routes"]
CP_AUTH_MW["Auth Middleware"]
CP_DB["Prisma Client"]
end
subgraph "Worker"
W_WORKER["Worker Bootstrap"]
W_BOT["WhatsAppBot"]
W_DB["Prisma Client"]
end
subgraph "WhatsApp Web"
WA_WEB["WhatsApp Web Client"]
end
WEB_AUTH --> CP_DB
WEB_API_SETUP --> CP_SERVER
WEB_API_STATUS --> CP_SERVER
WEB_API_LOGS --> CP_SERVER
CP_SERVER --> CP_ADMIN
CP_SERVER --> CP_AUTH_MW
CP_ADMIN --> CP_DB
CP_ADMIN --> W_WORKER
W_WORKER --> W_BOT
W_BOT --> W_DB
W_BOT --> WA_WEB
```

**Diagram sources**
- [server.ts](file://apps/control-plane/src/server.ts#L1-L89)
- [auth-middleware.ts](file://apps/control-plane/src/middleware/auth.ts#L1-L40)
- [admin-routes.ts](file://apps/control-plane/src/routes/admin.ts#L1-L528)
- [worker.ts](file://apps/worker/src/worker.ts#L1-L46)
- [bot.ts](file://apps/worker/src/bot.ts#L1-L411)
- [auth.ts](file://apps/web/src/lib/auth.ts#L1-L76)
- [web-setup-request-route.ts](file://apps/web/src/app/api/portal/setup-request/route.ts#L1-L40)
- [web-current-status-route.ts](file://apps/web/src/app/api/portal/tenant/current/status/route.ts#L1-L35)
- [web-current-logs-route.ts](file://apps/web/src/app/api/portal/tenant/current/logs/route.ts#L1-L35)

**Section sources**
- [server.ts](file://apps/control-plane/src/server.ts#L1-L89)
- [auth.ts](file://apps/web/src/lib/auth.ts#L1-L76)

## Core Components
- Prisma models define multi-tenant entities and their relationships, ensuring isolation via tenant_id and cascading deletes.
- Web portal authenticates users and proxies requests to the control plane with internal keys and user context.
- Control plane validates environment, manages tenant lifecycle, starts/stops workers, and maintains audit trails.
- Worker process initializes WhatsApp Web, processes messages, enforces rate limits, deduplicates, queues chats, and updates status.

**Section sources**
- [schema.prisma](file://packages/shared/src/prisma/schema.prisma#L60-L177)
- [prisma.ts](file://apps/web/src/lib/prisma.ts#L1-L10)
- [auth.ts](file://apps/web/src/lib/auth.ts#L14-L70)
- [server.ts](file://apps/control-plane/src/server.ts#L16-L89)
- [admin-routes.ts](file://apps/control-plane/src/routes/admin.ts#L104-L140)
- [worker.ts](file://apps/worker/src/worker.ts#L1-L46)
- [bot.ts](file://apps/worker/src/bot.ts#L12-L75)

## Architecture Overview
The system follows a strict separation of concerns:
- Authentication and session management in the web portal.
- Administrative control and orchestration in the control plane.
- Per-tenant automation in isolated worker processes.
- Persistent state stored in PostgreSQL via Prisma.

```mermaid
sequenceDiagram
participant U as "User"
participant WP as "Web Portal"
participant CP as "Control Plane"
participant DB as "PostgreSQL (Prisma)"
participant WK as "Worker"
U->>WP : "Sign in with Google"
WP->>DB : "Create Tenant/User on first sign-in"
WP->>CP : "POST /portal/setup-request (with internal key)"
CP->>DB : "Create SetupRequest"
U->>WP : "GET /portal/tenant/current/status"
WP->>CP : "GET /portal/tenant/current/status"
CP->>DB : "Read Tenant/Session/Worker"
CP-->>WP : "Status response"
U->>WP : "Admin action : Start Worker"
WP->>CP : "POST /admin/tenants/ : id/worker/start"
CP->>WK : "pm2 start worker with TENANT_ID"
CP->>DB : "Update WorkerProcess/Tenant status"
WK->>DB : "Heartbeat updates last_seen_at"
WK->>DB : "Log message events"
```

**Diagram sources**
- [auth.ts](file://apps/web/src/lib/auth.ts#L14-L46)
- [web-setup-request-route.ts](file://apps/web/src/app/api/portal/setup-request/route.ts#L8-L34)
- [web-current-status-route.ts](file://apps/web/src/app/api/portal/tenant/current/status/route.ts#L8-L29)
- [admin-routes.ts](file://apps/control-plane/src/routes/admin.ts#L174-L230)
- [worker.ts](file://apps/worker/src/worker.ts#L17-L24)
- [bot.ts](file://apps/worker/src/bot.ts#L333-L359)

## Detailed Component Analysis

### Authentication and Multi-Tenant Creation
- On first sign-in via Google, the web portal creates a Tenant and associated entities (session and worker) and links a User to the Tenant.
- Subsequent sessions enrich the session with tenant context and role.

```mermaid
sequenceDiagram
participant G as "Google OAuth"
participant NA as "NextAuth"
participant DB as "Prisma"
participant TP as "Tenant Provisioning"
G-->>NA : "Callback with user info"
NA->>DB : "Find user by email"
alt "User not found"
NA->>DB : "Create Tenant (NEW)"
NA->>DB : "Create WhatsAppSession"
NA->>DB : "Create WorkerProcess"
NA->>DB : "Create User (OWNER) linked to Tenant"
else "User exists"
NA->>DB : "Load User with Tenant"
end
NA-->>G : "Session with tenantId and role"
```

**Diagram sources**
- [auth.ts](file://apps/web/src/lib/auth.ts#L14-L70)
- [prisma.ts](file://apps/web/src/lib/prisma.ts#L1-L10)

**Section sources**
- [auth.ts](file://apps/web/src/lib/auth.ts#L14-L70)

### Control Plane Orchestration and Worker Lifecycle
- Validates environment and database connectivity.
- Exposes admin endpoints to manage tenants, workers, and QR retrieval.
- Starts/stops/restarts workers via PM2, updating WorkerProcess and Tenant statuses accordingly.
- Periodically marks stale workers based on session heartbeat.

```mermaid
sequenceDiagram
participant Admin as "Admin UI"
participant CP as "Control Plane"
participant PM2 as "PM2"
participant DB as "Prisma"
participant WK as "Worker"
Admin->>CP : "POST /admin/tenants/ : id/worker/start"
CP->>DB : "Read WorkerProcess"
CP->>PM2 : "pm2 start worker.js --env TENANT_ID"
CP->>DB : "Update WorkerProcess status=RUNNING"
CP->>DB : "Update Tenant status=QR_PENDING"
PM2-->>WK : "Spawn worker process"
WK->>DB : "Heartbeat last_seen_at"
CP->>DB : "Periodic check : markStaleWorkers()"
```

**Diagram sources**
- [server.ts](file://apps/control-plane/src/server.ts#L54-L81)
- [admin-routes.ts](file://apps/control-plane/src/routes/admin.ts#L174-L230)
- [admin-routes.ts](file://apps/control-plane/src/routes/admin.ts#L30-L80)
- [worker.ts](file://apps/worker/src/worker.ts#L17-L24)

**Section sources**
- [server.ts](file://apps/control-plane/src/server.ts#L16-L89)
- [admin-routes.ts](file://apps/control-plane/src/routes/admin.ts#L174-L230)
- [admin-routes.ts](file://apps/control-plane/src/routes/admin.ts#L30-L80)

### Worker Message Processing Pipeline
- Initializes WhatsApp Web client with local auth and session persistence.
- Handles QR generation, connection readiness, disconnections, and auth failures.
- Processes inbound messages with deduplication, rate limiting, and chat queue ordering.
- Generates outbound replies and logs both directions.
- Maintains heartbeat to keep Tenant and WorkerProcess healthy.

```mermaid
flowchart TD
Start(["Worker Start"]) --> InitDB["Connect to DB"]
InitDB --> LoadCfg["Load Tenant Config"]
LoadCfg --> InitWA["Initialize WhatsApp Client"]
InitWA --> Ready{"Client Ready?"}
Ready --> |No| Retry["Reconnect Manager"]
Ready --> |Yes| Heartbeat["Start Heartbeat"]
Heartbeat --> Listen["Listen for Messages"]
Listen --> Dedup["Check Duplicate"]
Dedup --> |Duplicate| Skip["Skip Message"]
Dedup --> |New| Queue["Enqueue Chat"]
Queue --> RateLimit["Check Rate Limit"]
RateLimit --> |Exceeded| Warn["Send Warning"]
RateLimit --> |Allowed| Reply["Generate Template Response"]
Reply --> LogOut["Log Outgoing Message"]
LogOut --> UpdateSeen["Update last_seen_at"]
UpdateSeen --> Listen
Retry --> Ready
```

**Diagram sources**
- [bot.ts](file://apps/worker/src/bot.ts#L369-L392)
- [bot.ts](file://apps/worker/src/bot.ts#L153-L183)
- [bot.ts](file://apps/worker/src/bot.ts#L248-L331)
- [bot.ts](file://apps/worker/src/bot.ts#L333-L359)

**Section sources**
- [bot.ts](file://apps/worker/src/bot.ts#L12-L75)
- [bot.ts](file://apps/worker/src/bot.ts#L153-L183)
- [bot.ts](file://apps/worker/src/bot.ts#L248-L331)
- [bot.ts](file://apps/worker/src/bot.ts#L333-L359)

### Web Portal Interactions and Proxying
- Setup request submission is proxied to the control plane with an internal key and user email header.
- Current status and logs endpoints similarly proxy to the control plane using the internal key and user context.

```mermaid
sequenceDiagram
participant Client as "Web Client"
participant Portal as "Portal API Route"
participant CP as "Control Plane"
participant DB as "Prisma"
Client->>Portal : "POST /portal/setup-request"
Portal->>CP : "Forward with x-portal-key and x-user-email"
CP->>DB : "Create SetupRequest"
CP-->>Portal : "SetupRequest data"
Portal-->>Client : "JSON response"
Client->>Portal : "GET /portal/tenant/current/status"
Portal->>CP : "Forward with x-portal-key and x-user-email"
CP->>DB : "Read Tenant/Session/Worker"
CP-->>Portal : "Status JSON"
Portal-->>Client : "Status JSON"
```

**Diagram sources**
- [web-setup-request-route.ts](file://apps/web/src/app/api/portal/setup-request/route.ts#L8-L34)
- [web-current-status-route.ts](file://apps/web/src/app/api/portal/tenant/current/status/route.ts#L8-L29)
- [web-current-logs-route.ts](file://apps/web/src/app/api/portal/tenant/current/logs/route.ts#L8-L29)

**Section sources**
- [web-setup-request-route.ts](file://apps/web/src/app/api/portal/setup-request/route.ts#L1-L40)
- [web-current-status-route.ts](file://apps/web/src/app/api/portal/tenant/current/status/route.ts#L1-L35)
- [web-current-logs-route.ts](file://apps/web/src/app/api/portal/tenant/current/logs/route.ts#L1-L35)

### Data Validation, Error Propagation, and Audit Trails
- Environment validation ensures required variables are present and database connectivity is established.
- Worker catches unhandled exceptions and logs them to the database without crashing the process.
- Control plane routes update WorkerProcess and Tenant status on success/failure and log portal events.
- Message logs capture both directions and are indexed by tenant and timestamp for efficient queries.

```mermaid
flowchart TD
Env["Validate Environment"] --> DBConn["Connect to DB"]
DBConn --> OK{"Success?"}
OK --> |No| Exit["Exit with error"]
OK --> |Yes| Run["Start Services"]
subgraph "Worker Error Handling"
EH_Start["Message Handler"] --> TryMsg["Try to handle"]
TryMsg --> Err{"Error?"}
Err --> |Yes| LogErr["Update WorkerProcess.last_error"]
LogErr --> Continue["Continue processing"]
Err --> |No| Done["Complete"]
end
subgraph "Control Plane Auditing"
CP_Start["Admin Action"] --> Update["Update DB records"]
Update --> Event["Create PortalEventLog"]
Event --> CP_End["Return response"]
end
```

**Diagram sources**
- [server.ts](file://apps/control-plane/src/server.ts#L16-L39)
- [bot.ts](file://apps/worker/src/bot.ts#L313-L331)
- [admin-routes.ts](file://apps/control-plane/src/routes/admin.ts#L476-L482)
- [schema.prisma](file://packages/shared/src/prisma/schema.prisma#L105-L118)

**Section sources**
- [server.ts](file://apps/control-plane/src/server.ts#L16-L39)
- [bot.ts](file://apps/worker/src/bot.ts#L313-L331)
- [admin-routes.ts](file://apps/control-plane/src/routes/admin.ts#L476-L482)
- [schema.prisma](file://packages/shared/src/prisma/schema.prisma#L105-L118)

## Dependency Analysis
The following diagram shows key dependencies among modules and their roles in the data flow.

```mermaid
graph LR
WEB_AUTH["apps/web/src/lib/auth.ts"] --> PRISMA_WEB["apps/web/src/lib/prisma.ts"]
WEB_SETUP["apps/web/src/app/api/portal/setup-request/route.ts"] --> CP_SERVER["apps/control-plane/src/server.ts"]
WEB_STATUS["apps/web/src/app/api/portal/tenant/current/status/route.ts"] --> CP_SERVER
WEB_LOGS["apps/web/src/app/api/portal/tenant/current/logs/route.ts"] --> CP_SERVER
CP_SERVER --> CP_ADMIN["apps/control-plane/src/routes/admin.ts"]
CP_SERVER --> AUTH_MW["apps/control-plane/src/middleware/auth.ts"]
CP_ADMIN --> PRISMA_SHARED["packages/shared/src/prisma/schema.prisma"]
CP_ADMIN --> PM2["PM2"]
WK_BOOT["apps/worker/src/worker.ts"] --> WK_BOT["apps/worker/src/bot.ts"]
WK_BOT --> PRISMA_SHARED
LOG_UTIL["packages/shared/src/utils/logger.ts"] --> WK_BOT
LOG_UTIL --> CP_ADMIN
```

**Diagram sources**
- [auth.ts](file://apps/web/src/lib/auth.ts#L1-L76)
- [prisma.ts](file://apps/web/src/lib/prisma.ts#L1-L10)
- [web-setup-request-route.ts](file://apps/web/src/app/api/portal/setup-request/route.ts#L1-L40)
- [web-current-status-route.ts](file://apps/web/src/app/api/portal/tenant/current/status/route.ts#L1-L35)
- [web-current-logs-route.ts](file://apps/web/src/app/api/portal/tenant/current/logs/route.ts#L1-L35)
- [server.ts](file://apps/control-plane/src/server.ts#L1-L89)
- [auth-middleware.ts](file://apps/control-plane/src/middleware/auth.ts#L1-L40)
- [admin-routes.ts](file://apps/control-plane/src/routes/admin.ts#L1-L528)
- [worker.ts](file://apps/worker/src/worker.ts#L1-L46)
- [bot.ts](file://apps/worker/src/bot.ts#L1-L411)
- [logger.ts](file://packages/shared/src/utils/logger.ts#L1-L33)
- [schema.prisma](file://packages/shared/src/prisma/schema.prisma#L1-L178)

**Section sources**
- [schema.prisma](file://packages/shared/src/prisma/schema.prisma#L60-L177)
- [admin-routes.ts](file://apps/control-plane/src/routes/admin.ts#L104-L140)
- [bot.ts](file://apps/worker/src/bot.ts#L369-L392)

## Performance Considerations
- Rate limiting prevents flooding and ensures fair usage per tenant.
- Chat queue serializes processing per chat to avoid conflicts.
- Heartbeat intervals maintain liveness and enable stale detection.
- Indexes on tenant_id and timestamps optimize log queries.
- PM2 process management enables graceful restarts and resource isolation.

[No sources needed since this section provides general guidance]

## Troubleshooting Guide
- Worker fails to start: Verify environment variables, PM2 installation, and Puppeteer executable path. Check WorkerProcess last_error and Tenant status.
- Stale workers: The control plane periodically sets WorkerProcess status to ERROR and Tenant status to ERROR if no heartbeat is received within the configured threshold.
- Authentication failures: Worker updates Tenant and WorkerProcess status to ERROR on auth failure; inspect last_error for details.
- Logging: Tenant-specific logs are written to dedicated files under the logs directory; global logs are pretty-printed to console.

**Section sources**
- [server.ts](file://apps/control-plane/src/server.ts#L34-L38)
- [admin-routes.ts](file://apps/control-plane/src/routes/admin.ts#L30-L80)
- [bot.ts](file://apps/worker/src/bot.ts#L210-L225)
- [logger.ts](file://packages/shared/src/utils/logger.ts#L1-L33)

## Conclusion
The system implements robust multi-tenant isolation, reliable worker orchestration, and comprehensive auditing. Data flows consistently through Prisma-managed models, with clear boundaries between the web portal, control plane, and worker processes. Validation, error handling, and heartbeat mechanisms ensure resilience and observability across the entire lifecycle.

[No sources needed since this section summarizes without analyzing specific files]

## Appendices

### Prisma Model Relationships and Data Transformations
```mermaid
erDiagram
TENANT {
uuid id PK
string name
string phone_number
enum status
timestamp created_at
timestamp updated_at
}
TENANT_CONFIG {
uuid id PK
uuid tenant_id UK
enum template_type
string business_name
enum language
json hours_json
timestamp created_at
timestamp updated_at
}
WHATSAPP_SESSION {
uuid id PK
uuid tenant_id UK
enum state
string last_qr
timestamp last_seen_at
timestamp created_at
timestamp updated_at
}
MESSAGE_LOG {
uuid id PK
uuid tenant_id
enum direction
string from_number
string to_number
string message_text
string wa_message_id
timestamp created_at
}
WORKER_PROCESS {
uuid id PK
uuid tenant_id UK
string pm2_name
enum status
string last_error
timestamp created_at
timestamp updated_at
}
USER {
uuid id PK
uuid tenant_id UK
string name
string email UK
string phone
enum role
timestamp created_at
timestamp updated_at
}
SETUP_REQUEST {
uuid id PK
uuid tenant_id
uuid user_id
enum template_type
string whatsapp_number
enum status
string notes
timestamp created_at
timestamp updated_at
}
PORTAL_EVENT_LOG {
uuid id PK
uuid tenant_id
uuid user_id
string event_type
json payload_json
timestamp created_at
}
TENANT ||--o| TENANT_CONFIG : "has"
TENANT ||--o| WHATSAPP_SESSION : "has"
TENANT ||--o{ MESSAGE_LOG : "generates"
TENANT ||--o| WORKER_PROCESS : "has"
TENANT ||--o{ SETUP_REQUEST : "initiates"
USER ||--o{ SETUP_REQUEST : "submits"
USER ||--o{ PORTAL_EVENT_LOG : "triggers"
TENANT ||--o{ PORTAL_EVENT_LOG : "audits"
```

**Diagram sources**
- [schema.prisma](file://packages/shared/src/prisma/schema.prisma#L60-L177)