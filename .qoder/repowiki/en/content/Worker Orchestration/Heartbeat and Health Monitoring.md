# Heartbeat and Health Monitoring

<cite>
**Referenced Files in This Document**
- [server.ts](file://apps/control-plane/src/server.ts)
- [admin.ts](file://apps/control-plane/src/routes/admin.ts)
- [bot.ts](file://apps/worker/src/bot.ts)
- [schema.prisma](file://packages/shared/src/prisma/schema.prisma)
- [page.tsx](file://apps/web/src/app/(portal)/app/status/page.tsx)
- [route.ts](file://apps/web/src/app/api/portal/tenant/current/status/route.ts)
- [portal.ts](file://apps/control-plane/src/routes/portal.ts)
- [reconnect.ts](file://apps/worker/src/utils/reconnect.ts)
- [chat-queue.ts](file://apps/worker/src/utils/chat-queue.ts)
- [dedup.ts](file://apps/worker/src/utils/dedup.ts)
- [ecosystem.config.js](file://ecosystem.config.js)
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
This document explains the heartbeat monitoring and worker health-check system used to track the operational status of tenant-specific workers and maintain synchronization with tenant status. It covers:
- How the heartbeat mechanism works in the worker
- How stale workers are detected and marked
- How last_seen_at timestamps are tracked and used
- How health check intervals are configured and executed
- Practical configuration examples and monitoring integrations
- Network timeout handling and recovery from heartbeat failures
- The relationship between worker health and tenant status synchronization

## Project Structure
The heartbeat and health monitoring spans three main areas:
- Control plane server that schedules periodic stale-worker detection
- Worker process that sends heartbeats and updates session/worker status
- Frontend portal that surfaces status and integrates with the control plane

```mermaid
graph TB
subgraph "Control Plane"
CP_Server["Control Plane Server<br/>server.ts"]
CP_Admin["Admin Routes<br/>admin.ts"]
CP_Portal["Portal Routes<br/>portal.ts"]
end
subgraph "Worker"
W_Bot["WhatsAppBot<br/>bot.ts"]
W_Reconnect["Reconnect Manager<br/>reconnect.ts"]
W_ChatQ["Chat Queue<br/>chat-queue.ts"]
W_Dedup["Deduplicator<br/>dedup.ts"]
end
subgraph "Frontend"
FE_Status["Status Page<br/>page.tsx"]
FE_API["Portal Status API<br/>route.ts"]
end
subgraph "Database"
DB_Schema["Prisma Schema<br/>schema.prisma"]
end
CP_Server --> CP_Admin
CP_Server --> CP_Portal
W_Bot --> DB_Schema
CP_Admin --> DB_Schema
CP_Portal --> DB_Schema
FE_API --> CP_Portal
FE_Status --> FE_API
W_Bot --> W_Reconnect
W_Bot --> W_ChatQ
W_Bot --> W_Dedup
```

**Diagram sources**
- [server.ts](file://apps/control-plane/src/server.ts#L54-L63)
- [admin.ts](file://apps/control-plane/src/routes/admin.ts#L30-L80)
- [portal.ts](file://apps/control-plane/src/routes/portal.ts#L159-L186)
- [bot.ts](file://apps/worker/src/bot.ts#L333-L359)
- [page.tsx](file://apps/web/src/app/(portal)/app/status/page.tsx#L24-L44)
- [route.ts](file://apps/web/src/app/api/portal/tenant/current/status/route.ts#L8-L34)
- [schema.prisma](file://packages/shared/src/prisma/schema.prisma#L92-L131)

**Section sources**
- [server.ts](file://apps/control-plane/src/server.ts#L54-L63)
- [admin.ts](file://apps/control-plane/src/routes/admin.ts#L30-L80)
- [portal.ts](file://apps/control-plane/src/routes/portal.ts#L159-L186)
- [bot.ts](file://apps/worker/src/bot.ts#L333-L359)
- [page.tsx](file://apps/web/src/app/(portal)/app/status/page.tsx#L24-L44)
- [route.ts](file://apps/web/src/app/api/portal/tenant/current/status/route.ts#L8-L34)
- [schema.prisma](file://packages/shared/src/prisma/schema.prisma#L92-L131)

## Core Components
- Heartbeat sender in the worker: Periodically updates the session’s last_seen_at and worker status.
- Stale worker detector in the control plane: Periodically scans RUNNING workers whose sessions exceed a configurable staleness threshold and marks them ERROR, cascading tenant status to ERROR.
- Status API and portal page: Expose tenant and session status to the frontend for monitoring dashboards.
- Database schema: Defines tenant, session, and worker-process entities and their relationships.

Key responsibilities:
- Worker: Send heartbeat, update status, handle disconnections, and reconnect with exponential backoff.
- Control plane: Run periodic stale-worker checks and synchronize tenant status.
- Frontend: Poll status via internal API and display health indicators.

**Section sources**
- [bot.ts](file://apps/worker/src/bot.ts#L333-L359)
- [admin.ts](file://apps/control-plane/src/routes/admin.ts#L30-L80)
- [portal.ts](file://apps/control-plane/src/routes/portal.ts#L159-L186)
- [schema.prisma](file://packages/shared/src/prisma/schema.prisma#L92-L131)

## Architecture Overview
The heartbeat and health monitoring architecture consists of:
- Worker process that maintains a WhatsApp session and periodically writes last_seen_at to the database and sets worker status to RUNNING.
- Control plane server that runs a periodic job to detect stale workers by comparing last_seen_at against a staleness threshold and updates worker and tenant statuses accordingly.
- Portal routes protected by an internal key that expose tenant status and session info to the frontend.
- Frontend polling the portal API to render live status.

```mermaid
sequenceDiagram
participant Worker as "Worker Process<br/>bot.ts"
participant DB as "Database<br/>schema.prisma"
participant ControlPlane as "Control Plane<br/>server.ts + admin.ts"
participant Portal as "Portal Routes<br/>portal.ts"
participant Frontend as "Status Page<br/>page.tsx"
Worker->>DB : "Update last_seen_at + status=RUNNING"
ControlPlane->>DB : "Query RUNNING workers with stale last_seen_at"
ControlPlane->>DB : "Update worker status=ERROR + tenant status=ERROR"
Frontend->>Portal : "GET /portal/tenant/current/status"
Portal->>DB : "Fetch tenant + session + worker"
Portal-->>Frontend : "JSON status payload"
```

**Diagram sources**
- [bot.ts](file://apps/worker/src/bot.ts#L333-L359)
- [admin.ts](file://apps/control-plane/src/routes/admin.ts#L30-L80)
- [portal.ts](file://apps/control-plane/src/routes/portal.ts#L159-L186)
- [page.tsx](file://apps/web/src/app/(portal)/app/status/page.tsx#L24-L44)

## Detailed Component Analysis

### Heartbeat Mechanism in the Worker
The worker sends periodic heartbeats to keep the session alive and signal health:
- Interval is configurable via HEARTBEAT_INTERVAL_MS (default 30000 ms).
- On each heartbeat:
  - Updates the session’s last_seen_at to the current time.
  - Sets the worker process status to RUNNING.
- Heartbeat is started after successful readiness and stopped on disconnection.

```mermaid
flowchart TD
Start(["Heartbeat Tick"]) --> UpdateSession["Update session last_seen_at"]
UpdateSession --> UpdateWorker["Set worker status=RUNNING"]
UpdateWorker --> LogDebug["Log debug info"]
LogDebug --> End(["Wait next interval"])
```

**Diagram sources**
- [bot.ts](file://apps/worker/src/bot.ts#L333-L359)

**Section sources**
- [bot.ts](file://apps/worker/src/bot.ts#L333-L359)

### Stale Worker Detection and Automatic Status Updates
The control plane periodically detects stale workers:
- Interval is configurable via STALE_CHECK_INTERVAL_MS (default 60000 ms).
- Threshold is configurable via STALE_THRESHOLD_MINUTES (default 2 minutes).
- Detection logic:
  - Find RUNNING workers whose tenant’s session last_seen_at is earlier than (now - threshold).
  - For each stale worker:
    - Update worker status to ERROR and set last_error.
    - Update tenant status to ERROR.
- Logging tracks warnings and informational summaries.

```mermaid
flowchart TD
Init(["Periodic Check"]) --> CalcThreshold["Compute stale threshold"]
CalcThreshold --> QueryWorkers["Find RUNNING workers with stale last_seen_at"]
QueryWorkers --> HasStale{"Any stale workers?"}
HasStale --> |No| Done(["Exit"])
HasStale --> |Yes| Loop["For each stale worker"]
Loop --> MarkWorker["Set worker status=ERROR + last_error"]
MarkWorker --> MarkTenant["Set tenant status=ERROR"]
MarkTenant --> Next["Next stale worker"]
Next --> |More| Loop
Next --> |Done| LogInfo["Log summary"]
LogInfo --> Done
```

**Diagram sources**
- [server.ts](file://apps/control-plane/src/server.ts#L54-L63)
- [admin.ts](file://apps/control-plane/src/routes/admin.ts#L30-L80)

**Section sources**
- [server.ts](file://apps/control-plane/src/server.ts#L54-L63)
- [admin.ts](file://apps/control-plane/src/routes/admin.ts#L30-L80)

### last_seen_at Timestamp Tracking
The worker updates last_seen_at on:
- Ready event (after successful WhatsApp client initialization).
- Every heartbeat tick.
- After handling each incoming message.

The control plane uses last_seen_at to determine staleness.

```mermaid
sequenceDiagram
participant Bot as "WhatsAppBot<br/>bot.ts"
participant DB as "Database<br/>schema.prisma"
Bot->>DB : "Update session last_seen_at on ready"
Bot->>DB : "Update session last_seen_at on heartbeat"
Bot->>DB : "Update session last_seen_at on message handled"
```

**Diagram sources**
- [bot.ts](file://apps/worker/src/bot.ts#L98-L151)
- [bot.ts](file://apps/worker/src/bot.ts#L333-L359)
- [bot.ts](file://apps/worker/src/bot.ts#L307-L311)

**Section sources**
- [bot.ts](file://apps/worker/src/bot.ts#L98-L151)
- [bot.ts](file://apps/worker/src/bot.ts#L333-L359)
- [bot.ts](file://apps/worker/src/bot.ts#L307-L311)

### Health Check Intervals and Configuration
- Worker heartbeat interval:
  - Environment: HEARTBEAT_INTERVAL_MS (default 30000 ms).
  - Implementation: Uses parsed integer from environment.
- Control plane stale check interval:
  - Environment: STALE_CHECK_INTERVAL_MS (default 60000 ms).
  - Implementation: Starts a periodic timer that invokes markStaleWorkers.
- Staleness threshold:
  - Environment: STALE_THRESHOLD_MINUTES (default 2 minutes).
  - Implementation: Computes threshold date and compares last_seen_at.

Operational guidance:
- Lower heartbeat intervals increase responsiveness but also DB write frequency.
- Higher staleness thresholds tolerate more transient network issues but delay error detection.

**Section sources**
- [bot.ts](file://apps/worker/src/bot.ts#L333-L359)
- [server.ts](file://apps/control-plane/src/server.ts#L54-L63)
- [admin.ts](file://apps/control-plane/src/routes/admin.ts#L12-L12)

### Monitoring Dashboard Integration and Alerting
- Frontend status page polls the portal API endpoint every 10 seconds and renders tenant and session status.
- Portal routes require an internal key header (PORTAL_INTERNAL_KEY) for access.
- Integration ideas:
  - Use the portal status endpoint as a data source for dashboards.
  - Alert on tenant status=ERROR or worker status=ERROR.
  - Correlate with message logs and setup request status for richer context.

```mermaid
sequenceDiagram
participant Browser as "Browser"
participant FE as "Status Page<br/>page.tsx"
participant API as "Portal Status API<br/>route.ts"
participant CP as "Portal Routes<br/>portal.ts"
Browser->>FE : "Load status page"
FE->>API : "GET /api/portal/tenant/current/status"
API->>CP : "Forward request with internal key"
CP->>CP : "Authenticate internal key"
CP-->>API : "Return tenant/session/worker data"
API-->>FE : "JSON status payload"
FE->>FE : "Render status and schedule next poll"
```

**Diagram sources**
- [page.tsx](file://apps/web/src/app/(portal)/app/status/page.tsx#L24-L44)
- [route.ts](file://apps/web/src/app/api/portal/tenant/current/status/route.ts#L8-L34)
- [portal.ts](file://apps/control-plane/src/routes/portal.ts#L159-L186)

**Section sources**
- [page.tsx](file://apps/web/src/app/(portal)/app/status/page.tsx#L24-L44)
- [route.ts](file://apps/web/src/app/api/portal/tenant/current/status/route.ts#L8-L34)
- [portal.ts](file://apps/control-plane/src/routes/portal.ts#L12-L25)

### Network Timeout Handling and Recovery from Heartbeat Failures
- Worker heartbeat failures:
  - Heartbeat updates are wrapped in try/catch; failures are logged but do not crash the worker.
  - Disconnection triggers stopHeartbeat and starts reconnect manager with exponential backoff.
- Reconnect manager:
  - Configurable initial delay, max delay, max attempts, and backoff multiplier.
  - On reaching max attempts, marks tenant and worker as ERROR.
- Chat queue and deduplication:
  - Prevent message storms and ensure ordered processing per chat.
  - Deduplicator prevents duplicate processing of messages.

```mermaid
flowchart TD
HBFail["Heartbeat update fails"] --> LogHB["Log error"]
LogHB --> Continue["Continue running"]
Disc["WhatsApp disconnected"] --> StopHB["Stop heartbeat"]
StopHB --> StartReconn["Start reconnect manager"]
StartReconn --> Attempt["Attempt reconnect"]
Attempt --> |Success| Reset["Reset reconnect state"]
Attempt --> |Failure| Backoff["Exponential backoff"]
Backoff --> MaxAttempts{"Max attempts reached?"}
MaxAttempts --> |Yes| MarkErr["Mark tenant & worker ERROR"]
MaxAttempts --> |No| Schedule["Schedule next attempt"]
Schedule --> Attempt
```

**Diagram sources**
- [bot.ts](file://apps/worker/src/bot.ts#L333-L359)
- [bot.ts](file://apps/worker/src/bot.ts#L185-L208)
- [reconnect.ts](file://apps/worker/src/utils/reconnect.ts#L87-L115)

**Section sources**
- [bot.ts](file://apps/worker/src/bot.ts#L333-L359)
- [bot.ts](file://apps/worker/src/bot.ts#L185-L208)
- [reconnect.ts](file://apps/worker/src/utils/reconnect.ts#L87-L115)

### Relationship Between Worker Health and Tenant Status Synchronization
- Worker status transitions:
  - READY: worker status becomes RUNNING and tenant status becomes ACTIVE.
  - DISCONNECTED: worker status becomes ERROR and tenant status becomes ERROR; reconnect manager starts.
  - AUTH FAILURE: worker status becomes ERROR and tenant status becomes ERROR.
  - HEARTBEAT: worker status remains RUNNING.
  - STALE DETECTION: RUNNING worker with stale last_seen_at becomes ERROR and tenant becomes ERROR.
- Tenant status lifecycle:
  - NEW → QR_PENDING → APPROVED → ACTIVE (via setup request and worker start).
  - ACTIVE → ERROR on disconnect or auth failure.
  - ERROR → ACTIVE after successful reconnection and heartbeat.

```mermaid
stateDiagram-v2
[*] --> New
New --> QR_PENDING : "worker start"
QR_PENDING --> ACTIVE : "ready"
ACTIVE --> ERROR : "disconnected/auth failure"
ERROR --> ACTIVE : "reconnect success"
ACTIVE --> ERROR : "stale detection"
```

**Diagram sources**
- [bot.ts](file://apps/worker/src/bot.ts#L98-L151)
- [bot.ts](file://apps/worker/src/bot.ts#L185-L208)
- [admin.ts](file://apps/control-plane/src/routes/admin.ts#L30-L80)

**Section sources**
- [bot.ts](file://apps/worker/src/bot.ts#L98-L151)
- [bot.ts](file://apps/worker/src/bot.ts#L185-L208)
- [admin.ts](file://apps/control-plane/src/routes/admin.ts#L30-L80)

## Dependency Analysis
- Worker depends on:
  - Prisma client for database updates.
  - WhatsApp client for session management.
  - Reconnect manager for resilience.
  - Chat queue and deduplicator for throughput and correctness.
- Control plane depends on:
  - Prisma client for querying and updating worker and tenant records.
  - Internal portal key for authenticating frontend requests.
- Frontend depends on:
  - Portal status API for live tenant/session/worker data.

```mermaid
graph LR
Worker["Worker<br/>bot.ts"] --> Prisma["Prisma Client"]
Worker --> Reconnect["Reconnect Manager<br/>reconnect.ts"]
Worker --> ChatQ["Chat Queue<br/>chat-queue.ts"]
Worker --> Dedup["Deduplicator<br/>dedup.ts"]
ControlPlane["Control Plane<br/>server.ts + admin.ts"] --> Prisma
ControlPlane --> PortalRoutes["Portal Routes<br/>portal.ts"]
PortalAPI["Portal API<br/>route.ts"] --> PortalRoutes
StatusPage["Status Page<br/>page.tsx"] --> PortalAPI
```

**Diagram sources**
- [bot.ts](file://apps/worker/src/bot.ts#L27-L75)
- [reconnect.ts](file://apps/worker/src/utils/reconnect.ts#L14-L39)
- [chat-queue.ts](file://apps/worker/src/utils/chat-queue.ts#L21-L29)
- [dedup.ts](file://apps/worker/src/utils/dedup.ts#L1-L20)
- [server.ts](file://apps/control-plane/src/server.ts#L54-L63)
- [admin.ts](file://apps/control-plane/src/routes/admin.ts#L30-L80)
- [portal.ts](file://apps/control-plane/src/routes/portal.ts#L159-L186)
- [route.ts](file://apps/web/src/app/api/portal/tenant/current/status/route.ts#L8-L34)
- [page.tsx](file://apps/web/src/app/(portal)/app/status/page.tsx#L24-L44)

**Section sources**
- [bot.ts](file://apps/worker/src/bot.ts#L27-L75)
- [reconnect.ts](file://apps/worker/src/utils/reconnect.ts#L14-L39)
- [chat-queue.ts](file://apps/worker/src/utils/chat-queue.ts#L21-L29)
- [dedup.ts](file://apps/worker/src/utils/dedup.ts#L1-L20)
- [server.ts](file://apps/control-plane/src/server.ts#L54-L63)
- [admin.ts](file://apps/control-plane/src/routes/admin.ts#L30-L80)
- [portal.ts](file://apps/control-plane/src/routes/portal.ts#L159-L186)
- [route.ts](file://apps/web/src/app/api/portal/tenant/current/status/route.ts#L8-L34)
- [page.tsx](file://apps/web/src/app/(portal)/app/status/page.tsx#L24-L44)

## Performance Considerations
- Heartbeat interval tuning:
  - Increase interval to reduce DB writes and CPU usage.
  - Decrease interval to improve staleness detection latency.
- Staleness threshold tuning:
  - Larger threshold reduces false positives during brief network hiccups.
  - Smaller threshold accelerates detection of truly dead workers.
- Queue and deduplication:
  - Chat queue prevents overload and ensures ordered processing.
  - Deduplicator avoids redundant work and protects against message storms.
- Reconnect backoff:
  - Exponential backoff prevents flooding the WhatsApp service and conserves resources.

[No sources needed since this section provides general guidance]

## Troubleshooting Guide
Common scenarios and resolutions:
- Worker appears healthy but is marked ERROR:
  - Verify HEARTBEAT_INTERVAL_MS and STALE_CHECK_INTERVAL_MS alignment.
  - Confirm that last_seen_at is being updated on ready and heartbeat ticks.
  - Check for database connectivity and Prisma client initialization errors.
- Frequent ERROR due to staleness:
  - Increase STALE_THRESHOLD_MINUTES if intermittent network issues occur.
  - Reduce heartbeat interval to ensure timely updates.
- Disconnections and repeated reconnect attempts:
  - Review reconnect configuration (initial delay, max attempts, backoff).
  - Investigate underlying network or browser/headless environment issues.
- Frontend status not updating:
  - Ensure PORTAL_INTERNAL_KEY is configured and passed in headers.
  - Verify that the portal routes are reachable and returning JSON.

**Section sources**
- [bot.ts](file://apps/worker/src/bot.ts#L333-L359)
- [admin.ts](file://apps/control-plane/src/routes/admin.ts#L30-L80)
- [portal.ts](file://apps/control-plane/src/routes/portal.ts#L12-L25)
- [route.ts](file://apps/web/src/app/api/portal/tenant/current/status/route.ts#L8-L34)

## Conclusion
The heartbeat and health monitoring system provides robust worker and tenant status tracking through:
- Periodic heartbeats that update session timestamps and worker status
- Controlled staleness detection that escalates to ERROR states
- Clear tenant status synchronization to reflect operational health
- Frontend integration for real-time visibility and alerting

Proper configuration of intervals and thresholds, combined with resilient reconnect logic, ensures reliable operation under various network conditions.

[No sources needed since this section summarizes without analyzing specific files]

## Appendices

### Configuration Reference
- Worker heartbeat interval:
  - Variable: HEARTBEAT_INTERVAL_MS
  - Default: 30000 ms
  - Effect: Controls frequency of last_seen_at updates and worker status=RUNNING
- Stale worker check interval:
  - Variable: STALE_CHECK_INTERVAL_MS
  - Default: 60000 ms
  - Effect: Frequency of staleness scanning
- Staleness threshold:
  - Variable: STALE_THRESHOLD_MINUTES
  - Default: 2 minutes
  - Effect: Threshold for marking workers as ERROR
- Portal internal key:
  - Variable: PORTAL_INTERNAL_KEY
  - Purpose: Protects portal routes from unauthorized access
- Frontend polling:
  - Interval: 10000 ms (as implemented in the status page)

**Section sources**
- [bot.ts](file://apps/worker/src/bot.ts#L333-L359)
- [server.ts](file://apps/control-plane/src/server.ts#L54-L63)
- [admin.ts](file://apps/control-plane/src/routes/admin.ts#L12-L12)
- [portal.ts](file://apps/control-plane/src/routes/portal.ts#L12-L25)
- [page.tsx](file://apps/web/src/app/(portal)/app/status/page.tsx#L42-L42)

### Data Model Overview
```mermaid
erDiagram
TENANT {
string id PK
string name
string phone_number
enum status
datetime created_at
datetime updated_at
}
WHATSAPP_SESSION {
string id PK
string tenant_id FK
enum state
string last_qr
datetime last_seen_at
datetime created_at
datetime updated_at
}
WORKER_PROCESS {
string id PK
string tenant_id FK
string pm2_name
enum status
string last_error
datetime created_at
datetime updated_at
}
TENANT ||--o| WHATSAPP_SESSION : "has one"
TENANT ||--o| WORKER_PROCESS : "has one"
```

**Diagram sources**
- [schema.prisma](file://packages/shared/src/prisma/schema.prisma#L60-L131)