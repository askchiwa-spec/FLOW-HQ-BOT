# Chatisha Client Onboarding Guide
### For the Onboarding Team — Internal Use Only

---

## Overview

Onboarding a new Chatisha client takes **15–30 minutes** from account creation to a live, working WhatsApp bot. The process has two sides:

- **Client side** — creates their account and submits their setup details
- **Admin side (you)** — reviews the request, configures the bot, starts the worker, and guides the client through QR scanning

---

## What You Need Before Starting

Collect this from the client before onboarding:

| Item | Example | Notes |
|------|---------|-------|
| Business name | Nuru Beauty Salon | As they want it in the bot |
| WhatsApp number | +255712345678 | Must be active, not already linked to WhatsApp Web |
| Business type | Salon / Restaurant / Hotel / Healthcare / Shop / Support / Real Estate / Booking | Determines bot behaviour |
| Language | Swahili or English | Bot replies in this language |
| Knowledge base document | Menu PDF, price list, services list | Optional but strongly recommended |
| Client email address | owner@nurubeauty.com | Used to create their portal account |
| Payment confirmed | 200,000 TZS setup fee | Do not onboard until payment is received |

> **Important:** The client's WhatsApp number must be **removed from any existing linked devices** before scanning the Chatisha QR. Ask them to check: WhatsApp → Linked Devices → remove any existing web sessions.

---

## Step 1 — Client Creates Their Account

Send the client this link: **https://app.chatisha.com/auth/signin**

They will see the sign-in page with two options:

**Option A — Google sign-in (recommended, fastest):**
- Click **"Continue with Google"**
- Select their Google account
- They are automatically signed in and redirected to the setup form

**Option B — Email/password:**
- Click **"Create an account"**
- Enter their email and choose a password (minimum 8 characters)
- Sign in with those credentials

> **Screenshot to capture:** The sign-in page at `app.chatisha.com/auth/signin`

---

## Step 2 — Client Completes the Setup Form

After signing in, the client is taken to: **https://app.chatisha.com/app/onboarding**

They fill in four fields:

### 2a. Business Name
Type their business name exactly as they want customers to see it in bot messages.
- Example: `Nuru Beauty Salon` ✓
- Not: `nuru` or `NURU BEAUTY` ✗

### 2b. What Do You Need? (Template Type)
Select the tile that matches their business:

| Tile | Best for |
|------|---------|
| Salon & Beauty | Hair salons, barbershops, spas, nail salons |
| Restaurant | Restaurants, cafés, food delivery, catering |
| Hotel & Lodge | Hotels, guesthouses, lodges, serviced apartments |
| Clinic & Healthcare | Clinics, dentists, pharmacies, hospitals |
| Shop & E-Commerce | Retail shops, online stores, phone shops |
| General Support | Customer service, FAQ bots, helpdesks |
| Real Estate | Property agents, landlords, property managers |
| Booking | Any other appointment-based service |

> **Tip:** If unsure, ask the client: "Do you mainly take bookings, sell products, or answer customer questions?"

### 2c. WhatsApp Number
Enter the business WhatsApp number in international format.
- Example: `+255712345678` ✓
- Not: `0712345678` or `712345678` ✗

Supported countries include Tanzania (+255), Kenya (+254), Uganda (+256), Rwanda (+250), and others. The field validates automatically — a red error means the number format is wrong.

### 2d. Response Language
- **Swahili** — bot replies in Swahili (recommended for Tanzanian clients)
- **English** — bot replies in English

### Submit
Client clicks **"Submit Setup Request"**. They are taken to their status page showing:

> *"Request submitted! Our team is reviewing your setup. You'll receive a notification once approved."*

> **Screenshot to capture:** The completed onboarding form and the status page after submission

---

## Step 3 — Admin Reviews the Setup Request

Go to the admin panel: **https://admin.chatisha.com/admin/tenants**

You will see the new client listed with status **REVIEWING** or **SUBMITTED**.

Click on the client's name to open their detail page. Verify:
- [ ] Business name looks correct
- [ ] Template type matches their business
- [ ] WhatsApp number is in correct format (+255...)
- [ ] Language is set correctly
- [ ] Payment has been received

If everything is correct, click **"Approve"**.

> **If something is wrong:** Contact the client to correct it before approving. You can also edit the details directly in the admin panel before approving.

> **Screenshot to capture:** The tenant detail page in admin with the Approve button visible

---

## Step 4 — Upload the Knowledge Base (Recommended)

A knowledge base makes the bot significantly smarter — it can answer specific questions about prices, services, menu items, opening hours, and location instead of giving generic responses.

In the admin panel, on the tenant's detail page:

1. Scroll down to **"Knowledge Base / Documents"**
2. Click **"Upload Document"**
3. Upload a PDF, Word document, or text file containing:
   - Full menu or services list with prices
   - Opening hours
   - Location/address
   - Delivery/pickup information
   - Any FAQs the business frequently receives

**Good knowledge base example for a salon:**
```
NURU BEAUTY SALON

Services & Prices:
- Hair wash & blow dry: 15,000 TZS
- Relaxer treatment: 25,000–45,000 TZS
- Braids (box braids): 40,000–80,000 TZS
- Manicure: 10,000 TZS
- Pedicure: 15,000 TZS

Opening hours: Monday–Saturday 8:00am–7:00pm, Sunday 9:00am–4:00pm
Location: Masaki, Dar es Salaam, next to Shoprite
WhatsApp: +255712345678
```

> **Note:** The knowledge base can be uploaded or updated at any time, even after the bot is live. Restart the worker after updating for changes to take effect.

---

## Step 5 — Start the Worker

Still in the admin panel on the tenant's detail page:

1. Click **"Start Worker"**
2. Wait 30–60 seconds
3. The status changes from **APPROVED** → **QR_PENDING**
4. A QR code appears on the client's portal status page

> **If the worker doesn't start:** Click "Start Worker" again. If it still fails, check the worker logs in the admin panel for errors.

> **Screenshot to capture:** The admin panel showing the "Start Worker" button and then the QR_PENDING state

---

## Step 6 — Client Scans the QR Code

Call or message the client and guide them through this:

**On their phone:**
1. Open **WhatsApp**
2. Tap the three dots (⋮) top right → **"Linked Devices"**
3. Tap **"Link a Device"**
4. Point their camera at the QR code on their portal

**Where is the QR code?**
The client sees it at: **https://app.chatisha.com/app/status**

The QR code refreshes every ~20 seconds. If it expires before they scan, it refreshes automatically — just scan the new one.

> **Important:** Tell the client to keep WhatsApp open on their phone while scanning. The phone must be connected to the internet.

**After scanning:**
- Their phone shows **"Device linked"** ✓
- The portal status page changes from QR code → green **"Connected"** status
- The admin panel shows **Session: CONNECTED**

> This takes 30–90 seconds. If nothing happens after 2 minutes, click "Restart" in the admin panel and ask them to scan again.

> **Screenshot to capture:** The portal status page showing the QR code, then the Connected state after scanning

---

## Step 7 — Test the Bot

Before handing over to the client, **always test the bot yourself**:

1. Send a WhatsApp message to the client's business number from a different phone
2. Verify the bot responds within 10–15 seconds
3. Test at least these scenarios:
   - First message: "Hi" → bot should greet and offer options
   - Ask about a service/product → bot should answer from knowledge base
   - Ask for prices → bot should give accurate prices
   - Try to book an appointment (for SALON/HEALTHCARE) or place an order (for ECOMMERCE/RESTAURANT)

**What a good first response looks like:**

> *"Habari! Karibu kwa Nuru Beauty Salon! 🤝*
> *Niko hapa kukusaidia. Chagua mojawapo:*
> *1. Weka miadi*
> *2. Angalia huduma*
> *3. Bei*
> *4. Mahali tulipo*
> *5. Ongea na timu"*

**Red flags to watch for:**
- Bot sends "Thank you for your message. We will get back to you soon." → knowledge base not loaded or template not set correctly
- Bot responds in wrong language → check language setting in admin
- Bot gives wrong prices → update the knowledge base document
- No response at all → worker may have crashed, check admin panel

---

## Step 8 — Hand Over to Client

Once the bot is tested and working:

1. **Share their portal login:** `https://app.chatisha.com`
2. **Walk them through the portal:**
   - **Status page** — shows if bot is connected, last seen time
   - **Messages** — view all conversations
   - **Customers** — see who has messaged, CRM lead status
   - **Orders** (for Ecommerce/Restaurant) — track orders
3. **Explain what happens if the bot goes offline:**
   - They go to their portal → Status page → if it shows disconnected, they contact us
   - We restart the worker from the admin panel
4. **Billing:** Remind them the monthly fee is **80,000 TZS/month** and when their first payment is due

---

## Common Issues & How to Fix Them

| Problem | Likely Cause | Fix |
|---------|-------------|-----|
| QR code not appearing | Worker didn't start | Click "Restart" in admin panel |
| Client scanned but still shows QR | Chrome stall (known bug) | Wait 2 minutes — worker auto-restarts. Ask client to scan again |
| Bot replies twice to every message | Two workers running for same tenant | Stop worker, wait 30s, start again |
| Bot sends "Thank you, we'll get back to you" | Template not set / no knowledge base | Configure template and upload knowledge base, then restart worker |
| Bot replies in wrong language | Language set incorrectly | Change language in admin panel, restart worker |
| Client says their phone shows "linked" but bot doesn't respond | Stale session | Ask client to unlink from their phone, restart worker, scan fresh QR |
| "Session expired" after a few days | Normal — phone was offline/switched off | Client rescans QR from portal status page |

---

## Template Quick Reference

Use this to quickly decide which template to assign:

| Client says... | Template to use |
|---------------|----------------|
| "I have a salon / barbershop / spa" | SALON |
| "I have a restaurant / food delivery" | RESTAURANT |
| "I have a hotel / guesthouse / lodge" | HOTEL |
| "I'm a doctor / clinic / pharmacy / dentist" | HEALTHCARE |
| "I sell products / I have a shop" | ECOMMERCE |
| "I want customers to book appointments" | BOOKING |
| "I want to answer customer questions / FAQ" | SUPPORT |
| "I sell / rent properties" | REAL_ESTATE |

---

## Admin Panel Quick Reference

| URL | What it's for |
|-----|--------------|
| `admin.chatisha.com/admin/tenants` | View all clients, approve requests, start/stop workers |
| `admin.chatisha.com/admin/tenants/{id}` | Individual client details, QR status, message logs |
| `app.chatisha.com` | Client portal (what the client sees) |
| `app.chatisha.com/app/status` | Client's QR code and connection status |

---

## Onboarding Checklist

Use this for every new client:

- [ ] Payment received (200,000 TZS setup fee)
- [ ] Client info collected (business name, WhatsApp number, template, language)
- [ ] Client created account at `app.chatisha.com`
- [ ] Client submitted setup form
- [ ] Admin reviewed and approved setup request
- [ ] Knowledge base document uploaded
- [ ] Worker started — status shows QR_PENDING
- [ ] Client scanned QR — status shows CONNECTED
- [ ] Bot tested (sent "Hi", got correct greeting)
- [ ] Bot tested with specific question from knowledge base
- [ ] Client walked through portal
- [ ] Billing date noted and saved in admin panel
- [ ] Client has portal login and knows how to check status

---

*Last updated: April 2026 | Chatisha Internal Document*
