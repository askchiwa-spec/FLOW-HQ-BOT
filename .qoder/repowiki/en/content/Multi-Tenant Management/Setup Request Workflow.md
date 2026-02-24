# Setup Request Workflow

<cite>
**Referenced Files in This Document**
- [schema.prisma](file://packages/shared/src/prisma/schema.prisma)
- [route.ts](file://apps/web/src/app/api/portal/setup-request/route.ts)
- [page.tsx](file://apps/web/src/app/(portal)/app/onboarding/page.tsx)
- [page.tsx](file://apps/web/src/app/(portal)/app/status/page.tsx)
- [portal.ts](file://apps/control-plane/src/routes/portal.ts)
- [admin.ts](file://apps/control-plane/src/routes/admin.ts)
- [server.ts](file://apps/control-plane/src/server.ts)
- [setup-requests.ejs](file://apps/control-plane/src/views/setup-requests.ejs)
- [setup-request-detail.ejs](file://apps/control-plane/src/views/setup-request-detail.ejs)
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
This document explains the setup request workflow system in Flow HQ. It covers the complete lifecycle from submission via the web portal through administrative review and approval to tenant activation. It documents status management (SUBMITTED, REVIEWING, APPROVED, ACTIVE, REJECTED), model relationships among SetupRequest, Tenant, and User, validation and processing logic, and integration with tenant activation and monitoring.

## Project Structure
The setup request workflow spans three layers:
- Web Portal (Next.js): Collects user input, submits requests, and displays status
- Control Plane (Express): Validates portal submissions, persists data, manages approvals, and triggers activations
- Shared Data Model (Prisma): Defines SetupRequest, Tenant, and User relationships and statuses

```mermaid
graph TB
subgraph "Web Portal"
WP_Onboarding["Onboarding Page<br/>(page.tsx)"]
WP_API["Setup Request API<br/>(route.ts)"]
WP_Status["Status Page<br/>(page.tsx)"]
end
subgraph "Control Plane"
CP_Server["Server Entrypoint<br/>(server.ts)"]
CP_Routes_Portal["Portal Routes<br/>(portal.ts)"]
CP_Routes_Admin["Admin Routes<br/>(admin.ts)"]
CP_Views_SR_List["Setup Requests List<br/>(setup-requests.ejs)"]
CP_Views_SR_Detail["Setup Request Detail<br/>(setup-request-detail.ejs)"]
end
subgraph "Shared Data"
PRISMA_Models["Prisma Schema<br/>(schema.prisma)"]
end
WP_Onboarding --> WP_API
WP_API --> CP_Server
CP_Server --> CP_Routes_Portal
CP_Routes_Portal --> PRISMA_Models
CP_Routes_Admin --> PRISMA_Models
CP_Routes_Admin --> CP_Views_SR_List
CP_Routes_Admin --> CP_Views_SR_Detail
WP_Status --> CP_Routes_Portal
CP_Routes_Portal --> PRISMA_Models
```

**Diagram sources**
- [server.ts](file://apps/control-plane/src/server.ts#L1-L89)
- [portal.ts](file://apps/control-plane/src/routes/portal.ts#L1-L246)
- [admin.ts](file://apps/control-plane/src/routes/admin.ts#L1-L200)
- [setup-requests.ejs](file://apps/control-plane/src/views/setup-requests.ejs#L1-L97)
- [setup-request-detail.ejs](file://apps/control-plane/src/views/setup-request-detail.ejs#L1-L175)
- [schema.prisma](file://packages/shared/src/prisma/schema.prisma#L150-L164)

**Section sources**
- [server.ts](file://apps/control-plane/src/server.ts#L1-L89)
- [portal.ts](file://apps/control-plane/src/routes/portal.ts#L1-L246)
- [admin.ts](file://apps/control-plane/src/routes/admin.ts#L1-L200)
- [setup-requests.ejs](file://apps/control-plane/src/views/setup-requests.ejs#L1-L97)
- [setup-request-detail.ejs](file://apps/control-plane/src/views/setup-request-detail.ejs#L1-L175)
- [schema.prisma](file://packages/shared/src/prisma/schema.prisma#L150-L164)

## Core Components
- SetupRequest model: Stores request metadata, links to Tenant and User, tracks status, and supports optional notes
- Tenant model: Represents a business unit with status and associated child entities
- User model: Links to a Tenant and participates in setup requests
- Portal routes: Validate internal key, resolve user by email, create setup requests, and expose status endpoints
- Admin routes: Approve/reject setup requests, start workers, and render admin UI
- Web portal pages: Onboarding form and status dashboard

Key implementation references:
- SetupRequest model definition and status enum
- Portal route for creating setup requests
- Admin route for approving setup requests and starting workers
- Web onboarding form and status polling

**Section sources**
- [schema.prisma](file://packages/shared/src/prisma/schema.prisma#L52-L58)
- [schema.prisma](file://packages/shared/src/prisma/schema.prisma#L150-L164)
- [portal.ts](file://apps/control-plane/src/routes/portal.ts#L85-L153)
- [admin.ts](file://apps/control-plane/src/routes/admin.ts#L456-L489)
- [page.tsx](file://apps/web/src/app/(portal)/app/onboarding/page.tsx#L1-L115)
- [page.tsx](file://apps/web/src/app/(portal)/app/status/page.tsx#L1-L160)

## Architecture Overview
The system enforces a strict separation of concerns:
- Web Portal validates user session and forwards a request to the Control Plane
- Control Plane authenticates via internal key and user email, persists the setup request, updates tenant status, and logs events
- Admin UI surfaces setup requests, allows approvals/rejections, and starts workers
- Worker lifecycle is managed by the Control Plane and reflected in tenant status

```mermaid
sequenceDiagram
participant User as "User"
participant Web as "Web Portal"
participant CP as "Control Plane"
participant DB as "Prisma"
User->>Web : "Open Onboarding"
Web->>Web : "Collect form data"
Web->>CP : "POST /portal/setup-request (with internal key and user email)"
CP->>DB : "Upsert TenantConfig, Update Tenant name/status"
CP->>DB : "Create SetupRequest (status=SUBMITTED)"
CP->>DB : "Create PortalEventLog (SETUP_REQUEST_SUBMITTED)"
CP-->>Web : "201 Created SetupRequest"
Web-->>User : "Redirect to Status"
```

**Diagram sources**
- [route.ts](file://apps/web/src/app/api/portal/setup-request/route.ts#L1-L40)
- [portal.ts](file://apps/control-plane/src/routes/portal.ts#L85-L153)

## Detailed Component Analysis

### SetupRequest Model and Relationships
The SetupRequest entity connects Users and Tenants, carries template selection and WhatsApp number, and maintains lifecycle status. It is central to the approval workflow.

```mermaid
erDiagram
USER {
string id PK
string email UK
string name
string role
}
TENANT {
string id PK
string name
string phone_number
enum status
}
SETUP_REQUEST {
string id PK
string tenant_id FK
string user_id FK
enum template_type
string whatsapp_number
enum status
}
USER ||--o{ SETUP_REQUEST : "submits"
TENANT ||--o{ SETUP_REQUEST : "owns"
```

**Diagram sources**
- [schema.prisma](file://packages/shared/src/prisma/schema.prisma#L133-L148)
- [schema.prisma](file://packages/shared/src/prisma/schema.prisma#L60-L76)
- [schema.prisma](file://packages/shared/src/prisma/schema.prisma#L150-L164)

**Section sources**
- [schema.prisma](file://packages/shared/src/prisma/schema.prisma#L52-L58)
- [schema.prisma](file://packages/shared/src/prisma/schema.prisma#L150-L164)

### Web Portal: Setup Request Creation
The portal collects business details, template type, WhatsApp number, and language, then posts to the Control Plane. The API wrapper ensures authentication and forwards the request.

```mermaid
sequenceDiagram
participant Client as "Client Browser"
participant Form as "Onboarding Form<br/>(page.tsx)"
participant API as "Portal API<br/>(route.ts)"
participant CP as "Control Plane<br/>(portal.ts)"
Client->>Form : "Fill and submit form"
Form->>API : "POST /api/portal/setup-request"
API->>API : "getServerSession()"
API->>CP : "Forward POST /portal/setup-request<br/>with x-portal-key and x-user-email"
CP-->>API : "201 SetupRequest"
API-->>Client : "JSON response"
```

**Diagram sources**
- [page.tsx](file://apps/web/src/app/(portal)/app/onboarding/page.tsx#L19-L38)
- [route.ts](file://apps/web/src/app/api/portal/setup-request/route.ts#L8-L39)
- [portal.ts](file://apps/control-plane/src/routes/portal.ts#L85-L153)

**Section sources**
- [page.tsx](file://apps/web/src/app/(portal)/app/onboarding/page.tsx#L1-L115)
- [route.ts](file://apps/web/src/app/api/portal/setup-request/route.ts#L1-L40)
- [portal.ts](file://apps/control-plane/src/routes/portal.ts#L85-L153)

### Control Plane: Validation and Persistence
The portal route validates the internal key and user email, resolves the user and tenant, updates tenant metadata, creates or upserts TenantConfig, creates SetupRequest with status SUBMITTED, sets tenant status to PENDING, and logs a portal event.

```mermaid
flowchart TD
Start(["POST /portal/setup-request"]) --> GetUser["Resolve User by x-user-email"]
GetUser --> HasTenant{"User has Tenant?"}
HasTenant --> |No| Return404["Return 404"]
HasTenant --> |Yes| UpsertConfig["Upsert TenantConfig"]
UpsertConfig --> CreateSR["Create SetupRequest (status=SUBMITTED)"]
CreateSR --> UpdateTenant["Update Tenant status to PENDING"]
UpdateTenant --> LogEvent["Create PortalEventLog (SETUP_REQUEST_SUBMITTED)"]
LogEvent --> Return201["Return 201 SetupRequest"]
```

**Diagram sources**
- [portal.ts](file://apps/control-plane/src/routes/portal.ts#L85-L153)

**Section sources**
- [portal.ts](file://apps/control-plane/src/routes/portal.ts#L12-L46)
- [portal.ts](file://apps/control-plane/src/routes/portal.ts#L85-L153)

### Admin Review and Approval
Administrators review setup requests in the admin UI. When approved, the system starts the worker process, transitions tenant status to QR_PENDING, and records an event log. Rejection requires a reason and updates the setup request status accordingly.

```mermaid
sequenceDiagram
participant Admin as "Admin"
participant Views as "Admin Views<br/>(setup-requests.ejs / detail.ejs)"
participant CP as "Admin Routes<br/>(admin.ts)"
participant DB as "Prisma"
Admin->>Views : "Open Setup Request Detail"
Admin->>CP : "POST /admin/setup-requests/ : id/approve"
CP->>DB : "Load SetupRequest"
CP->>DB : "Create WorkerProcess (RUNNING)"
CP->>DB : "Update Tenant status to QR_PENDING"
CP->>DB : "Create PortalEventLog (SETUP_REQUEST_APPROVED)"
CP-->>Admin : "Redirect to detail"
```

**Diagram sources**
- [setup-request-detail.ejs](file://apps/control-plane/src/views/setup-request-detail.ejs#L120-L143)
- [admin.ts](file://apps/control-plane/src/routes/admin.ts#L456-L489)

**Section sources**
- [setup-requests.ejs](file://apps/control-plane/src/views/setup-requests.ejs#L69-L96)
- [setup-request-detail.ejs](file://apps/control-plane/src/views/setup-request-detail.ejs#L120-L143)
- [admin.ts](file://apps/control-plane/src/routes/admin.ts#L456-L489)

### Status Tracking and Activation
The portal status page polls tenant and setup request status, displaying badges and actionable steps. After approval, the system moves to QR_PENDING and later ACTIVE upon successful worker operation.

```mermaid
sequenceDiagram
participant Client as "Client Browser"
participant Status as "Status Page<br/>(page.tsx)"
participant CP as "Portal Routes<br/>(portal.ts)"
loop Every 10 seconds
Client->>Status : "Fetch status"
Status->>CP : "GET /portal/tenant/current/status"
CP->>CP : "Resolve User/Tenant"
CP->>CP : "Find latest SetupRequest"
CP-->>Status : "{tenant, setupRequest}"
Status-->>Client : "Render status and actions"
end
```

**Diagram sources**
- [page.tsx](file://apps/web/src/app/(portal)/app/status/page.tsx#L24-L44)
- [portal.ts](file://apps/control-plane/src/routes/portal.ts#L159-L186)

**Section sources**
- [page.tsx](file://apps/web/src/app/(portal)/app/status/page.tsx#L1-L160)
- [portal.ts](file://apps/control-plane/src/routes/portal.ts#L159-L186)

### Request Validation and Auditing
- Validation: The portal route validates presence of internal key and user email, ensures the user exists and belongs to a tenant, and extracts form fields
- Auditing: PortalEventLog captures SETUP_REQUEST_SUBMITTED and SETUP_REQUEST_APPROVED events with payload context

**Section sources**
- [portal.ts](file://apps/control-plane/src/routes/portal.ts#L12-L25)
- [portal.ts](file://apps/control-plane/src/routes/portal.ts#L30-L46)
- [portal.ts](file://apps/control-plane/src/routes/portal.ts#L139-L146)
- [portal.ts](file://apps/control-plane/src/routes/portal.ts#L476-L482)

### Practical Examples
- Setup request form fields: businessName, businessType, templateType, whatsappNumber, language
- Approval workflow: Approve button initiates worker start and tenant status change
- Rejection reason: Required field for rejection notes
- Status tracking: Color-coded badges and polling every 10 seconds

**Section sources**
- [page.tsx](file://apps/web/src/app/(portal)/app/onboarding/page.tsx#L11-L17)
- [setup-request-detail.ejs](file://apps/control-plane/src/views/setup-request-detail.ejs#L126-L140)
- [page.tsx](file://apps/web/src/app/(portal)/app/status/page.tsx#L48-L64)

## Dependency Analysis
The system exhibits clean separation:
- Web Portal depends on Control Plane for persistence and status
- Control Plane depends on Prisma for data access and logging
- Admin UI depends on Control Plane routes and Prisma models
- Tenant activation depends on worker lifecycle management

```mermaid
graph LR
WP["Web Portal"] --> CP["Control Plane"]
CP --> PRISMA["Prisma Models"]
CP --> PM2["PM2 Worker Management"]
PRISMA --> DB["PostgreSQL"]
```

**Diagram sources**
- [server.ts](file://apps/control-plane/src/server.ts#L1-L89)
- [portal.ts](file://apps/control-plane/src/routes/portal.ts#L1-L246)
- [admin.ts](file://apps/control-plane/src/routes/admin.ts#L1-L200)
- [schema.prisma](file://packages/shared/src/prisma/schema.prisma#L1-L178)

**Section sources**
- [server.ts](file://apps/control-plane/src/server.ts#L1-L89)
- [portal.ts](file://apps/control-plane/src/routes/portal.ts#L1-L246)
- [admin.ts](file://apps/control-plane/src/routes/admin.ts#L1-L200)
- [schema.prisma](file://packages/shared/src/prisma/schema.prisma#L1-L178)

## Performance Considerations
- Worker startup and PM2 management: Ensure PM2 executable availability and appropriate environment variables
- Background checks: Stale worker detection runs on an interval; tune interval and thresholds for production
- Status polling: Client-side polling every 10 seconds balances responsiveness with load; consider backoff strategies for idle tenants

[No sources needed since this section provides general guidance]

## Troubleshooting Guide
Common issues and remedies:
- Missing environment variables: Internal key, admin password, portal internal key, database URL
- Unauthorized portal key: Verify x-portal-key header matches configuration
- User not found: Confirm x-user-email corresponds to an existing user
- Tenant not found: Ensure the user belongs to a tenant before submitting a setup request
- Worker start failures: Check PM2 installation and executable path; review logs and event logs for errors

**Section sources**
- [server.ts](file://apps/control-plane/src/server.ts#L17-L39)
- [portal.ts](file://apps/control-plane/src/routes/portal.ts#L12-L25)
- [portal.ts](file://apps/control-plane/src/routes/portal.ts#L89-L95)
- [admin.ts](file://apps/control-plane/src/routes/admin.ts#L174-L200)

## Conclusion
The setup request workflow integrates the web portal, control plane, and shared data model to provide a robust, auditable, and manageable onboarding experience. Administrators can review, approve, and activate tenants while users receive timely status updates and clear next steps.