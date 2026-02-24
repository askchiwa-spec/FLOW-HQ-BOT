# Tenant Creation and Configuration

<cite>
**Referenced Files in This Document**
- [schema.prisma](file://packages/shared/src/prisma/schema.prisma)
- [admin.ts](file://apps/control-plane/src/routes/admin.ts)
- [portal.ts](file://apps/control-plane/src/routes/portal.ts)
- [tenants.ejs](file://apps/control-plane/src/views/tenants.ejs)
- [tenant-detail.ejs](file://apps/control-plane/src/views/tenant-detail.ejs)
- [bot.ts](file://apps/worker/src/bot.ts)
- [auth.ts](file://apps/web/src/lib/auth.ts)
- [setup-request/route.ts](file://apps/web/src/app/api/portal/setup-request/route.ts)
- [current/status/route.ts](file://apps/web/src/app/api/portal/tenant/current/status/route.ts)
- [current/qr/route.ts](file://apps/web/src/app/api/portal/tenant/current/qr/route.ts)
- [current/logs/route.ts](file://apps/web/src/app/api/portal/tenant/current/logs/route.ts)
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

## Introduction
This document explains the tenant creation and configuration lifecycle in Flow HQ. It covers how tenants are created, configured, and managed through the control plane, how tenant status evolves during setup and operation, and how tenant-specific data is isolated and secured. It also documents the control plane’s administrative capabilities and the portal’s tenant-centric APIs that delegate to the control plane.

## Project Structure
The tenant lifecycle spans three main areas:
- Shared data model: defines Tenant, TenantConfig, and related entities with Prisma schema.
- Control plane: exposes administrative routes for tenant CRUD, worker lifecycle, QR retrieval, and setup request management.
- Web portal: provides tenant-facing APIs that proxy to the control plane and enforce internal keys and user identity.

```mermaid
graph TB
subgraph "Shared Model"
PRISMA["Prisma Schema<br/>Tenant, TenantConfig,<br/>WhatsAppSession, WorkerProcess,<br/>MessageLog, SetupRequest"]
end
subgraph "Control Plane"
ADMIN["Admin Routes<br/>GET/POST /admin/tenants<br/>Worker lifecycle<br/>QR & Logs"]
PORTAL["Portal Routes<br/>GET /portal/me<br/>POST /portal/setup-request<br/>GET /portal/tenant/current/*"]
VIEWS["Admin Views<br/>tenants.ejs<br/>tenant-detail.ejs"]
end
subgraph "Web Portal"
AUTH["NextAuth Sign-In<br/>Creates Tenant/User on first sign-in"]
API_SETUP["POST /api/portal/setup-request"]
API_STATUS["GET /api/portal/tenant/current/status"]
API_QR["GET /api/portal/tenant/current/qr"]
API_LOGS["GET /api/portal/tenant/current/logs"]
end
subgraph "Worker"
BOT["WhatsAppBot<br/>QR handling, READY, DISCONNECTED,<br/>Heartbeat, Message handling"]
end
AUTH --> PRISMA
API_SETUP --> PORTAL
API_STATUS --> PORTAL
API_QR --> PORTAL
API_LOGS --> PORTAL
PORTAL --> PRISMA
ADMIN --> PRISMA
VIEWS --> ADMIN
BOT --> PRISMA
BOT --> ADMIN
```

**Diagram sources**
- [schema.prisma](file://packages/shared/src/prisma/schema.prisma#L60-L164)
- [admin.ts](file://apps/control-plane/src/routes/admin.ts#L82-L140)
- [portal.ts](file://apps/control-plane/src/routes/portal.ts#L52-L243)
- [tenants.ejs](file://apps/control-plane/src/views/tenants.ejs#L40-L136)
- [tenant-detail.ejs](file://apps/control-plane/src/views/tenant-detail.ejs#L43-L169)
- [bot.ts](file://apps/worker/src/bot.ts#L77-L226)

**Section sources**
- [schema.prisma](file://packages/shared/src/prisma/schema.prisma#L60-L164)
- [admin.ts](file://apps/control-plane/src/routes/admin.ts#L82-L140)
- [portal.ts](file://apps/control-plane/src/routes/portal.ts#L52-L243)
- [tenants.ejs](file://apps/control-plane/src/views/tenants.ejs#L40-L136)
- [tenant-detail.ejs](file://apps/control-plane/src/views/tenant-detail.ejs#L43-L169)
- [bot.ts](file://apps/worker/src/bot.ts#L77-L226)

## Core Components
- Tenant: top-level entity representing a customer tenant with status and timestamps.
- TenantConfig: tenant-scoped configuration persisted via TenantConfig model.
- WhatsAppSession: per-tenant WhatsApp session state and QR data.
- WorkerProcess: per-tenant worker lifecycle and status.
- SetupRequest: tenant onboarding request with status transitions.
- MessageLog: tenant-scoped message audit trail.
- Portal routes: tenant-centric APIs that validate internal keys and user identity.
- Control plane admin routes: administrative operations for tenant lifecycle and diagnostics.

**Section sources**
- [schema.prisma](file://packages/shared/src/prisma/schema.prisma#L60-L164)
- [portal.ts](file://apps/control-plane/src/routes/portal.ts#L85-L153)
- [admin.ts](file://apps/control-plane/src/routes/admin.ts#L104-L140)

## Architecture Overview
The tenant lifecycle is orchestrated by the control plane with the worker implementing WhatsApp events and status updates. The portal delegates tenant operations to the control plane via internal key and user identity checks.

```mermaid
sequenceDiagram
participant User as "User"
participant Web as "Web Portal API"
participant CP as "Control Plane Portal Routes"
participant DB as "Prisma Client"
participant Bot as "Worker WhatsAppBot"
User->>Web : Submit setup request
Web->>CP : POST /portal/setup-request (x-portal-key, x-user-email)
CP->>DB : Upsert TenantConfig, Create SetupRequest, Update Tenant status
CP-->>Web : SetupRequest details
Web-->>User : Created
User->>Web : Start worker
Web->>CP : POST /admin/tenants/ : id/worker/start
CP->>DB : Update WorkerProcess status, Tenant status
CP-->>Web : Started
Bot->>DB : On QR -> update WhatsAppSession state
Bot->>DB : On READY -> update Tenant status ACTIVE
Bot->>DB : Heartbeat -> update last_seen_at and WorkerProcess status
```

**Diagram sources**
- [setup-request/route.ts](file://apps/web/src/app/api/portal/setup-request/route.ts#L8-L34)
- [portal.ts](file://apps/control-plane/src/routes/portal.ts#L85-L153)
- [admin.ts](file://apps/control-plane/src/routes/admin.ts#L174-L230)
- [bot.ts](file://apps/worker/src/bot.ts#L77-L151)

## Detailed Component Analysis

### Tenant Status Lifecycle
Tenant status transitions are central to the lifecycle:
- NEW: Initial tenant created.
- PENDING: After a setup request is submitted by the tenant.
- APPROVED: Admin approves setup request; worker starts.
- QR_PENDING: Worker started and waiting for QR.
- ACTIVE: WhatsApp client connected and operational.
- PAUSED: Admin-controlled pause.
- ERROR: Worker or session error state.

```mermaid
stateDiagram-v2
[*] --> NEW
NEW --> PENDING : "Setup request submitted"
PENDING --> APPROVED : "Admin approves"
APPROVED --> QR_PENDING : "Worker start"
QR_PENDING --> ACTIVE : "Connected"
ACTIVE --> PAUSED : "Admin pause"
PAUSED --> ACTIVE : "Admin resume"
ACTIVE --> ERROR : "Disconnect / Auth failure"
QR_PENDING --> ERROR : "Worker stale or failure"
APPROVED --> ERROR : "Worker start failure"
ERROR --> QR_PENDING : "Force restart"
ERROR --> ACTIVE : "Reconnect succeeds"
```

**Diagram sources**
- [schema.prisma](file://packages/shared/src/prisma/schema.prisma#L10-L16)
- [portal.ts](file://apps/control-plane/src/routes/portal.ts#L132-L136)
- [admin.ts](file://apps/control-plane/src/routes/admin.ts#L211-L214)
- [bot.ts](file://apps/worker/src/bot.ts#L185-L225)

**Section sources**
- [schema.prisma](file://packages/shared/src/prisma/schema.prisma#L10-L16)
- [portal.ts](file://apps/control-plane/src/routes/portal.ts#L132-L136)
- [admin.ts](file://apps/control-plane/src/routes/admin.ts#L211-L214)
- [bot.ts](file://apps/worker/src/bot.ts#L185-L225)

### Tenant Creation Workflow
There are two primary creation paths:
- First-time sign-in via NextAuth: automatically creates Tenant and User.
- Administrative creation via control plane: creates Tenant, TenantConfig, WhatsAppSession, and WorkerProcess.

```mermaid
sequenceDiagram
participant Google as "Google OAuth"
participant Auth as "NextAuth Callbacks"
participant DB as "Prisma Client"
Google-->>Auth : User info
Auth->>DB : Create Tenant (NEW)
Auth->>DB : Create User (OWNER) linked to Tenant
Auth-->>Google : Signed in
```

**Diagram sources**
- [auth.ts](file://apps/web/src/lib/auth.ts#L15-L46)

```mermaid
sequenceDiagram
participant Admin as "Admin UI"
participant AdminRoute as "Admin Route"
participant DB as "Prisma Client"
Admin->>AdminRoute : POST /admin/tenants
AdminRoute->>DB : Create Tenant
AdminRoute->>DB : Create TenantConfig
AdminRoute->>DB : Create WhatsAppSession
AdminRoute->>DB : Create WorkerProcess
AdminRoute-->>Admin : Tenant with relations
```

**Diagram sources**
- [admin.ts](file://apps/control-plane/src/routes/admin.ts#L104-L140)

**Section sources**
- [auth.ts](file://apps/web/src/lib/auth.ts#L15-L46)
- [admin.ts](file://apps/control-plane/src/routes/admin.ts#L104-L140)

### Configuration Persistence with TenantConfig
- The portal’s setup request endpoint upserts TenantConfig and creates SetupRequest.
- The worker loads TenantConfig on readiness to apply template and language settings.

```mermaid
flowchart TD
Start(["Submit Setup Request"]) --> LoadUser["Load user and tenant"]
LoadUser --> UpsertConfig["Upsert TenantConfig"]
UpsertConfig --> CreateRequest["Create SetupRequest"]
CreateRequest --> UpdateTenant["Update Tenant status to PENDING"]
UpdateTenant --> LogEvent["Log SETUP_REQUEST_SUBMITTED"]
LogEvent --> End(["Done"])
```

**Diagram sources**
- [portal.ts](file://apps/control-plane/src/routes/portal.ts#L85-L153)

**Section sources**
- [portal.ts](file://apps/control-plane/src/routes/portal.ts#L85-L153)
- [bot.ts](file://apps/worker/src/bot.ts#L228-L246)

### Setup Request Processing
- The portal validates internal key and user identity, then persists the request and updates status.
- Admin can approve or reject setup requests, which triggers worker start and status updates.

```mermaid
sequenceDiagram
participant Portal as "Portal API"
participant CP as "Control Plane Portal Routes"
participant AdminUI as "Admin UI"
participant AdminCP as "Admin Routes"
participant DB as "Prisma Client"
Portal->>CP : POST /portal/setup-request
CP->>DB : Upsert TenantConfig, Create SetupRequest, Update Tenant status
AdminUI->>AdminCP : Approve Setup Request
AdminCP->>DB : Update SetupRequest status APPROVED
AdminCP->>DB : Start Worker (PM2)
AdminCP->>DB : Update WorkerProcess and Tenant status
CP-->>Portal : Created SetupRequest
AdminCP-->>AdminUI : Approved
```

**Diagram sources**
- [setup-request/route.ts](file://apps/web/src/app/api/portal/setup-request/route.ts#L8-L34)
- [portal.ts](file://apps/control-plane/src/routes/portal.ts#L85-L153)
- [admin.ts](file://apps/control-plane/src/routes/admin.ts#L419-L489)

**Section sources**
- [setup-request/route.ts](file://apps/web/src/app/api/portal/setup-request/route.ts#L8-L34)
- [portal.ts](file://apps/control-plane/src/routes/portal.ts#L85-L153)
- [admin.ts](file://apps/control-plane/src/routes/admin.ts#L419-L489)

### QR Generation and Status Updates
- Worker emits QR events; the control plane stores QR as a data URI and updates session state.
- The portal exposes tenant QR retrieval for the current user.

```mermaid
sequenceDiagram
participant Bot as "Worker WhatsAppBot"
participant DB as "Prisma Client"
participant AdminUI as "Admin UI"
participant PortalAPI as "Portal API"
participant CP as "Control Plane Portal Routes"
Bot->>DB : Save QR as data URI (QR_READY)
AdminUI->>AdminUI : Poll /admin/tenants/ : id/qr
PortalAPI->>CP : GET /portal/tenant/current/qr
CP->>DB : Fetch WhatsAppSession
CP-->>PortalAPI : {state, qr}
PortalAPI-->>AdminUI : QR data
```

**Diagram sources**
- [bot.ts](file://apps/worker/src/bot.ts#L77-L96)
- [admin.ts](file://apps/control-plane/src/routes/admin.ts#L334-L352)
- [current/qr/route.ts](file://apps/web/src/app/api/portal/tenant/current/qr/route.ts#L8-L34)
- [portal.ts](file://apps/control-plane/src/routes/portal.ts#L192-L216)

**Section sources**
- [bot.ts](file://apps/worker/src/bot.ts#L77-L96)
- [admin.ts](file://apps/control-plane/src/routes/admin.ts#L334-L352)
- [current/qr/route.ts](file://apps/web/src/app/api/portal/tenant/current/qr/route.ts#L8-L34)
- [portal.ts](file://apps/control-plane/src/routes/portal.ts#L192-L216)

### Tenant Isolation and Security Boundaries
- Database isolation: each record includes tenant_id foreign keys ensuring tenant-scoped queries.
- Control plane enforcement: portal routes require x-portal-key and x-user-email headers to bind requests to a specific tenant.
- Worker isolation: worker runs per tenant with dedicated session storage and PM2 process naming.

```mermaid
graph LR
PortalAPI["Portal API"] --> |x-portal-key| CP["Control Plane"]
PortalAPI --> |x-user-email| CP
CP --> DB["Prisma Client"]
CP --> Worker["PM2 Worker Process"]
Worker --> DB
```

**Diagram sources**
- [portal.ts](file://apps/control-plane/src/routes/portal.ts#L12-L25)
- [bot.ts](file://apps/worker/src/bot.ts#L58-L75)

**Section sources**
- [portal.ts](file://apps/control-plane/src/routes/portal.ts#L12-L25)
- [bot.ts](file://apps/worker/src/bot.ts#L58-L75)

### Administrative Controls Through Control Plane
- Tenant listing and detail views with status, session state, and worker status.
- Worker lifecycle: start, stop, restart, and force restart with PM2 orchestration.
- Stale worker detection: marks workers and tenants as ERROR if no heartbeat within threshold.

```mermaid
flowchart TD
A["Admin UI"] --> B["GET /admin/tenants"]
A --> C["GET /admin/tenants/:id"]
A --> D["POST /admin/tenants/:id/worker/start"]
A --> E["POST /admin/tenants/:id/worker/stop"]
A --> F["POST /admin/tenants/:id/worker/restart"]
A --> G["POST /admin/tenants/:id/worker/force-restart"]
D --> H["Update WorkerProcess + Tenant status"]
G --> H
```

**Diagram sources**
- [tenants.ejs](file://apps/control-plane/src/views/tenants.ejs#L76-L136)
- [tenant-detail.ejs](file://apps/control-plane/src/views/tenant-detail.ejs#L119-L169)
- [admin.ts](file://apps/control-plane/src/routes/admin.ts#L174-L332)

**Section sources**
- [tenants.ejs](file://apps/control-plane/src/views/tenants.ejs#L76-L136)
- [tenant-detail.ejs](file://apps/control-plane/src/views/tenant-detail.ejs#L119-L169)
- [admin.ts](file://apps/control-plane/src/routes/admin.ts#L174-L332)

## Dependency Analysis
The following diagram maps key dependencies among tenant-related components:

```mermaid
classDiagram
class Tenant {
+string id
+string name
+string phone_number
+TenantStatus status
+DateTime created_at
+DateTime updated_at
}
class TenantConfig {
+string id
+string tenant_id
+TemplateType template_type
+string business_name
+Language language
+Json hours_json
}
class WhatsAppSession {
+string id
+string tenant_id
+SessionState state
+string last_qr
+DateTime last_seen_at
}
class WorkerProcess {
+string id
+string tenant_id
+string pm2_name
+WorkerStatus status
+string last_error
}
class MessageLog {
+string id
+string tenant_id
+MessageDirection direction
+string from_number
+string to_number
+string message_text
+DateTime created_at
}
class SetupRequest {
+string id
+string tenant_id
+string user_id
+TemplateType template_type
+string whatsapp_number
+SetupRequestStatus status
}
Tenant --> TenantConfig : "one-to-one"
Tenant --> WhatsAppSession : "one-to-one"
Tenant --> WorkerProcess : "one-to-one"
Tenant --> MessageLog : "one-to-many"
Tenant --> SetupRequest : "one-to-many"
Tenant --> User : "optional"
User --> SetupRequest : "one-to-many"
```

**Diagram sources**
- [schema.prisma](file://packages/shared/src/prisma/schema.prisma#L60-L164)

**Section sources**
- [schema.prisma](file://packages/shared/src/prisma/schema.prisma#L60-L164)

## Performance Considerations
- Worker heartbeat interval and stale detection: tune HEARTBEAT_INTERVAL_MS and STALE_THRESHOLD_MINUTES to balance responsiveness and load.
- Rate limiting and queueing: the worker enforces rate limits and chat queues to prevent overload and ensure ordered replies.
- Indexing: tenant_id indexed on MessageLog and PortalEventLog supports efficient tenant-scoped queries.

[No sources needed since this section provides general guidance]

## Troubleshooting Guide
Common scenarios and remedies:
- Tenant status stuck in QR_PENDING: confirm worker started and PM2 process is online; trigger force restart if needed.
- Frequent ERROR status: check worker logs, session storage permissions, and network connectivity; review last_error in WorkerProcess.
- No QR appearing: ensure worker is running and emitting QR events; poll /admin/tenants/:id/qr until QR appears.
- Portal unauthorized errors: verify x-portal-key and x-user-email headers are present and correct.

**Section sources**
- [admin.ts](file://apps/control-plane/src/routes/admin.ts#L174-L332)
- [bot.ts](file://apps/worker/src/bot.ts#L333-L359)

## Conclusion
Flow HQ implements a robust tenant lifecycle with clear status transitions, strong tenant isolation via database relations and control plane enforcement, and a reliable worker-driven WhatsApp integration. Administrators manage tenants and workers through the control plane, while tenants interact via the portal APIs that delegate to the control plane with strict authentication and authorization.