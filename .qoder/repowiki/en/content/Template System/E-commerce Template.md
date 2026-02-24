# E-commerce Template

<cite>
**Referenced Files in This Document**
- [bot.ts](file://apps/worker/src/bot.ts)
- [worker.ts](file://apps/worker/src/worker.ts)
- [index.ts](file://apps/worker/src/templates/index.ts)
- [booking.ts](file://apps/worker/src/templates/booking.ts)
- [rate-limiter.ts](file://apps/worker/src/utils/rate-limiter.ts)
- [chat-queue.ts](file://apps/worker/src/utils/chat-queue.ts)
- [dedup.ts](file://apps/worker/src/utils/dedup.ts)
- [reconnect.ts](file://apps/worker/src/utils/reconnect.ts)
- [schema.prisma](file://packages/shared/src/prisma/schema.prisma)
- [types/index.ts](file://packages/shared/src/types/index.ts)
- [README.md](file://README.md)
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
This document explains the E-commerce template functionality within the WhatsApp chatbot platform. It focuses on how the system responds to product catalog inquiries, pricing requests, order placement workflows, and delivery information provision. It also documents the multilingual search logic for product discovery using Swahili keywords (bei/gharama for price, agiza for order) and English equivalents (price, order), along with response generation patterns for product inquiries, quantity requests, order confirmations, and delivery options. Guidance is included for integrating with e-commerce business logic, managing inventory, coordinating payments, and escalating customer service.

## Project Structure
The e-commerce template is implemented in the worker application and integrates with shared infrastructure for configuration, logging, and persistence.

```mermaid
graph TB
subgraph "Worker"
A["bot.ts<br/>WhatsAppBot orchestrator"]
B["templates/index.ts<br/>Template dispatcher"]
C["templates/booking.ts<br/>Booking template (reference)"]
D["utils/rate-limiter.ts<br/>Rate limiter"]
E["utils/chat-queue.ts<br/>Per-chat queue"]
F["utils/dedup.ts<br/>Message deduplicator"]
G["utils/reconnect.ts<br/>Reconnect manager"]
end
subgraph "Shared"
H["prisma/schema.prisma<br/>Tenant, Config, Session, Logs"]
I["types/index.ts<br/>TenantWithRelations, CreateTenantInput"]
end
A --> B
A --> D
A --> E
A --> F
A --> G
A --> H
B --> C
H --> I
```

**Diagram sources**
- [bot.ts](file://apps/worker/src/bot.ts#L1-L411)
- [index.ts](file://apps/worker/src/templates/index.ts#L1-L70)
- [booking.ts](file://apps/worker/src/templates/booking.ts#L1-L22)
- [rate-limiter.ts](file://apps/worker/src/utils/rate-limiter.ts#L1-L110)
- [chat-queue.ts](file://apps/worker/src/utils/chat-queue.ts#L1-L140)
- [dedup.ts](file://apps/worker/src/utils/dedup.ts#L1-L93)
- [reconnect.ts](file://apps/worker/src/utils/reconnect.ts#L1-L117)
- [schema.prisma](file://packages/shared/src/prisma/schema.prisma#L1-L178)
- [types/index.ts](file://packages/shared/src/types/index.ts#L1-L41)

**Section sources**
- [bot.ts](file://apps/worker/src/bot.ts#L1-L411)
- [index.ts](file://apps/worker/src/templates/index.ts#L1-L70)
- [schema.prisma](file://packages/shared/src/prisma/schema.prisma#L1-L178)

## Core Components
- Template dispatcher: Routes incoming messages to the appropriate template handler based on tenant configuration.
- E-commerce response generator: Implements multilingual logic for product, price, order, and delivery intents.
- WhatsAppBot: Orchestrates message handling, rate limiting, queueing, deduplication, and reconnect logic.
- Persistence and types: Tenant configuration, session state, message logs, and worker process tracking.

Key responsibilities:
- Product catalog response system: Provides structured prompts for product and price requests.
- Pricing inquiry handling: Guides users to specify products for pricing.
- Order placement workflows: Requests product and quantity details for orders.
- Delivery information provision: Offers delivery-related guidance.
- Multilingual support: Recognizes Swahili and English keywords for intent detection.

**Section sources**
- [index.ts](file://apps/worker/src/templates/index.ts#L9-L49)
- [bot.ts](file://apps/worker/src/bot.ts#L248-L331)
- [schema.prisma](file://packages/shared/src/prisma/schema.prisma#L60-L131)
- [types/index.ts](file://packages/shared/src/types/index.ts#L1-L41)

## Architecture Overview
The worker receives messages, loads tenant configuration, applies rate limiting and queueing, and dispatches to the E-commerce template. Responses are logged and sent back to the customer.

```mermaid
sequenceDiagram
participant User as "Customer"
participant WA as "WhatsAppBot"
participant RL as "RateLimiter"
participant Q as "ChatQueueManager"
participant TPL as "Template Dispatcher"
participant DB as "PrismaClient"
User->>WA : "Message"
WA->>DB : "Log incoming message"
WA->>RL : "checkLimit(tenantId)"
RL-->>WA : "{allowed, remaining}"
alt allowed
WA->>Q : "enqueue(chatId, handler)"
Q-->>WA : "execute handler"
WA->>TPL : "getResponse(message, config)"
TPL-->>WA : "response text"
WA->>DB : "Log outgoing message"
WA-->>User : "Reply"
else rate limited
WA-->>User : "Warning (slow down)"
end
```

**Diagram sources**
- [bot.ts](file://apps/worker/src/bot.ts#L248-L331)
- [rate-limiter.ts](file://apps/worker/src/utils/rate-limiter.ts#L32-L73)
- [chat-queue.ts](file://apps/worker/src/utils/chat-queue.ts#L35-L67)
- [index.ts](file://apps/worker/src/templates/index.ts#L9-L23)

## Detailed Component Analysis

### Template Dispatcher and E-commerce Response Generator
The dispatcher selects the template type from tenant configuration and delegates to the E-commerce handler. The E-commerce handler recognizes multilingual keywords and returns contextual prompts.

```mermaid
flowchart TD
Start(["Message received"]) --> LoadConfig["Load tenant config"]
LoadConfig --> SwitchTpl{"template_type?"}
SwitchTpl --> |ECOMMERCE| Ecom["getEcommerceResponse(message, businessName, language)"]
SwitchTpl --> |BOOKING| Book["getBookingResponse(...)"]
SwitchTpl --> |SUPPORT| Supp["getSupportResponse(...)"]
Ecom --> DetectLang{"language?"}
DetectLang --> |SW| Sw["Detect Swahili keywords:<br/>bei/gharama (price)<br/>agiza (order)"]
DetectLang --> |EN| En["Detect English keywords:<br/>price<br/>order"]
Sw --> PricePrompt["Prompt for product to inquire about price"]
Sw --> OrderPrompt["Prompt for product and quantity to order"]
En --> PricePrompt
En --> OrderPrompt
PricePrompt --> End(["Return response"])
OrderPrompt --> End
```

**Diagram sources**
- [index.ts](file://apps/worker/src/templates/index.ts#L9-L49)
- [booking.ts](file://apps/worker/src/templates/booking.ts#L1-L22)

**Section sources**
- [index.ts](file://apps/worker/src/templates/index.ts#L9-L49)
- [booking.ts](file://apps/worker/src/templates/booking.ts#L1-L22)

### WhatsAppBot Message Handling Pipeline
The bot coordinates rate limiting, queueing, deduplication, and reconnect logic before invoking the template response generator.

```mermaid
flowchart TD
A["on 'message'"] --> B["Skip self messages"]
B --> C["Deduplicate by wa_message_id"]
C --> D["Enqueue per chatId"]
D --> E["RateLimiter.checkLimit(tenantId)"]
E --> |allowed| F["getResponse(message, config)"]
E --> |exceeded| G["Send 'slow down' warning"]
F --> H["Log outgoing message"]
H --> I["Update last_seen_at"]
G --> J(["End"])
I --> J
```

**Diagram sources**
- [bot.ts](file://apps/worker/src/bot.ts#L153-L331)
- [dedup.ts](file://apps/worker/src/utils/dedup.ts#L28-L46)
- [rate-limiter.ts](file://apps/worker/src/utils/rate-limiter.ts#L32-L73)

**Section sources**
- [bot.ts](file://apps/worker/src/bot.ts#L153-L331)
- [dedup.ts](file://apps/worker/src/utils/dedup.ts#L1-L93)
- [rate-limiter.ts](file://apps/worker/src/utils/rate-limiter.ts#L1-L110)

### Rate Limiter
Controls the number of replies per tenant per minute to prevent spam and protect resources.

```mermaid
classDiagram
class RateLimiter {
-limits : Map~string, RateLimitEntry~
-config : RateLimitConfig
+checkLimit(tenantId) AllowedStatus
+getStatus(tenantId) Status
+updateConfig(config) void
}
class RateLimitEntry {
+count : number
+windowStart : number
+warningSent : boolean
}
RateLimiter --> RateLimitEntry : "manages"
```

**Diagram sources**
- [rate-limiter.ts](file://apps/worker/src/utils/rate-limiter.ts#L17-L106)

**Section sources**
- [rate-limiter.ts](file://apps/worker/src/utils/rate-limiter.ts#L1-L110)

### Chat Queue Manager
Ensures sequential processing per chat to avoid race conditions and inconsistent state.

```mermaid
classDiagram
class ChatQueueManager {
-queues : Map~string, ChatQueue~
-maxQueueSize : number
-tenantId : string
+enqueue(chatId, execute) Promise
+getQueueSize(chatId) number
+getTotalQueued() number
+clearAll() void
}
class ChatQueue {
+messages : QueuedMessage[]
+processing : boolean
}
ChatQueueManager --> ChatQueue : "manages"
```

**Diagram sources**
- [chat-queue.ts](file://apps/worker/src/utils/chat-queue.ts#L21-L139)

**Section sources**
- [chat-queue.ts](file://apps/worker/src/utils/chat-queue.ts#L1-L140)

### Message Deduplicator
Prevents duplicate processing of the same message using the WhatsApp message ID.

```mermaid
classDiagram
class MessageDeduplicator {
-seenMessages : Map~string, DedupEntry~
-maxSize : number
-ttlMs : number
+isDuplicate(waMessageId) boolean
+markSeen(waMessageId) void
+getStats() Stats
}
```

**Diagram sources**
- [dedup.ts](file://apps/worker/src/utils/dedup.ts#L11-L89)

**Section sources**
- [dedup.ts](file://apps/worker/src/utils/dedup.ts#L1-L93)

### Reconnect Manager
Manages exponential backoff reconnection attempts when the WhatsApp client disconnects.

```mermaid
classDiagram
class ReconnectManager {
-config : ReconnectConfig
-attemptCount : number
-currentDelay : number
-isReconnecting : boolean
-reconnectTimer : Timeout
+start() void
+stop() void
+reset() void
+getStatus() Status
}
```

**Diagram sources**
- [reconnect.ts](file://apps/worker/src/utils/reconnect.ts#L14-L116)

**Section sources**
- [reconnect.ts](file://apps/worker/src/utils/reconnect.ts#L1-L117)

### Persistence and Types
Tenant configuration, session state, message logs, and worker process tracking are persisted in the database.

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
TENANT_CONFIG {
string id PK
string tenant_id FK
enum template_type
string business_name
enum language
json hours_json
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
MESSAGE_LOG {
string id PK
string tenant_id FK
enum direction
string from_number
string to_number
string message_text
string wa_message_id
datetime created_at
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
TENANT ||--o| TENANT_CONFIG : "has one"
TENANT ||--o| WHATSAPP_SESSION : "has one"
TENANT ||--o{ MESSAGE_LOG : "logs"
TENANT ||--o| WORKER_PROCESS : "has one"
```

**Diagram sources**
- [schema.prisma](file://packages/shared/src/prisma/schema.prisma#L60-L131)

**Section sources**
- [schema.prisma](file://packages/shared/src/prisma/schema.prisma#L1-L178)
- [types/index.ts](file://packages/shared/src/types/index.ts#L1-L41)

## Dependency Analysis
- The worker depends on shared types and Prisma for persistence.
- The E-commerce template depends on tenant configuration (template_type, business_name, language).
- The bot composes utilities for reliability and resilience.

```mermaid
graph LR
Bot["WhatsAppBot (bot.ts)"] --> Tpl["Template Dispatcher (index.ts)"]
Bot --> RL["RateLimiter (rate-limiter.ts)"]
Bot --> Q["ChatQueueManager (chat-queue.ts)"]
Bot --> Dedup["MessageDeduplicator (dedup.ts)"]
Bot --> Reconn["ReconnectManager (reconnect.ts)"]
Bot --> DB["PrismaClient (shared)"]
Tpl --> Ecom["E-commerce Handler (index.ts)"]
Tpl --> Book["Booking Handler (booking.ts)"]
DB --> Schema["Prisma Schema (schema.prisma)"]
```

**Diagram sources**
- [bot.ts](file://apps/worker/src/bot.ts#L1-L411)
- [index.ts](file://apps/worker/src/templates/index.ts#L1-L70)
- [booking.ts](file://apps/worker/src/templates/booking.ts#L1-L22)
- [rate-limiter.ts](file://apps/worker/src/utils/rate-limiter.ts#L1-L110)
- [chat-queue.ts](file://apps/worker/src/utils/chat-queue.ts#L1-L140)
- [dedup.ts](file://apps/worker/src/utils/dedup.ts#L1-L93)
- [reconnect.ts](file://apps/worker/src/utils/reconnect.ts#L1-L117)
- [schema.prisma](file://packages/shared/src/prisma/schema.prisma#L1-L178)

**Section sources**
- [bot.ts](file://apps/worker/src/bot.ts#L1-L411)
- [index.ts](file://apps/worker/src/templates/index.ts#L1-L70)

## Performance Considerations
- Rate limiting prevents burst traffic and protects downstream systems.
- Per-chat queueing ensures deterministic processing and avoids race conditions.
- Deduplication reduces redundant processing and improves throughput.
- Heartbeat monitoring keeps the worker alive and responsive.
- Reconnect with exponential backoff minimizes downtime and resource contention.

[No sources needed since this section provides general guidance]

## Troubleshooting Guide
Common issues and resolutions:
- QR code not appearing: Check worker logs and ensure the worker is started and running.
- Session not persisting: Verify session storage path and permissions.
- Database connection errors: Confirm connection string format and PostgreSQL availability.
- WhatsApp Web errors: Ensure Chromium is installed and executable path is configured.
- Rate limit warnings: Adjust RATE_LIMIT_MAX_PER_MINUTE environment variable.
- Stale workers: Workers without heartbeats are auto-marked as ERROR; use Force Restart.

**Section sources**
- [README.md](file://README.md#L185-L208)
- [README.md](file://README.md#L452-L474)

## Conclusion
The E-commerce template provides a robust, multilingual foundation for product catalog inquiries, pricing requests, order placement, and delivery information. Through tenant configuration, the system dynamically adapts responses to Swahili and English contexts. The worker’s reliability features—rate limiting, queueing, deduplication, and reconnect—ensure consistent operation under real-world conditions. While the current implementation focuses on intent-driven prompts, future enhancements can integrate with inventory and payment systems to complete end-to-end e-commerce workflows.

[No sources needed since this section summarizes without analyzing specific files]

## Appendices

### Response Generation Patterns
- Product inquiries: Prompt users to specify the product they want to know the price for.
- Quantity requests: Prompt users to specify the product and quantity they want to order.
- Order confirmations: Provide a follow-up message acknowledging receipt of the order request.
- Delivery options: Offer guidance on delivery-related information.

These patterns align with the multilingual keyword detection logic for price and order intents.

**Section sources**
- [index.ts](file://apps/worker/src/templates/index.ts#L25-L49)

### Integration with E-commerce Business Logic
- Inventory management integration: Extend the E-commerce handler to query product availability and stock levels before confirming orders.
- Payment processing coordination: Integrate with a payment provider to collect payments upon order confirmation.
- Customer service escalation: Route complex issues to a support template or external escalation channels.

[No sources needed since this section provides general guidance]