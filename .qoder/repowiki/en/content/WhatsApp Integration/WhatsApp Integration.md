# WhatsApp Integration

<cite>
**Referenced Files in This Document**
- [apps/web/src/app/(portal)/app/whatsapp/page.tsx](file://apps/web/src/app/(portal)/app/whatsapp/page.tsx)
- [apps/web/src/app/api/portal/tenant/current/qr/route.ts](file://apps/web/src/app/api/portal/tenant/current/qr/route.ts)
- [apps/web/src/app/api/portal/tenant/current/status/route.ts](file://apps/web/src/app/api/portal/tenant/current/status/route.ts)
- [apps/worker/src/bot.ts](file://apps/worker/src/bot.ts)
- [apps/worker/src/worker.ts](file://apps/worker/src/worker.ts)
- [apps/worker/src/templates/index.ts](file://apps/worker/src/templates/index.ts)
- [apps/worker/src/templates/booking.ts](file://apps/worker/src/templates/booking.ts)
- [apps/worker/src/utils/chat-queue.ts](file://apps/worker/src/utils/chat-queue.ts)
- [apps/worker/src/utils/dedup.ts](file://apps/worker/src/utils/dedup.ts)
- [apps/worker/src/utils/rate-limiter.ts](file://apps/worker/src/utils/rate-limiter.ts)
- [apps/worker/src/utils/reconnect.ts](file://apps/worker/src/utils/reconnect.ts)
- [apps/worker/package.json](file://apps/worker/package.json)
- [packages/shared/src/utils/logger.ts](file://packages/shared/src/utils/logger.ts)
- [apps/control-plane/src/server.ts](file://apps/control-plane/src/server.ts)
- [apps/control-plane/src/routes/portal.ts](file://apps/control-plane/src/routes/portal.ts)
- [apps/control-plane/src/routes/admin.ts](file://apps/control-plane/src/routes/admin.ts)
- [apps/control-plane/src/views/tenant-detail.ejs](file://apps/control-plane/src/views/tenant-detail.ejs)
</cite>

## Update Summary
**Changes Made**
- Enhanced QR code expiration detection with 65-second timeout and automatic QR regeneration
- Improved error reporting with alert codes (BAN_SIGNAL, DISCONNECTED, QR_EXPIRED)
- Added group message filtering to respond only to 1-on-1 chats
- Enhanced reconnect logic with comprehensive error state management
- Updated session state transitions with QR_EXPIRED state
- Expanded troubleshooting guide with QR expiration scenarios

## Table of Contents
1. [Introduction](#introduction)
2. [Project Structure](#project-structure)
3. [Core Components](#core-components)
4. [Architecture Overview](#architecture-overview)
5. [Detailed Component Analysis](#detailed-component-analysis)
6. [Enhanced Connection Flow](#enhanced-connection-flow)
7. [Session States and Transitions](#session-states-and-transitions)
8. [Dependency Analysis](#dependency-analysis)
9. [Performance Considerations](#performance-considerations)
10. [Troubleshooting Guide](#troubleshooting-guide)
11. [Conclusion](#conclusion)
12. [Appendices](#appendices)

## Introduction
This document explains the WhatsApp Web API integration and automation built with the whatsapp-web.js library. It covers QR code authentication flow with expiration detection, session management and persistence, worker lifecycle, session states (DISCONNECTED, QR_READY, CONNECTED, CONNECTING, QR_EXPIRED), automatic reconnection, message processing workflows, template-based response generation, and error handling strategies. It also provides guidance on Chrome/Chromium dependencies, executable path configuration, and system requirements for reliable operation.

**Updated** Enhanced with QR code expiration detection, automatic QR regeneration, improved error reporting, group message filtering, and enhanced reconnect logic.

## Project Structure
The integration spans three primary areas:
- Frontend portal for QR display and status monitoring with enhanced state indicators
- Control plane backend for orchestration and session state management
- Worker process that runs the WhatsApp client, handles messages, and manages persistence

```mermaid
graph TB
subgraph "Web Portal"
WP["WhatsApp Page<br/>(apps/web/.../whatsapp/page.tsx)"]
QRRoute["QR Route<br/>(apps/web/.../qr/route.ts)"]
StatusRoute["Status Route<br/>(apps/web/.../status/route.ts)"]
end
subgraph "Control Plane"
CP["Control Plane Server<br/>(apps/control-plane/.../server.ts)"]
PortalRoutes["Portal Routes<br/>(apps/control-plane/.../routes/portal.ts)"]
AdminRoutes["Admin Routes<br/>(apps/control-plane/.../routes/admin.ts)"]
TenantView["Tenant View<br/>(apps/control-plane/.../views/tenant-detail.ejs)"]
end
subgraph "Worker"
WorkerMain["Worker Entry<br/>(apps/worker/.../worker.ts)"]
Bot["WhatsAppBot<br/>(apps/worker/.../bot.ts)"]
Templates["Templates<br/>(apps/worker/.../templates/index.ts)"]
Utils["Utilities<br/>(chat-queue, dedup, rate-limiter, reconnect)"]
end
WP --> QRRoute
WP --> StatusRoute
QRRoute --> CP
StatusRoute --> CP
CP --> PortalRoutes
PortalRoutes --> AdminRoutes
AdminRoutes --> TenantView
CP --> PortalRoutes
PortalRoutes --> WorkerMain
WorkerMain --> Bot
Bot --> Templates
Bot --> Utils
```

**Diagram sources**
- [apps/web/src/app/(portal)/app/whatsapp/page.tsx](file://apps/web/src/app/(portal)/app/whatsapp/page.tsx#L1-L163)
- [apps/web/src/app/api/portal/tenant/current/qr/route.ts](file://apps/web/src/app/api/portal/tenant/current/qr/route.ts#L1-L35)
- [apps/web/src/app/api/portal/tenant/current/status/route.ts](file://apps/web/src/app/api/portal/tenant/current/status/route.ts#L1-L35)
- [apps/control-plane/src/server.ts](file://apps/control-plane/src/server.ts#L1-L89)
- [apps/control-plane/src/routes/portal.ts](file://apps/control-plane/src/routes/portal.ts#L1-L261)
- [apps/control-plane/src/routes/admin.ts](file://apps/control-plane/src/routes/admin.ts#L1-L460)
- [apps/control-plane/src/views/tenant-detail.ejs](file://apps/control-plane/src/views/tenant-detail.ejs#L141-L163)
- [apps/worker/src/worker.ts](file://apps/worker/src/worker.ts#L1-L46)
- [apps/worker/src/bot.ts](file://apps/worker/src/bot.ts#L1-L586)

**Section sources**
- [apps/web/src/app/(portal)/app/whatsapp/page.tsx](file://apps/web/src/app/(portal)/app/whatsapp/page.tsx#L1-L163)
- [apps/web/src/app/api/portal/tenant/current/qr/route.ts](file://apps/web/src/app/api/portal/tenant/current/qr/route.ts#L1-L35)
- [apps/web/src/app/api/portal/tenant/current/status/route.ts](file://apps/web/src/app/api/portal/tenant/current/status/route.ts#L1-L35)
- [apps/control-plane/src/server.ts](file://apps/control-plane/src/server.ts#L1-L89)
- [apps/control-plane/src/routes/portal.ts](file://apps/control-plane/src/routes/portal.ts#L1-L261)
- [apps/control-plane/src/routes/admin.ts](file://apps/control-plane/src/routes/admin.ts#L1-L460)
- [apps/control-plane/src/views/tenant-detail.ejs](file://apps/control-plane/src/views/tenant-detail.ejs#L141-L163)
- [apps/worker/src/worker.ts](file://apps/worker/src/worker.ts#L1-L46)
- [apps/worker/src/bot.ts](file://apps/worker/src/bot.ts#L1-L586)

## Core Components
- WhatsAppBot: Orchestrates the whatsapp-web.js client, event handlers, session state updates, message processing, rate limiting, deduplication, queueing, and reconnect logic with enhanced QR expiration detection and error reporting.
- Worker entry: Initializes environment, validates required variables, starts the bot, and handles graceful shutdown signals.
- Templates: Provides template-based response generation based on tenant configuration (type, language, business name).
- Utilities: ChatQueueManager (per-chat sequential processing), MessageDeduplicator (prevent duplicate processing), RateLimiter (outgoing reply throttling), ReconnectManager (exponential backoff with comprehensive error states).
- Web Portal: Fetches QR and status from the control plane and renders connection state to the user with enhanced state indicators.
- Control Plane: Validates environment, exposes endpoints for QR and status, coordinates worker lifecycle, and provides admin monitoring with alert codes.

**Updated** Enhanced with QR expiration detection, automatic QR regeneration, improved error reporting, and group message filtering.

**Section sources**
- [apps/worker/src/bot.ts](file://apps/worker/src/bot.ts#L1-L586)
- [apps/worker/src/worker.ts](file://apps/worker/src/worker.ts#L1-L46)
- [apps/worker/src/templates/index.ts](file://apps/worker/src/templates/index.ts#L1-L70)
- [apps/worker/src/utils/chat-queue.ts](file://apps/worker/src/utils/chat-queue.ts#L1-L140)
- [apps/worker/src/utils/dedup.ts](file://apps/worker/src/utils/dedup.ts#L1-L93)
- [apps/worker/src/utils/rate-limiter.ts](file://apps/worker/src/utils/rate-limiter.ts#L1-L110)
- [apps/worker/src/utils/reconnect.ts](file://apps/worker/src/utils/reconnect.ts#L1-L117)
- [apps/web/src/app/(portal)/app/whatsapp/page.tsx](file://apps/web/src/app/(portal)/app/whatsapp/page.tsx#L1-L163)
- [apps/web/src/app/api/portal/tenant/current/qr/route.ts](file://apps/web/src/app/api/portal/tenant/current/qr/route.ts#L1-L35)
- [apps/web/src/app/api/portal/tenant/current/status/route.ts](file://apps/web/src/app/api/portal/tenant/current/status/route.ts#L1-L35)
- [apps/control-plane/src/server.ts](file://apps/control-plane/src/server.ts#L1-L89)
- [apps/control-plane/src/routes/portal.ts](file://apps/control-plane/src/routes/portal.ts#L1-L261)
- [apps/control-plane/src/routes/admin.ts](file://apps/control-plane/src/routes/admin.ts#L1-L460)
- [apps/control-plane/src/views/tenant-detail.ejs](file://apps/control-plane/src/views/tenant-detail.ejs#L141-L163)

## Architecture Overview
The system follows a client-server-worker pattern with enhanced state management and QR expiration detection:
- The web portal communicates with the control plane via internal keys and user sessions.
- The control plane exposes endpoints for QR retrieval and status with comprehensive state tracking including QR_EXPIRED.
- The worker process initializes the WhatsApp client, persists session data, detects QR expiration, and processes messages.
- Session state is stored in the database and surfaced to the portal with real-time updates.
- Admin monitoring displays prominent alerts for BAN_SIGNAL, DISCONNECTED, and QR_EXPIRED states.

```mermaid
sequenceDiagram
participant Browser as "Browser"
participant Web as "Web Routes<br/>(qr/status)"
participant Control as "Control Plane"
participant Worker as "WhatsAppBot"
participant WA as "WhatsApp Web"
Browser->>Web : GET /api/portal/tenant/current/qr
Web->>Control : Forward request with internal key
Control->>Worker : Retrieve QR/state
Control-->>Web : Return QR data/state
Web-->>Browser : Render QR or status with state indicators
Worker->>WA : initialize()
WA-->>Worker : emit "qr"
Worker->>Worker : Start 65-second expiry timer
Worker->>Control : Update state=QR_READY with QR dataURL
Control-->>Browser : QR visible in portal with countdown
Browser->>Web : QR refreshes automatically
Worker->>Worker : Timer expires without scan
Worker->>Control : Update last_error=QR_EXPIRED
WA-->>Worker : emit "ready"
Worker->>Worker : Cancel expiry timer
Worker->>Control : Update state=CONNECTED, last_seen_at
Control-->>Browser : Status CONNECTED with success indicator
WA-->>Worker : emit "message"
Worker->>Worker : Filter group messages, De-duplicate, Queue, Rate-limit
Worker->>Control : Log inbound/outbound messages
Worker->>WA : reply()
WA-->>Worker : sent
```

**Diagram sources**
- [apps/web/src/app/api/portal/tenant/current/qr/route.ts](file://apps/web/src/app/api/portal/tenant/current/qr/route.ts#L1-L35)
- [apps/web/src/app/api/portal/tenant/current/status/route.ts](file://apps/web/src/app/api/portal/tenant/current/status/route.ts#L1-L35)
- [apps/control-plane/src/routes/portal.ts](file://apps/control-plane/src/routes/portal.ts#L207-L231)
- [apps/worker/src/bot.ts](file://apps/worker/src/bot.ts#L79-L109)
- [apps/worker/src/bot.ts](file://apps/worker/src/bot.ts#L111-L167)

## Detailed Component Analysis

### WhatsAppBot: Client, Events, Persistence, and Recovery
WhatsAppBot encapsulates:
- Client initialization with LocalAuth and headless Chromium/Puppeteer options
- Event handlers for QR, ready, message, disconnected, and auth_failure with enhanced state management and QR expiration detection
- Session state updates in the database with comprehensive state tracking including QR_EXPIRED
- Heartbeat maintenance with periodic status updates
- Message processing pipeline with deduplication, queueing, rate limiting, and group message filtering
- Automatic reconnection with exponential backoff and comprehensive error state management with alert codes

```mermaid
classDiagram
class WhatsAppBot {
-client : Client
-prisma : PrismaClient
-logger : Logger
-tenantId : string
-config : TemplateConfig
-isReady : boolean
-rateLimiter : RateLimiter
-chatQueue : ChatQueueManager
-deduplicator : MessageDeduplicator
-reconnectManager : ReconnectManager
-heartbeatInterval : Timeout
-qrExpiryTimeout : Timeout
+constructor(tenantId, sessionsPath)
+start()
+stop()
-setupEventHandlers()
-loadConfig()
-handleMessage(msg)
-startHeartbeat()
-stopHeartbeat()
}
class RateLimiter {
+checkLimit(tenantId)
+getStatus(tenantId)
+updateConfig(cfg)
}
class ChatQueueManager {
+enqueue(chatId, execute)
+getQueueSize(chatId)
+getTotalQueued()
+clearAll()
}
class MessageDeduplicator {
+isDuplicate(waMessageId)
+markSeen(waMessageId)
+getStats()
}
class ReconnectManager {
+start()
+stop()
+reset()
+getStatus()
}
WhatsAppBot --> RateLimiter : "uses"
WhatsAppBot --> ChatQueueManager : "uses"
WhatsAppBot --> MessageDeduplicator : "uses"
WhatsAppBot --> ReconnectManager : "uses"
```

**Diagram sources**
- [apps/worker/src/bot.ts](file://apps/worker/src/bot.ts#L12-L75)
- [apps/worker/src/utils/rate-limiter.ts](file://apps/worker/src/utils/rate-limiter.ts#L17-L106)
- [apps/worker/src/utils/chat-queue.ts](file://apps/worker/src/utils/chat-queue.ts#L21-L139)
- [apps/worker/src/utils/dedup.ts](file://apps/worker/src/utils/dedup.ts#L11-L89)
- [apps/worker/src/utils/reconnect.ts](file://apps/worker/src/utils/reconnect.ts#L14-L85)

Key behaviors:
- QR code handling: Converts QR string to a data URL, starts 65-second expiry timer, and persists state=QR_READY with enhanced error handling.
- QR expiration detection: Automatically generates QR_EXPIRED error when QR is not scanned within 65 seconds.
- Ready state: Updates state=CONNECTED, cancels QR expiry timer, sets ACTIVE tenant status, RUNNING worker status, loads configuration, starts heartbeat.
- Disconnected: Updates DISCONNECTED state, stops heartbeat, triggers reconnect manager with comprehensive error logging including DISCONNECTED alert code.
- Auth failure: Updates ERROR state for both tenant and worker process with detailed error messages prefixed with BAN_SIGNAL alert code.
- Message handling: Filters group messages (@g.us), logs inbound, checks rate limit, generates template-based response, logs outbound, updates last_seen_at.

**Updated** Enhanced with QR expiration detection, automatic QR regeneration, improved error reporting with alert codes, and group message filtering.

**Section sources**
- [apps/worker/src/bot.ts](file://apps/worker/src/bot.ts#L79-L109)
- [apps/worker/src/bot.ts](file://apps/worker/src/bot.ts#L111-L167)
- [apps/worker/src/bot.ts](file://apps/worker/src/bot.ts#L169-L202)
- [apps/worker/src/bot.ts](file://apps/worker/src/bot.ts#L204-L251)
- [apps/worker/src/bot.ts](file://apps/worker/src/bot.ts#L292-L506)

### Worker Lifecycle and Signals
The worker entry script:
- Loads environment variables
- Validates TENANT_ID presence
- Instantiates WhatsAppBot and starts it
- Handles SIGTERM/SIGINT for graceful shutdown
- Catches uncaught exceptions and unhandled rejections

```mermaid
sequenceDiagram
participant Proc as "Process"
participant Entry as "worker.ts"
participant Bot as "WhatsAppBot"
participant DB as "Prisma"
Proc->>Entry : start
Entry->>Entry : validate env
Entry->>Bot : new WhatsAppBot(...)
Entry->>Bot : start()
Bot->>DB : connect
Bot->>Bot : client.initialize()
Proc-->>Entry : SIGTERM/SIGINT
Entry->>Bot : stop()
Bot->>Bot : stopHeartbeat()
Bot->>Bot : reconnectManager.stop()
Bot->>Bot : chatQueue.clearAll()
Bot->>Bot : client.destroy()
Bot->>DB : disconnect
```

**Diagram sources**
- [apps/worker/src/worker.ts](file://apps/worker/src/worker.ts#L1-L46)
- [apps/worker/src/bot.ts](file://apps/worker/src/bot.ts#L569-L584)

**Section sources**
- [apps/worker/src/worker.ts](file://apps/worker/src/worker.ts#L1-L46)
- [apps/worker/src/bot.ts](file://apps/worker/src/bot.ts#L569-L584)

## Enhanced Connection Flow

### Step-by-Step QR Authentication Process with Expiration Detection
The enhanced connection flow provides a comprehensive step-by-step process with real-time state updates and QR expiration detection:

```mermaid
flowchart TD
Start(["Worker Start"]) --> Init["Initialize Client with LocalAuth"]
Init --> QR["Wait for QR Event"]
QR --> StartTimer["Start 65-second Expiry Timer"]
StartTimer --> QRProcessing["Convert QR to Data URL"]
QRProcessing --> SaveQR["Save QR with state=QR_READY"]
SaveQR --> Portal["Portal Displays QR with Countdown"]
Portal --> UserScan["User Scans QR with WhatsApp"]
UserScan --> CancelTimer["Cancel Expiry Timer"]
CancelTimer --> WAReady["WhatsApp Client Ready"]
WAReady --> UpdateConnected["Update state=CONNECTED"]
UpdateConnected --> SetupComplete["Setup Complete"]
SetupComplete --> PortalRedirect["Auto-redirect to Status Page"]
QR --> TimerExpired["Timer Expires (65 seconds)"]
TimerExpired --> UpdateQRExpired["Update last_error=QR_EXPIRED"]
UpdateQRExpired --> PortalAlert["Admin Panel Shows QR_EXPIRED Alert"]
classDef default fill:#f9f9f9,stroke:#333,color:#000
```

**Diagram sources**
- [apps/worker/src/bot.ts](file://apps/worker/src/bot.ts#L79-L109)
- [apps/worker/src/bot.ts](file://apps/worker/src/bot.ts#L111-L167)
- [apps/control-plane/src/views/tenant-detail.ejs](file://apps/control-plane/src/views/tenant-detail.ejs#L155-L163)

### Frontend Integration with Enhanced State Management
The web portal now provides comprehensive state indicators and real-time updates with QR expiration awareness:

```mermaid
stateDiagram-v2
[*] --> DISCONNECTED
DISCONNECTED --> QR_READY : "on('qr')"
QR_READY --> CONNECTING : "User scans QR"
CONNECTING --> CONNECTED : "on('ready')"
CONNECTED --> DISCONNECTED : "on('disconnected')"
DISCONNECTED --> QR_EXPIRED : "QR timer expires"
QR_READY --> QR_EXPIRED : "Timer expires without scan"
QR_EXPIRED --> QR_READY : "Worker restarts"
state QR_READY {
[*] --> WaitingForScan
WaitingForScan --> QRRefresh : "Auto-refresh QR"
QRRefresh --> QRScanned : "User scans QR"
QRScanned --> QRExpired : "65-second timer expires"
}
state CONNECTING {
[*] --> Loading
Loading --> Success : "Connection established"
Loading --> Error : "Connection failed"
}
state QR_EXPIRED {
[*] --> AlertDisplayed
AlertDisplayed --> QRReady : "Worker restarted"
}
```

**Diagram sources**
- [apps/worker/src/bot.ts](file://apps/worker/src/bot.ts#L79-L109)
- [apps/worker/src/bot.ts](file://apps/worker/src/bot.ts#L204-L251)
- [apps/web/src/app/(portal)/app/whatsapp/page.tsx](file://apps/web/src/app/(portal)/app/whatsapp/page.tsx#L18-L48)

**Updated** Enhanced with QR_EXPIRED state and comprehensive state transitions.

**Section sources**
- [apps/worker/src/bot.ts](file://apps/worker/src/bot.ts#L79-L109)
- [apps/worker/src/bot.ts](file://apps/worker/src/bot.ts#L204-L251)
- [apps/web/src/app/(portal)/app/whatsapp/page.tsx](file://apps/web/src/app/(portal)/app/whatsapp/page.tsx#L18-L48)

## Session States and Transitions

### Comprehensive State Management with QR Expiration
The system now manages five distinct connection states with detailed transitions and QR expiration detection:

```mermaid
stateDiagram-v2
[*] --> DISCONNECTED
DISCONNECTED --> QR_READY : "on('qr')"
QR_READY --> CONNECTING : "User scans QR"
CONNECTING --> CONNECTED : "on('ready')"
CONNECTING --> DISCONNECTED : "on('auth_failure')"
CONNECTED --> DISCONNECTED : "on('disconnected')"
DISCONNECTED --> QR_EXPIRED : "QR timer expires"
QR_READY --> QR_EXPIRED : "Timer expires without scan"
QR_EXPIRED --> QR_READY : "Worker restarts"
state QR_READY {
[*] --> QRDisplay
QRDisplay --> QRRefresh : "Auto-refresh QR"
QRDisplay --> QRScanned : "User scans QR"
QRScanned --> QRExpired : "65-second timer expires"
}
state CONNECTING {
[*] --> LoadingSpinner
LoadingSpinner --> Success : "Connection established"
LoadingSpinner --> Error : "Connection failed"
}
state QR_EXPIRED {
[*] --> AlertDisplayed
AlertDisplayed --> QRReady : "Worker restarted"
}
```

**Diagram sources**
- [apps/worker/src/bot.ts](file://apps/worker/src/bot.ts#L79-L109)
- [apps/worker/src/bot.ts](file://apps/worker/src/bot.ts#L111-L167)
- [apps/worker/src/bot.ts](file://apps/worker/src/bot.ts#L204-L251)
- [apps/worker/src/utils/reconnect.ts](file://apps/worker/src/utils/reconnect.ts#L87-L115)

### State-Specific Behavior and UI Indicators
Each state now has specific behavior, user interface indicators, and error reporting:

- **DISCONNECTED**: Worker is offline, heartbeat stopped, reconnect process initiated, error logged with DISCONNECTED alert code
- **QR_READY**: QR code available for scanning, portal displays QR with countdown, 65-second expiry timer active, QR refreshes automatically
- **CONNECTING**: Connection in progress, portal shows loading spinner and connecting badge, QR expiry timer cancelled on successful scan
- **CONNECTED**: Active connection, portal shows success state with auto-redirect, QR expiry timer cancelled, heartbeat active
- **QR_EXPIRED**: QR code expired without being scanned, admin panel shows prominent alert, requires worker restart for new QR

**Updated** Added QR_EXPIRED state with comprehensive QR expiration detection and error reporting.

**Section sources**
- [apps/worker/src/bot.ts](file://apps/worker/src/bot.ts#L79-L109)
- [apps/worker/src/bot.ts](file://apps/worker/src/bot.ts#L111-L167)
- [apps/worker/src/bot.ts](file://apps/worker/src/bot.ts#L204-L251)
- [apps/web/src/app/(portal)/app/whatsapp/page.tsx](file://apps/web/src/app/(portal)/app/whatsapp/page.tsx#L124-L163)
- [apps/control-plane/src/views/tenant-detail.ejs](file://apps/control-plane/src/views/tenant-detail.ejs#L155-L163)
- [apps/worker/src/utils/reconnect.ts](file://apps/worker/src/utils/reconnect.ts#L14-L117)

## Dependency Analysis
External libraries and runtime dependencies:
- whatsapp-web.js: Core WhatsApp client with enhanced event handling
- qrcode: QR data URL generation with automatic QR regeneration
- puppeteer/chromium: Headless browser automation
- dotenv: Environment configuration
- pino/pino-pretty/pino/file: Structured logging with enhanced error reporting
- prisma/@prisma/client: Database access with comprehensive state tracking

```mermaid
graph TB
Worker["apps/worker/src/worker.ts"] --> WWeb["whatsapp-web.js"]
Worker --> Qr["qrcode"]
Worker --> Dot["dotenv"]
Bot["apps/worker/src/bot.ts"] --> WWeb
Bot --> Qr
Bot --> Prisma["@prisma/client"]
Bot --> Shared["@flowhq/shared"]
Shared --> Pino["pino + transports"]
```

**Diagram sources**
- [apps/worker/package.json](file://apps/worker/package.json#L9-L14)
- [apps/worker/src/worker.ts](file://apps/worker/src/worker.ts#L1-L10)
- [apps/worker/src/bot.ts](file://apps/worker/src/bot.ts#L1-L11)
- [packages/shared/src/utils/logger.ts](file://packages/shared/src/utils/logger.ts#L1-L33)

**Section sources**
- [apps/worker/package.json](file://apps/worker/package.json#L1-L22)
- [apps/worker/src/worker.ts](file://apps/worker/src/worker.ts#L1-L10)
- [apps/worker/src/bot.ts](file://apps/worker/src/bot.ts#L1-L11)
- [packages/shared/src/utils/logger.ts](file://packages/shared/src/utils/logger.ts#L1-L33)

## Performance Considerations
- Per-chat queueing prevents race conditions and ensures ordered processing per conversation.
- De-duplication avoids redundant processing of identical messages.
- Rate limiting controls outbound reply frequency to prevent throttling.
- Heartbeat keeps the worker alive and monitored with configurable intervals.
- Exponential backoff reduces load during reconnection storms.
- Enhanced state management reduces unnecessary reconnection attempts.
- QR expiration detection prevents resource waste from expired QR codes.
- Group message filtering reduces processing overhead by ignoring group messages.

## Troubleshooting Guide

### Enhanced State-Specific Troubleshooting with QR Expiration
Common issues and resolutions with state-specific guidance and QR expiration scenarios:

#### QR State Issues
- **QR code not displaying or refreshing**
  - Verify QR endpoint returns data and state transitions to QR_READY.
  - Ensure the worker is running and connected to the database.
  - Confirm the portal route forwards internal key and user email headers.
  - Check that QR data URL is properly generated and stored.
  - Monitor QR expiry timer and restart worker if QR_EXPIRED appears.

- **QR code shows but won't scan**
  - Verify QR code refreshes automatically every 3 seconds.
  - Ensure portal displays countdown timer for QR refresh.
  - Check that QR data URL is valid and not corrupted.
  - Confirm QR expiry timer is active (65 seconds) and resets on new QR.

- **QR code expires frequently**
  - Check network connectivity and user device performance.
  - Verify QR expiry timer is resetting on each new QR event.
  - Monitor admin panel for QR_EXPIRED alerts and worker restarts.
  - Ensure user has sufficient time to scan QR before expiration.

#### Connecting State Issues
- **Connection stuck in CONNECTING state**
  - Verify Chrome/Chromium installation and executable path configured.
  - Check that Puppeteer can access the browser binary.
  - Monitor reconnection attempts and logs for authentication failures.
  - Look for auth_failure events indicating permanent connection issues.
  - Check QR expiry timer cancellation on successful QR scan.

#### Connected State Issues
- **Connection drops to DISCONNECTED frequently**
  - Monitor heartbeat logs for connection stability.
  - Check network connectivity and firewall settings.
  - Verify session persistence is working correctly.
  - Review reconnection logs for patterns.
  - Look for DISCONNECTED alert codes in admin panel.

- **Messages not being processed**
  - Check chat queue status for blocked messages.
  - Verify rate limiter configuration allows sufficient replies.
  - Ensure template configuration is properly loaded.
  - Monitor deduplication cache for message processing issues.
  - Verify group message filtering is not blocking legitimate messages.

- **Group messages not responding**
  - Confirm group message filtering is working correctly.
  - Verify messages from @g.us are being filtered out.
  - Check that 1-on-1 messages are still being processed.
  - Review message handling logs for group message detection.

#### QR_EXPIRED State Issues
- **Worker shows QR_EXPIRED status**
  - Check QR expiry timer configuration (65 seconds).
  - Verify QR events are triggering timer resets.
  - Confirm QR data URL generation is successful.
  - Restart worker to generate new QR code.
  - Monitor admin panel for QR_EXPIRED alerts.

- **Frequent QR_EXPIRED errors**
  - Check user device performance and network connectivity.
  - Verify QR refresh mechanism is working correctly.
  - Monitor QR expiry timer behavior and resets.
  - Ensure sufficient time for user to scan QR before expiration.

#### Error State Issues
- **Worker shows ERROR status with BAN_SIGNAL**
  - Check auth_failure logs for authentication problems.
  - Verify tenant configuration is correct.
  - Review database connection status.
  - Check for exceeded rate limits or queue capacity issues.
  - Confirm number may be banned by WhatsApp and requires SIM verification.

- **Worker shows ERROR status with DISCONNECTED**
  - Check disconnection reasons and reconnection attempts.
  - Verify network connectivity and firewall settings.
  - Monitor reconnection logs for patterns.
  - Review admin panel for DISCONNECTED alert codes.

**Updated** Added QR_EXPIRED state troubleshooting, QR expiration scenarios, and enhanced error reporting guidance.

**Section sources**
- [apps/web/src/app/api/portal/tenant/current/qr/route.ts](file://apps/web/src/app/api/portal/tenant/current/qr/route.ts#L15-L34)
- [apps/worker/src/bot.ts](file://apps/worker/src/bot.ts#L82-L92)
- [apps/worker/src/bot.ts](file://apps/worker/src/bot.ts#L115-L116)
- [apps/worker/src/bot.ts](file://apps/worker/src/bot.ts#L210-L251)
- [apps/control-plane/src/server.ts](file://apps/control-plane/src/server.ts#L34-L38)
- [apps/worker/src/utils/rate-limiter.ts](file://apps/worker/src/utils/rate-limiter.ts#L98-L105)
- [apps/worker/src/utils/chat-queue.ts](file://apps/worker/src/utils/chat-queue.ts#L38-L42)
- [apps/worker/src/worker.ts](file://apps/worker/src/worker.ts#L38-L45)
- [apps/control-plane/src/views/tenant-detail.ejs](file://apps/control-plane/src/views/tenant-detail.ejs#L141-L163)

## Conclusion
The integration leverages whatsapp-web.js with robust session management, persistent state tracking, QR expiration detection, and resilient message processing. The worker process maintains health via heartbeat and reconnect logic, while the portal provides real-time visibility into QR and connection status with comprehensive state indicators. Enhanced error reporting with alert codes (BAN_SIGNAL, DISCONNECTED, QR_EXPIRED) provides clear operational insights. By tuning environment variables and ensuring proper Chrome/Chromium configuration, the system achieves reliable automation for WhatsApp Web with enhanced state management, QR expiration handling, and user experience.

## Appendices

### Environment Variables and Configuration
- TENANT_ID: Required to start the worker.
- SESSIONS_PATH: Directory for LocalAuth session storage.
- RATE_LIMIT_MAX_PER_MINUTE: Outgoing reply limit per minute.
- HEARTBEAT_INTERVAL_MS: Interval for heartbeat updates.
- PUPPETEER_EXECUTABLE_PATH: Path to Chrome/Chromium binary (required in production).
- CONTROL_PLANE_URL and PORTAL_INTERNAL_KEY: Used by web routes to proxy requests to the control plane.
- QR_EXPIRATION_SECONDS: Configures QR expiry timer (default 65 seconds).

**Section sources**
- [apps/worker/src/worker.ts](file://apps/worker/src/worker.ts#L7-L8)
- [apps/worker/src/bot.ts](file://apps/worker/src/bot.ts#L33-L34)
- [apps/worker/src/bot.ts](file://apps/worker/src/bot.ts#L82-L92)
- [apps/control-plane/src/server.ts](file://apps/control-plane/src/server.ts#L17-L39)
- [apps/web/src/app/api/portal/tenant/current/qr/route.ts](file://apps/web/src/app/api/portal/tenant/current/qr/route.ts#L5-L6)

### Logging and Diagnostics
- Structured logging via pino with pretty output and optional per-tenant file transport.
- Logs are written under a logs directory relative to the project root.
- Enhanced state change logging for debugging connection issues.
- Comprehensive error logging for authentication failures with alert codes.
- QR expiration detection logs for troubleshooting QR-related issues.

**Section sources**
- [packages/shared/src/utils/logger.ts](file://packages/shared/src/utils/logger.ts#L5-L30)
- [apps/worker/src/bot.ts](file://apps/worker/src/bot.ts#L93-L95)
- [apps/worker/src/bot.ts](file://apps/worker/src/bot.ts#L210-L251)
- [apps/worker/src/bot.ts](file://apps/worker/src/bot.ts#L84-L92)

### Enhanced State Management Features
- Real-time state transitions with comprehensive logging
- Frontend state indicators with visual feedback
- Auto-refresh QR codes with countdown timers
- QR expiration detection with 65-second timeout
- Graceful error handling with state recovery
- Detailed troubleshooting information for each state
- Prominent admin alerts for critical error conditions (BAN_SIGNAL, QR_EXPIRED)
- Group message filtering for improved performance

**Section sources**
- [apps/web/src/app/(portal)/app/whatsapp/page.tsx](file://apps/web/src/app/(portal)/app/whatsapp/page.tsx#L81-L163)
- [apps/worker/src/bot.ts](file://apps/worker/src/bot.ts#L79-L109)
- [apps/worker/src/bot.ts](file://apps/worker/src/bot.ts#L169-L202)
- [apps/control-plane/src/routes/portal.ts](file://apps/control-plane/src/routes/portal.ts#L207-L231)
- [apps/control-plane/src/views/tenant-detail.ejs](file://apps/control-plane/src/views/tenant-detail.ejs#L141-L163)