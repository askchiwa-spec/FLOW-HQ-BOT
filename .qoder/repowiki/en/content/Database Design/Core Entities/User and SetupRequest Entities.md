# User and SetupRequest Entities

<cite>
**Referenced Files in This Document**
- [schema.prisma](file://packages/shared/src/prisma/schema.prisma)
- [auth.ts](file://apps/web/src/lib/auth.ts)
- [prisma.ts](file://apps/web/src/lib/prisma.ts)
- [portal.ts](file://apps/control-plane/src/routes/portal.ts)
- [admin.ts](file://apps/control-plane/src/routes/admin.ts)
- [auth.ts](file://apps/control-plane/src/middleware/auth.ts)
- [setup-request/route.ts](file://apps/web/src/app/api/portal/setup-request/route.ts)
- [me/route.ts](file://apps/web/src/app/api/portal/me/route.ts)
- [tenant/current/status/route.ts](file://apps/web/src/app/api/portal/tenant/current/status/route.ts)
- [onboarding/page.tsx](file://apps/web/src/app/(portal)/app/onboarding/page.tsx)
- [status/page.tsx](file://apps/web/src/app/(portal)/app/status/page.tsx)
- [index.ts](file://packages/shared/src/types/index.ts)
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
This document provides comprehensive documentation for the User and SetupRequest entities that power the authentication and tenant setup workflows. It explains user roles (OWNER, STAFF, ADMIN) and their permission levels, details the SetupRequestStatus enum (SUBMITTED, REVIEWING, APPROVED, ACTIVE, REJECTED) and its workflow transitions, and covers the relationships among User, Tenant, and SetupRequest. The document also outlines the complete setup request process from submission through approval to tenant activation, with practical examples for user management, role assignments, and setup request workflows.

## Project Structure
The system consists of:
- Frontend portal (Next.js) for user onboarding and status tracking
- Control plane (Express) for administrative actions and setup request management
- Shared Prisma schema defining entities and enums
- Worker processes for per-tenant WhatsApp automation

```mermaid
graph TB
subgraph "Web Portal"
WEB_AUTH["NextAuth Authentication<br/>Google Provider"]
WEB_ONBOARD["Onboarding Page<br/>Form Submission"]
WEB_STATUS["Status Page<br/>Polling Tenant Status"]
end
subgraph "Control Plane"
CP_PORTAL["Portal Routes<br/>/portal/*"]
CP_ADMIN["Admin Routes<br/>/admin/*"]
CP_AUTH["Admin Auth Middleware"]
end
subgraph "Database"
PRISMA_SCHEMA["Prisma Schema<br/>User, Tenant, SetupRequest"]
end
subgraph "Worker"
WORKER["WhatsApp Worker<br/>PM2 Process"]
end
WEB_AUTH --> CP_PORTAL
WEB_ONBOARD --> CP_PORTAL
WEB_STATUS --> CP_PORTAL
CP_PORTAL --> PRISMA_SCHEMA
CP_ADMIN --> PRISMA_SCHEMA
PRISMA_SCHEMA --> WORKER
```

**Diagram sources**
- [auth.ts](file://apps/web/src/lib/auth.ts#L1-L76)
- [portal.ts](file://apps/control-plane/src/routes/portal.ts#L1-L246)
- [admin.ts](file://apps/control-plane/src/routes/admin.ts#L1-L528)
- [schema.prisma](file://packages/shared/src/prisma/schema.prisma#L133-L164)

**Section sources**
- [auth.ts](file://apps/web/src/lib/auth.ts#L1-L76)
- [portal.ts](file://apps/control-plane/src/routes/portal.ts#L1-L246)
- [admin.ts](file://apps/control-plane/src/routes/admin.ts#L1-L528)
- [schema.prisma](file://packages/shared/src/prisma/schema.prisma#L133-L164)

## Core Components
This section documents the User, SetupRequest, and related entities, including their attributes, relationships, and constraints.

- User entity
  - Unique identifier and optional tenant association
  - Fields: id, tenant_id, name, email, phone, role, timestamps
  - Role defaults to OWNER for new users
  - Relationship: belongs to Tenant (optional), has many SetupRequests and PortalEventLogs

- SetupRequest entity
  - Links a tenant and user to a setup request
  - Fields: id, tenant_id, user_id, template_type, whatsapp_number, status, notes, timestamps
  - Status defaults to SUBMITTED
  - Relationship: belongs to Tenant and User, triggers tenant status changes

- Tenant entity
  - Represents a multi-tenant business unit
  - Fields: id, name, phone_number, status, timestamps
  - Status enum includes NEW, QR_PENDING, ACTIVE, PAUSED, ERROR
  - Relationships: optional User (owner), TenantConfig, WhatsAppSession, WorkerProcess, SetupRequests

- Enums
  - UserRole: OWNER, STAFF, ADMIN
  - SetupRequestStatus: SUBMITTED, REVIEWING, APPROVED, ACTIVE, REJECTED
  - TenantStatus: NEW, QR_PENDING, ACTIVE, PAUSED, ERROR

**Section sources**
- [schema.prisma](file://packages/shared/src/prisma/schema.prisma#L46-L58)
- [schema.prisma](file://packages/shared/src/prisma/schema.prisma#L133-L164)

## Architecture Overview
The authentication and setup workflow spans the web portal and control plane:

- Authentication flow
  - NextAuth with Google provider creates a User and associated Tenant on first sign-in
  - Session callback enriches session with user role, tenantId, and setup request presence

- Setup request flow
  - User submits onboarding form via web portal
  - Web portal forwards request to control plane with portal internal key and user email
  - Control plane validates portal key, resolves user by email, updates tenant, upserts config, creates SetupRequest, sets tenant status, and logs events
  - Admin reviews and approves SetupRequest, which starts the worker and advances tenant status

```mermaid
sequenceDiagram
participant User as "User"
participant Web as "Web Portal"
participant CP as "Control Plane"
participant DB as "Database"
User->>Web : "Submit onboarding form"
Web->>CP : "POST /portal/setup-request<br/>Headers : x-portal-key, x-user-email"
CP->>DB : "Find user by email"
CP->>DB : "Update tenant name"
CP->>DB : "Upsert tenant config"
CP->>DB : "Create setup request (SUBMITTED)"
CP->>DB : "Update tenant status (NEW)"
CP->>DB : "Create portal event log"
CP-->>Web : "201 Created setup request"
Web-->>User : "Redirect to status page"
```

**Diagram sources**
- [setup-request/route.ts](file://apps/web/src/app/api/portal/setup-request/route.ts#L8-L39)
- [portal.ts](file://apps/control-plane/src/routes/portal.ts#L85-L153)

**Section sources**
- [auth.ts](file://apps/web/src/lib/auth.ts#L14-L70)
- [setup-request/route.ts](file://apps/web/src/app/api/portal/setup-request/route.ts#L8-L39)
- [portal.ts](file://apps/control-plane/src/routes/portal.ts#L85-L153)

## Detailed Component Analysis

### User Entity
The User entity defines ownership and permissions within the system.

- Creation and linking
  - First-time sign-in via Google provider creates a Tenant and User
  - User role defaults to OWNER
  - Session enrichment includes role, tenantId, and setup request presence

- Permissions and roles
  - OWNER: primary account holder with full access to tenant resources
  - STAFF: limited access for operational tasks
  - ADMIN: elevated privileges for administrative functions

```mermaid
classDiagram
class User {
+string id
+string tenant_id
+string name
+string email
+string phone
+UserRole role
+datetime created_at
+datetime updated_at
}
class Tenant {
+string id
+string name
+string phone_number
+TenantStatus status
+datetime created_at
+datetime updated_at
}
class SetupRequest {
+string id
+string tenant_id
+string user_id
+TemplateType template_type
+string whatsapp_number
+SetupRequestStatus status
+string notes
+datetime created_at
+datetime updated_at
}
User --> Tenant : "belongs to"
SetupRequest --> Tenant : "belongs to"
SetupRequest --> User : "submitted by"
```

**Diagram sources**
- [schema.prisma](file://packages/shared/src/prisma/schema.prisma#L133-L164)

**Section sources**
- [auth.ts](file://apps/web/src/lib/auth.ts#L22-L43)
- [schema.prisma](file://packages/shared/src/prisma/schema.prisma#L133-L148)

### SetupRequest Entity and Workflow
SetupRequest tracks the lifecycle of tenant setup from submission to activation.

- Status transitions
  - SUBMITTED: initial state after user submission
  - REVIEWING: internal review phase (not directly manipulated by user)
  - APPROVED: admin approval; triggers worker start and QR generation
  - ACTIVE: worker connected and processing messages
  - REJECTED: admin rejection with notes

- Submission process
  - Web portal receives form data and forwards to control plane
  - Control plane updates tenant name, upserts tenant config, creates SetupRequest with SUBMITTED status, sets tenant status to NEW, and logs event

- Approval and activation
  - Admin approves SetupRequest, updating status to APPROVED and tenant status to QR_PENDING
  - Worker process is started via PM2; tenant status advances to QR_PENDING while QR is generated
  - Once QR is scanned and session connects, tenant status becomes ACTIVE

```mermaid
flowchart TD
Start(["Setup Request Created"]) --> Submitted["Status: SUBMITTED"]
Submitted --> Reviewing["Status: REVIEWING"]
Reviewing --> Approved["Status: APPROVED"]
Approved --> QRPending["Tenant Status: QR_PENDING"]
QRPending --> Active["Tenant Status: ACTIVE"]
Submitted --> Rejected["Status: REJECTED"]
style Submitted fill:#fff,stroke:#333
style Reviewing fill:#fff,stroke:#333
style Approved fill:#fff,stroke:#333
style QRPending fill:#fff,stroke:#333
style Active fill:#fff,stroke:#333
style Rejected fill:#fff,stroke:#333
```

**Diagram sources**
- [schema.prisma](file://packages/shared/src/prisma/schema.prisma#L52-L58)
- [portal.ts](file://apps/control-plane/src/routes/portal.ts#L121-L137)
- [admin.ts](file://apps/control-plane/src/routes/admin.ts#L419-L489)

**Section sources**
- [portal.ts](file://apps/control-plane/src/routes/portal.ts#L85-L153)
- [admin.ts](file://apps/control-plane/src/routes/admin.ts#L419-L489)
- [schema.prisma](file://packages/shared/src/prisma/schema.prisma#L52-L58)

### Authentication and Authorization
The system uses NextAuth with Google OAuth for user authentication and session management.

- Sign-in flow
  - Google provider authenticates user
  - If user does not exist, create Tenant (NEW status) and User (OWNER role)
  - Enrich session with user metadata for portal access

- Portal access
  - Web portal routes call control plane endpoints with portal internal key and user email
  - Control plane validates portal key and resolves user to enforce access

- Admin access
  - Admin routes use basic auth or password query parameter for protection

```mermaid
sequenceDiagram
participant Browser as "Browser"
participant NextAuth as "NextAuth"
participant Portal as "Web Portal"
participant ControlPlane as "Control Plane"
Browser->>NextAuth : "Sign in with Google"
NextAuth->>NextAuth : "Create tenant and user if needed"
NextAuth-->>Browser : "Session with user data"
Browser->>Portal : "Navigate to onboarding"
Portal->>ControlPlane : "POST /portal/setup-request"
ControlPlane-->>Portal : "Setup request created"
```

**Diagram sources**
- [auth.ts](file://apps/web/src/lib/auth.ts#L14-L70)
- [setup-request/route.ts](file://apps/web/src/app/api/portal/setup-request/route.ts#L8-L39)
- [portal.ts](file://apps/control-plane/src/routes/portal.ts#L12-L25)

**Section sources**
- [auth.ts](file://apps/web/src/lib/auth.ts#L14-L70)
- [setup-request/route.ts](file://apps/web/src/app/api/portal/setup-request/route.ts#L8-L39)
- [portal.ts](file://apps/control-plane/src/routes/portal.ts#L12-L25)

### User Management and Role Assignments
- Role assignment
  - New users receive OWNER role automatically during sign-in
  - Additional roles (STAFF, ADMIN) are defined in the schema for future expansion

- Session enrichment
  - Session callback attaches user role, tenantId, and setup request presence to the session object

- Practical examples
  - Assigning roles: Extend the sign-in callback to set role based on business logic
  - Restricting access: Use role checks in portal routes before performing sensitive operations

**Section sources**
- [auth.ts](file://apps/web/src/lib/auth.ts#L34-L43)
- [schema.prisma](file://packages/shared/src/prisma/schema.prisma#L46-L50)

### Setup Request Workflows
- Submission
  - User fills onboarding form with business details, template type, WhatsApp number, and language
  - Form posts to web portal endpoint, which forwards to control plane

- Review and approval
  - Admin reviews SetupRequest in the admin dashboard
  - Approve action updates status to APPROVED, starts worker, and advances tenant status to QR_PENDING

- Activation
  - User scans QR code to connect WhatsApp
  - Tenant status transitions to ACTIVE upon successful connection

- Status polling
  - Web portal polls tenant status endpoint to reflect real-time progress

```mermaid
sequenceDiagram
participant Admin as "Admin"
participant CP as "Control Plane"
participant DB as "Database"
participant Worker as "Worker"
Admin->>CP : "Approve SetupRequest"
CP->>DB : "Update setup request status to APPROVED"
CP->>DB : "Update tenant status to QR_PENDING"
CP->>Worker : "Start PM2 process"
Worker-->>CP : "Session QR ready"
CP-->>Admin : "Approval confirmed"
```

**Diagram sources**
- [admin.ts](file://apps/control-plane/src/routes/admin.ts#L419-L489)
- [portal.ts](file://apps/control-plane/src/routes/portal.ts#L420-L445)

**Section sources**
- [onboarding/page.tsx](file://apps/web/src/app/(portal)/app/onboarding/page.tsx#L19-L38)
- [status/page.tsx](file://apps/web/src/app/(portal)/app/status/page.tsx#L28-L44)
- [admin.ts](file://apps/control-plane/src/routes/admin.ts#L419-L489)

## Dependency Analysis
The following diagram shows key dependencies among components involved in user authentication and setup request workflows.

```mermaid
graph TB
WEB_AUTH["Web Auth<br/>Google Provider"] --> PRISMA_WEB["Prisma Client<br/>web/src/lib/prisma.ts"]
WEB_ONBOARD["Onboarding Page"] --> WEB_SETUP_ROUTE["Setup Request Route"]
WEB_SETUP_ROUTE --> CP_PORTAL["Control Plane Portal Routes"]
CP_PORTAL --> PRISMA_SCHEMA["Prisma Schema"]
CP_ADMIN["Admin Routes"] --> PRISMA_SCHEMA
CP_PORTAL --> CP_AUTH["Portal Auth Middleware"]
CP_ADMIN --> CP_AUTH
PRISMA_SCHEMA --> WORKER["Worker Process"]
```

**Diagram sources**
- [auth.ts](file://apps/web/src/lib/auth.ts#L1-L76)
- [prisma.ts](file://apps/web/src/lib/prisma.ts#L1-L10)
- [setup-request/route.ts](file://apps/web/src/app/api/portal/setup-request/route.ts#L1-L40)
- [portal.ts](file://apps/control-plane/src/routes/portal.ts#L1-L246)
- [admin.ts](file://apps/control-plane/src/routes/admin.ts#L1-L528)
- [schema.prisma](file://packages/shared/src/prisma/schema.prisma#L133-L164)

**Section sources**
- [prisma.ts](file://apps/web/src/lib/prisma.ts#L1-L10)
- [portal.ts](file://apps/control-plane/src/routes/portal.ts#L12-L25)
- [admin.ts](file://apps/control-plane/src/routes/admin.ts#L14-L29)

## Performance Considerations
- Database queries
  - Use selective includes and ordering to minimize payload sizes (e.g., fetching latest setup request by created_at desc)
- Rate limiting
  - Worker enforces rate limits to prevent overload; configure thresholds appropriately
- Heartbeat monitoring
  - Stale worker detection prevents resource leaks; adjust stale threshold based on environment
- Caching
  - Consider caching frequently accessed tenant and user data in session storage to reduce database load

[No sources needed since this section provides general guidance]

## Troubleshooting Guide
- Unauthorized access
  - Ensure portal internal key is configured and matches in both web portal and control plane
  - Verify user email header is present when calling control plane endpoints

- Setup request creation failures
  - Check that user exists and is linked to a tenant
  - Confirm tenant name and config upsert succeed
  - Validate portal event log creation

- Approval and worker start issues
  - Verify PM2 is installed and accessible
  - Check worker process status updates and tenant status transitions
  - Review logs for detailed error messages

- Status polling
  - Ensure status endpoint is polled at appropriate intervals
  - Handle network errors gracefully and retry with backoff

**Section sources**
- [portal.ts](file://apps/control-plane/src/routes/portal.ts#L12-L25)
- [setup-request/route.ts](file://apps/web/src/app/api/portal/setup-request/route.ts#L18-L39)
- [admin.ts](file://apps/control-plane/src/routes/admin.ts#L447-L473)

## Conclusion
The User and SetupRequest entities form the backbone of the authentication and tenant setup workflows. Users are authenticated via Google OAuth, automatically linked to a Tenant, and granted OWNER role by default. SetupRequest captures the end-to-end lifecycle from submission to activation, with clear status transitions and administrative controls. The architecture ensures secure access through portal and admin authentication layers, while the control plane manages tenant lifecycle, worker processes, and event logging. By following the documented workflows and troubleshooting steps, administrators and developers can effectively manage users, roles, and setup requests across tenants.