# Template Selection and Customization

<cite>
**Referenced Files in This Document**
- [schema.prisma](file://packages/shared/src/prisma/schema.prisma)
- [types/index.ts](file://packages/shared/src/types/index.ts)
- [admin.ts](file://apps/control-plane/src/routes/admin.ts)
- [tenants.ejs](file://apps/control-plane/src/views/tenants.ejs)
- [tenant-detail.ejs](file://apps/control-plane/src/views/tenant-detail.ejs)
- [server.ts](file://apps/control-plane/src/server.ts)
- [index.ts](file://apps/worker/src/templates/index.ts)
- [booking.ts](file://apps/worker/src/templates/booking.ts)
- [bot.ts](file://apps/worker/src/bot.ts)
- [worker.ts](file://apps/worker/src/worker.ts)
- [stress-test.ts](file://scripts/stress-test.ts)
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
This document explains how template selection and customization work within the multi-tenant system. It covers the three available template types (BOOKING, ECOMMERCE, SUPPORT), the template type enumeration, and customization options such as business name, language, and operational hours. It also documents how template configuration is persisted via the TenantConfig model, how templates are selected during tenant setup, and how customization affects worker automation processes. Practical examples demonstrate activation, parameter configuration, and business-specific customizations, along with template switching, validation, and impact on automation.

## Project Structure
The template system spans the control plane (tenant management and configuration), the worker (automation and messaging), and shared data models (Prisma schema and TypeScript types).

```mermaid
graph TB
subgraph "Control Plane"
CP_Admin["Admin Routes<br/>admin.ts"]
CP_Server["Server<br/>server.ts"]
CP_Views["Views<br/>tenants.ejs / tenant-detail.ejs"]
end
subgraph "Worker"
WK_Bot["WhatsAppBot<br/>bot.ts"]
WK_Templates["Templates<br/>index.ts / booking.ts"]
WK_Worker["Worker Entry<br/>worker.ts"]
end
subgraph "Shared"
SH_Schema["Prisma Schema<br/>schema.prisma"]
SH_Types["Types<br/>types/index.ts"]
end
CP_Admin --> SH_Schema
CP_Admin --> SH_Types
CP_Admin --> CP_Views
CP_Server --> CP_Admin
WK_Bot --> SH_Schema
WK_Bot --> WK_Templates
WK_Worker --> WK_Bot
```

**Diagram sources**
- [admin.ts](file://apps/control-plane/src/routes/admin.ts#L104-L140)
- [tenants.ejs](file://apps/control-plane/src/views/tenants.ejs#L42-L71)
- [tenant-detail.ejs](file://apps/control-plane/src/views/tenant-detail.ejs#L45-L71)
- [server.ts](file://apps/control-plane/src/server.ts#L47-L48)
- [bot.ts](file://apps/worker/src/bot.ts#L228-L246)
- [index.ts](file://apps/worker/src/templates/index.ts#L9-L23)
- [booking.ts](file://apps/worker/src/templates/booking.ts#L1-L22)
- [worker.ts](file://apps/worker/src/worker.ts#L1-L46)
- [schema.prisma](file://packages/shared/src/prisma/schema.prisma#L78-L90)
- [types/index.ts](file://packages/shared/src/types/index.ts#L1-L41)

**Section sources**
- [admin.ts](file://apps/control-plane/src/routes/admin.ts#L104-L140)
- [tenants.ejs](file://apps/control-plane/src/views/tenants.ejs#L42-L71)
- [tenant-detail.ejs](file://apps/control-plane/src/views/tenant-detail.ejs#L45-L71)
- [server.ts](file://apps/control-plane/src/server.ts#L47-L48)
- [schema.prisma](file://packages/shared/src/prisma/schema.prisma#L78-L90)
- [types/index.ts](file://packages/shared/src/types/index.ts#L1-L41)

## Core Components
- Template types and configuration:
  - TemplateConfig defines template_type, business_name, and language.
  - TemplateType enumeration includes BOOKING, ECOMMERCE, SUPPORT.
  - Language enumeration includes SW and EN.
  - TenantConfig persists template_type, business_name, language, and optional hours_json for operational hours.

- Control plane tenant creation and configuration:
  - Admin routes accept template_type, business_name, and language during tenant creation.
  - Views present form fields for template selection, business name, and language.

- Worker automation:
  - WhatsAppBot loads TenantConfig at startup and uses getResponse to generate replies based on the selected template and language.
  - Templates implement localized responses for each template type.

**Section sources**
- [index.ts](file://apps/worker/src/templates/index.ts#L3-L7)
- [schema.prisma](file://packages/shared/src/prisma/schema.prisma#L18-L27)
- [schema.prisma](file://packages/shared/src/prisma/schema.prisma#L78-L90)
- [admin.ts](file://apps/control-plane/src/routes/admin.ts#L104-L140)
- [tenants.ejs](file://apps/control-plane/src/views/tenants.ejs#L52-L71)
- [bot.ts](file://apps/worker/src/bot.ts#L228-L246)
- [booking.ts](file://apps/worker/src/templates/booking.ts#L1-L22)

## Architecture Overview
The system integrates control plane configuration with worker automation. The control plane stores TenantConfig and exposes APIs to manage tenants and workers. The worker loads the tenant’s configuration and applies the appropriate template logic to generate automated responses.

```mermaid
sequenceDiagram
participant Admin as "Admin UI"
participant CP as "Control Plane<br/>admin.ts"
participant DB as "Database<br/>TenantConfig"
participant WK as "Worker<br/>WhatsAppBot"
participant WA as "WhatsApp"
Admin->>CP : "POST /admin/tenants"<br/>template_type, business_name, language
CP->>DB : "Create Tenant + TenantConfig"
DB-->>CP : "Tenant with config"
CP-->>Admin : "Tenant created"
Admin->>CP : "POST /admin/tenants/{id}/worker/start"
CP->>WK : "Start PM2 process with TENANT_ID"
WK->>DB : "Load TenantConfig"
DB-->>WK : "Config loaded"
WK->>WA : "Initialize and connect"
WA-->>WK : "Ready"
WK-->>Admin : "Worker RUNNING, Tenant ACTIVE"
```

**Diagram sources**
- [admin.ts](file://apps/control-plane/src/routes/admin.ts#L104-L140)
- [admin.ts](file://apps/control-plane/src/routes/admin.ts#L174-L230)
- [schema.prisma](file://packages/shared/src/prisma/schema.prisma#L78-L90)
- [bot.ts](file://apps/worker/src/bot.ts#L228-L246)
- [worker.ts](file://apps/worker/src/worker.ts#L19-L24)

## Detailed Component Analysis

### Template Types and Enumerations
- TemplateType: BOOKING, ECOMMERCE, SUPPORT
- Language: SW, EN
- TenantConfig fields:
  - template_type: TemplateType with default BOOKING
  - business_name: string
  - language: Language with default SW
  - hours_json: optional JSON for operational hours

These definitions ensure consistent validation and storage of template preferences.

**Section sources**
- [schema.prisma](file://packages/shared/src/prisma/schema.prisma#L18-L27)
- [schema.prisma](file://packages/shared/src/prisma/schema.prisma#L78-L90)

### Template Configuration Persistence
- Creation endpoint accepts template_type, business_name, language and creates TenantConfig.
- Tenant details view displays template_type, business_name, and language from TenantConfig.
- Shared types define CreateTenantInput and TenantWithRelations for consistent API contracts.

```mermaid
erDiagram
TENANT {
uuid id PK
string name
string phone_number
enum status
datetime created_at
datetime updated_at
}
TENANT_CONFIG {
uuid id PK
uuid tenant_id FK
enum template_type
string business_name
enum language
json hours_json
datetime created_at
datetime updated_at
}
TENANT ||--|| TENANT_CONFIG : "has one"
```

**Diagram sources**
- [schema.prisma](file://packages/shared/src/prisma/schema.prisma#L60-L90)
- [admin.ts](file://apps/control-plane/src/routes/admin.ts#L104-L140)
- [types/index.ts](file://packages/shared/src/types/index.ts#L1-L41)

**Section sources**
- [admin.ts](file://apps/control-plane/src/routes/admin.ts#L104-L140)
- [tenant-detail.ejs](file://apps/control-plane/src/views/tenant-detail.ejs#L58-L69)
- [types/index.ts](file://packages/shared/src/types/index.ts#L1-L41)

### Template Selection During Tenant Setup
- Admin UI provides a form with:
  - Template Type dropdown (BOOKING, ECOMMERCE, SUPPORT)
  - Business Name input
  - Language dropdown (SW, EN)
- On submit, the control plane creates Tenant and TenantConfig with the chosen values.

```mermaid
flowchart TD
Start(["Admin Form Submit"]) --> Validate["Validate Inputs"]
Validate --> Valid{"Valid?"}
Valid --> |No| Error["Return Validation Error"]
Valid --> |Yes| CreateTenant["Create Tenant"]
CreateTenant --> CreateConfig["Create TenantConfig<br/>template_type, business_name, language"]
CreateConfig --> Success["Tenant Created"]
```

**Diagram sources**
- [tenants.ejs](file://apps/control-plane/src/views/tenants.ejs#L52-L71)
- [admin.ts](file://apps/control-plane/src/routes/admin.ts#L104-L140)

**Section sources**
- [tenants.ejs](file://apps/control-plane/src/views/tenants.ejs#L42-L71)
- [admin.ts](file://apps/control-plane/src/routes/admin.ts#L104-L140)

### Customization Options
- Business name: displayed in template responses to personalize greetings and prompts.
- Language: drives localized responses for BOOKING, ECOMMERCE, and SUPPORT.
- Operational hours: stored in hours_json on TenantConfig for future use in scheduling-aware responses.

**Section sources**
- [index.ts](file://apps/worker/src/templates/index.ts#L3-L7)
- [schema.prisma](file://packages/shared/src/prisma/schema.prisma#L82-L85)

### Template Activation and Worker Automation
- Worker loads TenantConfig on startup and uses getResponse to select the correct template handler.
- The worker updates tenant status to ACTIVE upon successful connection and maintains periodic heartbeats.

```mermaid
sequenceDiagram
participant WK as "Worker<br/>WhatsAppBot"
participant DB as "Database<br/>TenantConfig"
participant WA as "WhatsApp"
WK->>DB : "loadConfig()"
DB-->>WK : "template_type, business_name, language"
WK->>WA : "initialize()"
WA-->>WK : "ready"
WK->>DB : "update status to ACTIVE"
loop "Incoming Messages"
WA->>WK : "message"
WK->>WK : "getResponse(message, config)"
WK->>WA : "reply"
end
```

**Diagram sources**
- [bot.ts](file://apps/worker/src/bot.ts#L228-L246)
- [bot.ts](file://apps/worker/src/bot.ts#L248-L331)
- [index.ts](file://apps/worker/src/templates/index.ts#L9-L23)

**Section sources**
- [bot.ts](file://apps/worker/src/bot.ts#L228-L246)
- [bot.ts](file://apps/worker/src/bot.ts#L248-L331)
- [index.ts](file://apps/worker/src/templates/index.ts#L9-L23)

### Template-Specific Behavior
- BOOKING: Personalized greeting and intent detection for booking-related keywords in Swahili and English.
- ECOMMERCE: Guidance for products, prices, orders, and delivery in Swahili and English.
- SUPPORT: Issue reporting and working hours prompt in Swahili and English.

```mermaid
classDiagram
class TemplateConfig {
+template_type
+business_name
+language
}
class Templates {
+getResponse(message, config) string
}
class BookingTemplate {
+getBookingResponse(message, businessName, language) string
}
TemplateConfig --> Templates : "drives"
Templates --> BookingTemplate : "BOOKING"
```

**Diagram sources**
- [index.ts](file://apps/worker/src/templates/index.ts#L3-L7)
- [index.ts](file://apps/worker/src/templates/index.ts#L9-L23)
- [booking.ts](file://apps/worker/src/templates/booking.ts#L1-L22)

**Section sources**
- [booking.ts](file://apps/worker/src/templates/booking.ts#L1-L22)
- [index.ts](file://apps/worker/src/templates/index.ts#L25-L69)

### Template Switching Procedures
- To switch templates, update TenantConfig.template_type via the control plane API or admin UI.
- After updating, restart the worker so it reloads TenantConfig and applies the new template logic.
- The worker supports restart and force-restart endpoints to apply configuration changes.

```mermaid
flowchart TD
Start(["Switch Template"]) --> Update["Update TenantConfig.template_type"]
Update --> Restart["Restart Worker Process"]
Restart --> Load["Worker loads new config"]
Load --> Apply["Apply new template logic"]
Apply --> End(["Active with new template"])
```

**Diagram sources**
- [admin.ts](file://apps/control-plane/src/routes/admin.ts#L257-L283)
- [admin.ts](file://apps/control-plane/src/routes/admin.ts#L285-L332)
- [bot.ts](file://apps/worker/src/bot.ts#L228-L246)

**Section sources**
- [admin.ts](file://apps/control-plane/src/routes/admin.ts#L257-L283)
- [admin.ts](file://apps/control-plane/src/routes/admin.ts#L285-L332)
- [bot.ts](file://apps/worker/src/bot.ts#L228-L246)

### Configuration Validation
- Control plane validates environment variables and database connectivity before starting.
- Tenant creation enforces required fields: name, phone_number, template_type, business_name, language.
- Worker validates TENANT_ID and handles graceful shutdown on signals.

**Section sources**
- [server.ts](file://apps/control-plane/src/server.ts#L17-L39)
- [admin.ts](file://apps/control-plane/src/routes/admin.ts#L104-L140)
- [worker.ts](file://apps/worker/src/worker.ts#L12-L15)

### Impact on Worker Automation
- Template changes immediately affect message handling once the worker reloads configuration.
- Heartbeat monitoring ensures continuous operation; stale workers are marked ERROR and tenant status updated accordingly.
- Rate limiting, deduplication, and queue management remain consistent across template switches.

**Section sources**
- [bot.ts](file://apps/worker/src/bot.ts#L248-L331)
- [admin.ts](file://apps/control-plane/src/routes/admin.ts#L30-L80)

## Dependency Analysis
The control plane depends on Prisma models and admin routes to manage tenants and workers. The worker depends on the control plane for configuration and on templates for response generation.

```mermaid
graph LR
AdminRoutes["Admin Routes<br/>admin.ts"] --> PrismaSchema["Prisma Schema<br/>schema.prisma"]
AdminRoutes --> Views["Admin Views<br/>tenants.ejs / tenant-detail.ejs"]
Server["Control Plane Server<br/>server.ts"] --> AdminRoutes
Bot["WhatsAppBot<br/>bot.ts"] --> PrismaSchema
Bot --> Templates["Templates<br/>index.ts / booking.ts"]
WorkerEntry["Worker Entry<br/>worker.ts"] --> Bot
```

**Diagram sources**
- [admin.ts](file://apps/control-plane/src/routes/admin.ts#L104-L140)
- [server.ts](file://apps/control-plane/src/server.ts#L47-L48)
- [schema.prisma](file://packages/shared/src/prisma/schema.prisma#L78-L90)
- [bot.ts](file://apps/worker/src/bot.ts#L228-L246)
- [index.ts](file://apps/worker/src/templates/index.ts#L9-L23)
- [booking.ts](file://apps/worker/src/templates/booking.ts#L1-L22)
- [worker.ts](file://apps/worker/src/worker.ts#L19-L24)

**Section sources**
- [admin.ts](file://apps/control-plane/src/routes/admin.ts#L104-L140)
- [server.ts](file://apps/control-plane/src/server.ts#L47-L48)
- [schema.prisma](file://packages/shared/src/prisma/schema.prisma#L78-L90)
- [bot.ts](file://apps/worker/src/bot.ts#L228-L246)
- [index.ts](file://apps/worker/src/templates/index.ts#L9-L23)
- [booking.ts](file://apps/worker/src/templates/booking.ts#L1-L22)
- [worker.ts](file://apps/worker/src/worker.ts#L19-L24)

## Performance Considerations
- Worker isolation: Each tenant runs a dedicated PM2 process with a unique name to prevent cross-tenant interference.
- Heartbeat intervals and stale worker detection help maintain system health.
- Rate limiting and message deduplication reduce load and avoid duplicate replies.

**Section sources**
- [stress-test.ts](file://scripts/stress-test.ts#L258-L299)
- [admin.ts](file://apps/control-plane/src/routes/admin.ts#L30-L80)
- [bot.ts](file://apps/worker/src/bot.ts#L264-L278)

## Troubleshooting Guide
- Worker fails to start: Check TENANT_ID environment variable and database connectivity. Review worker logs for initialization errors.
- Stale workers: The control plane periodically marks workers as ERROR if no heartbeat is received within the configured threshold.
- Template not applied: Ensure TenantConfig.template_type is set correctly and restart the worker to reload configuration.
- Language or business name not reflected: Confirm TenantConfig fields are updated and the worker has reloaded the configuration.

**Section sources**
- [worker.ts](file://apps/worker/src/worker.ts#L12-L15)
- [server.ts](file://apps/control-plane/src/server.ts#L17-L39)
- [admin.ts](file://apps/control-plane/src/routes/admin.ts#L30-L80)
- [bot.ts](file://apps/worker/src/bot.ts#L228-L246)

## Conclusion
The multi-tenant system provides robust template selection and customization through a clear separation of concerns: control plane configuration, persistent TenantConfig, and worker-driven automation. With three template types, language support, and optional operational hours, businesses can tailor their automation to fit booking, e-commerce, or support use cases. Template switching is straightforward and worker restarts ensure immediate adoption of new configurations, while monitoring and validation keep the system resilient.