# Chatisha — Internal Team Flow Guide

---

## 1. Client Onboarding Flow

```
CLIENT                          SYSTEM                          YOU (ADMIN)
  │                               │                                │
  │  Goes to app.chatisha.com     │                                │
  │──────────────────────────────▶│                                │
  │                               │                                │
  │  Signs in with Google         │                                │
  │──────────────────────────────▶│                                │
  │                               │  Account + Tenant created      │
  │                               │  automatically                 │
  │                               │                                │
  │  Fills setup form:            │                                │
  │  - Business name              │                                │
  │  - WhatsApp number            │                                │
  │  - Template (Booking/Sales/   │                                │
  │    Support)                   │                                │
  │  - Language (SW/EN)           │                                │
  │──────────────────────────────▶│                                │
  │                               │  Setup request saved           │
  │                               │  Status: SUBMITTED             │
  │                               │───────────────────────────────▶│
  │                               │                                │ Reviews request
  │                               │                                │ at admin.chatisha.com
  │                               │                                │
  │                               │        Admin clicks APPROVE    │
  │                               │◀───────────────────────────────│
  │                               │                                │
  │                               │  Worker (bot) starts           │
  │                               │  Status: QR_PENDING            │
  │                               │                                │
  │  You send client the QR link  │                                │
  │◀──────────────────────────────────────────────────────────────│
  │                               │                                │
  │  Client scans QR code on      │                                │
  │  their WhatsApp               │                                │
  │──────────────────────────────▶│                                │
  │                               │  Status: ACTIVE                │
  │  Bot is live ✓                │                                │
  └───────────────────────────────┴────────────────────────────────┘
```

---

## 2. How the Bot Works (Daily)

```
CUSTOMER (end user)             BOT (WhatsApp)                  DATABASE
      │                              │                               │
      │  Sends WhatsApp message      │                               │
      │─────────────────────────────▶│                               │
      │                              │  Is it a status/broadcast?    │
      │                              │  → YES: ignore silently       │
      │                              │  → NO: continue               │
      │                              │                               │
      │                              │  Is it an exit keyword?       │
      │                              │  (stop, asante, bye, acha...) │
      │                              │  → YES: send goodbye, stop    │
      │                              │  → NO: continue               │
      │                              │                               │
      │                              │  Loads tenant config ────────▶│
      │                              │◀─────────────────────────────│
      │                              │                               │
      │                              │  Runs bot logic               │
      │                              │  (Booking / Sales / Support)  │
      │                              │                               │
      │  Receives reply              │                               │
      │◀─────────────────────────────│                               │
      └──────────────────────────────┴───────────────────────────────┘
```

---

## 3. System Architecture (Simple View)

```
INTERNET
    │
    ▼
 nginx (chatisha.com)
    │
    ├──▶ chatisha.com / www.chatisha.com
    │         └──▶ Next.js (port 3001) — Marketing site
    │
    ├──▶ app.chatisha.com
    │         └──▶ Next.js (port 3001) — Customer portal
    │
    └──▶ admin.chatisha.com
              └──▶ Control Plane (port 3100) — Admin dashboard + API

Control Plane
    ├── Manages PM2 workers (one per active client)
    ├── Handles portal API requests
    └── Reads/writes to Neon PostgreSQL (cloud DB)

PM2 Workers
    ├── worker-XXXXXXX (Client A bot)
    ├── worker-XXXXXXX (Client B bot)
    └── worker-XXXXXXX (Client C bot)
         └── Each connects to WhatsApp via whatsapp-web.js
```

---

## 4. Admin Dashboard Guide

**URL:** `https://admin.chatisha.com`
**Password:** stored in `.env` on VPS (`ADMIN_PASSWORD`)

| Section | What you do there |
|---------|------------------|
| `/admin/tenants` | See all clients, start/stop/restart their bots |
| `/admin/setup-requests` | Review and approve new client requests |
| `/admin/tenants/:id` | View a specific client — status, QR code, logs |
| `/health` | System health — DB + worker status |

---

## 5. New Client Checklist (Your Side)

```
□ Client signs up at app.chatisha.com
□ You receive setup request notification
□ Review: correct WhatsApp number? correct template?
□ Approve in admin dashboard
□ Wait ~30 seconds for bot to start
□ Send client their portal link: https://app.chatisha.com
□ Client scans QR code
□ Confirm bot status changes to ACTIVE
□ Send welcome message to client on WhatsApp
□ Collect 350,000 TZS setup fee
□ Set up monthly payment reminder (100,000 TZS/month)
```

---

## 6. Monthly Operations

```
WEEK 1
  □ Check all bots are ACTIVE (pm2 list)
  □ Review BetterStack for any overnight alerts
  □ Follow up on any QR_PENDING clients (need to re-scan)

WEEK 2
  □ Send payment reminders to clients due this month
  □ Check backup logs: /var/www/flowhq/logs/backup.log

WEEK 3
  □ Review any client complaints or bot issues
  □ Check error logs: pm2 logs flowhq-control-plane --lines 100

WEEK 4
  □ Collect monthly payments (100,000 TZS per client)
  □ Pause bots for non-paying clients via admin dashboard
  □ Plan for next month's client targets
```

---

## 7. Key Contacts & Links

| Resource | Link / Info |
|----------|-------------|
| Marketing site | https://chatisha.com |
| Client portal | https://app.chatisha.com |
| Admin dashboard | https://admin.chatisha.com |
| Health check | https://admin.chatisha.com/health |
| VPS server | 72.62.114.219 (SSH as root) |
| Support SOP | docs/support-sop.md |
| Database | Neon PostgreSQL (cloud) |
| Monitoring | BetterStack (email alerts) |
