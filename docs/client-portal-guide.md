# Your Chatisha Portal Guide
### Everything you need to manage your WhatsApp bot

**Portal address:** https://app.chatisha.com

---

## Getting Started

Sign in at **https://app.chatisha.com/auth/signin** using the same Google account or email you used when signing up.

Once signed in, you will see your portal with a sidebar menu on the left. Each section is explained in this guide.

> 📸 **Screenshot:** Portal dashboard after sign-in — sidebar visible on the left, status card in the centre

---

## The Sidebar — Your Navigation Menu

The sidebar on the left gives you access to every feature. Here is what each item does:

| Menu Item | What it does |
|-----------|-------------|
| **Dashboard** | See if your bot is connected and working |
| **Knowledge Base** | Add your services, prices, and information for the bot |
| **WhatsApp** | Manage your WhatsApp connection |
| **Messages** | Read all conversations your bot has had |
| **Customers** | See everyone who has contacted your business |
| **Orders** | Track orders placed through your bot (Shop/Restaurant only) |
| **Handoffs** | Customers who asked to speak to a human |
| **Profile** | Update your account details |
| **Billing** | View your subscription status |

---

## 1. Dashboard

**URL:** https://app.chatisha.com/app/status

This is your home page. It shows you the most important thing: **is your bot online?**

> 📸 **Screenshot:** Dashboard showing green "Connected" status with last seen time

### What you will see:

**Green "Connected" status** — Your bot is working perfectly. Customers messaging your WhatsApp number are being answered automatically.

**QR Code displayed** — Your bot needs to be reconnected. Follow the steps shown on screen to scan the QR code with your phone. See the *WhatsApp* section below for detailed instructions.

**"Under Review" or "Pending"** — Our team is still setting up your bot. You will be notified when it is ready.

### What "Last Seen" means
This shows the last time your bot was active. If it shows more than a few hours ago and your bot is supposed to be online, contact our support team.

---

## 2. Knowledge Base

**URL:** https://app.chatisha.com/app/knowledge

> 📸 **Screenshot:** Knowledge Base page showing uploaded documents and the three upload options

This is the most important page for making your bot smart. The knowledge base is where you teach your bot about your business — your services, prices, menu, opening hours, location, and any frequently asked questions.

**The more information you add here, the better your bot will answer customer questions.**

### How to add your business information

You have three ways to add information:

---

#### Option A — Upload a File (PDF, Word, Excel)

Best for: existing menus, price lists, brochures, or service catalogs you already have saved on your computer.

1. Click **"Upload Document"**
2. Select your file (PDF, Word .docx, or Excel .xlsx)
3. Click Upload
4. Wait a few seconds — the file appears in your documents list

> 📸 **Screenshot:** Upload button and file selection

**Tips for a good document:**
- Include your business name at the top
- List every service or product with its price
- Include your opening hours
- Include your location/address
- Include your WhatsApp number

---

#### Option B — Add a Website URL

Best for: if your business already has a website with your services and prices listed.

1. Paste your website address into the URL field (e.g. `https://www.yourwebsite.com/menu`)
2. Click **"Import from URL"**
3. The bot reads your website and learns from it automatically

> 📸 **Screenshot:** URL input field with import button

---

#### Option C — Type Information Directly

Best for: quick updates, FAQs, or if you don't have a file or website.

1. Enter a label for the information (e.g. "Services & Prices")
2. Type or paste your information in the text box
3. Click **"Save"**

> 📸 **Screenshot:** Text input area with label field

**Example of what to type:**
```
SERVICES & PRICES

Hair wash & blow dry — 15,000 TZS
Box braids (medium) — 50,000 TZS
Relaxer treatment — 35,000 TZS
Manicure — 10,000 TZS

OPENING HOURS
Monday to Saturday: 8:00am – 7:00pm
Sunday: 9:00am – 4:00pm

LOCATION
Masaki, Dar es Salaam, next to Shoprite petrol station
```

---

### Managing your documents

Each document in your list has two buttons:
- **Edit** (pencil icon) — update the content
- **Delete** (trash icon) — remove it

> **Important:** After adding or changing any knowledge base information, your bot automatically uses the new information within a few minutes. No restart needed.

---

## 3. WhatsApp

**URL:** https://app.chatisha.com/app/whatsapp

> 📸 **Screenshot:** WhatsApp page showing connection status and QR code (if disconnected)

This page manages the connection between Chatisha and your WhatsApp number.

### If your bot is connected
You will see a green connected indicator. No action needed — everything is working.

### If you need to scan the QR code

This happens when:
- Your bot was set up for the first time
- Your phone was switched off or offline for several days
- You got a new phone

**Step-by-step to reconnect:**

**On your phone:**
1. Open **WhatsApp**
2. Tap the three dots (⋮) at the top right
3. Tap **"Linked Devices"**
4. Tap **"Link a Device"**
5. Point your camera at the QR code on this page

> 📸 **Screenshot:** WhatsApp phone screen showing "Linked Devices" menu

**After scanning:**
- Your phone will show "Device linked" ✓
- This page will change to show "Connected" within 1–2 minutes

> **Note:** The QR code refreshes every 20 seconds. If it changes while you are trying to scan, just scan the new one — they all work the same way.

> **If scanning doesn't work:** Make sure your phone has a good internet connection and WhatsApp is open (not minimised). Try again.

---

## 4. Messages

**URL:** https://app.chatisha.com/app/messages

> 📸 **Screenshot:** Messages page showing a list of conversations on the left and a chat view on the right

This is where you can read every conversation your bot has had with your customers.

### What you can do here:

**Browse conversations** — All customer conversations are listed on the left, sorted by most recent. Click any conversation to read it.

**Search by contact** — Use the search bar or the URL parameter `?contact=255712345678` to jump directly to a specific customer's conversation.

**Read the full conversation** — You can see exactly what the customer said and how the bot replied, message by message with timestamps.

### What you cannot do here:
This is a **read-only view**. You cannot send messages from the portal. To reply to a customer personally, open WhatsApp on your phone and message them directly from there.

> **Tip:** If a customer asks to speak to a human, they will appear in your **Handoffs** section (see below). Go there to take over the conversation.

---

## 5. Customers

**URL:** https://app.chatisha.com/app/customers

> 📸 **Screenshot:** Customers page showing stats cards at top and customer table below

This is your customer database — everyone who has ever sent a message to your bot.

### Stats cards at the top:
- **Total Customers** — all unique contacts who have messaged you
- **New** — customers who just messaged for the first time
- **Confirmed** — customers who completed a booking or order
- **Pending** — customers currently in conversation, haven't completed yet

### The customer table shows:
- Customer name (if collected by the bot)
- Phone number
- Lead status (New / Pending / Confirmed / Cancelled)
- First message date
- Last activity

### Filtering customers:

**By date:** Use the "From" and "To" date pickers to see customers from a specific period (e.g. this month only).

**By status:** Use the dropdown to filter by New, Pending, Confirmed, or Cancelled customers.

### Exporting to Excel:
Click **"Export CSV"** to download your full customer list as a spreadsheet. Useful for follow-ups, marketing, or keeping your own records.

> 📸 **Screenshot:** Export CSV button and date filter in use

---

## 6. Orders

**URL:** https://app.chatisha.com/app/orders

> 📸 **Screenshot:** Orders page showing stats and order table

*This section is available for Shop (E-Commerce) and Restaurant customers only.*

Every order placed through your bot appears here automatically. You don't need to do anything — the bot captures the order details and records them for you.

### Stats cards:
- **Total Orders** — all orders ever received
- **Active** — orders awaiting customer confirmation (customer has not replied YES or NO yet)
- **Confirmed** — customer replied YES, order is confirmed
- **Cancelled** — customer replied NO or order expired

### The order table shows:
- Customer name and phone number
- Order summary (what they ordered)
- Follow-up count (how many reminder messages were sent)
- Order status

### Order follow-up process (automatic):
When a customer places an order, the bot automatically:
1. Sends an order summary and asks them to reply YES to confirm or NO to cancel
2. Sends a reminder after 30 minutes if no reply
3. Sends another reminder after 3 hours
4. Sends a final reminder after 24 hours, then marks the order as expired

You do not need to manage this — it happens automatically.

### Clicking a row:
Click any order row to jump to that customer's conversation in the Messages page, so you can see the full order discussion.

---

## 7. Handoffs

**URL:** https://app.chatisha.com/app/handoffs

> 📸 **Screenshot:** Handoffs page showing list of customers requesting human assistance

A handoff happens when a customer says something like *"I want to speak to a person"*, *"connect me to a human"*, or sends a message the bot cannot handle. The bot tells them a human will assist them, and the customer appears here.

### What to do with a handoff:

1. See the customer's phone number and their last message
2. Open WhatsApp on your phone
3. Message that customer directly to assist them
4. Come back to this page and click **"Mark as Resolved"** once you have helped them

> 📸 **Screenshot:** Handoff entry with "Mark as Resolved" button

> **Important:** Handoffs need your personal attention. Check this page daily — customers who asked for human help are waiting for you to contact them.

### The handoff count:
The number in brackets next to "Handoffs" in the sidebar shows how many unresolved handoffs you have. Zero is good — it means all customers have been helped.

---

## 8. Profile

**URL:** https://app.chatisha.com/app/profile

> 📸 **Screenshot:** Profile page showing account details form

Update your personal account information here:
- Display name
- Email address
- Password (if you signed up with email, not Google)

This does not affect your bot or business settings — it only changes your portal login details.

---

## 9. Billing

**URL:** https://app.chatisha.com/app/billing

> 📸 **Screenshot:** Billing page showing subscription status and plan details

This page shows your subscription information:
- Your current plan status (Active / Paused)
- When you joined Chatisha
- Your monthly fee: **80,000 TZS/month**

### If your subscription is paused:
This means your monthly payment is overdue. Contact our team to renew — once payment is received, your bot will be reactivated within a few hours.

### Payment:
Currently, payments are made directly to our team (M-Pesa or bank transfer). You will receive payment reminders from us before your due date.

---

## Tips for Getting the Most from Your Bot

### Keep your Knowledge Base updated
Whenever your prices change, you add new services, or your hours change — update your Knowledge Base. An up-to-date knowledge base means the bot always gives customers accurate information.

### Check Handoffs every day
Customers who asked to speak to a human are waiting for you. Aim to respond to them within 2 hours during business hours.

### Monitor your Orders page (Shop/Restaurant)
Check your orders each morning. Active orders mean customers are waiting for confirmation — the bot follows up automatically, but you should also check in personally for large or unusual orders.

### Check your Dashboard connection status
If your bot is disconnected (showing a QR code instead of "Connected"), rescan the QR code as quickly as possible. Every minute your bot is offline is a customer who didn't get a response.

---

## When to Contact Chatisha Support

Contact us if:
- Your bot has been showing a QR code for more than 10 minutes and rescanning doesn't fix it
- Your bot is responding with generic messages instead of your actual prices/services
- A customer reported they sent a message but got no reply
- You want to change your template type (e.g. switching from Salon to Booking)
- Your subscription shows Paused and you have already paid

**WhatsApp support:** [Your support number here]
**Email:** [Your support email here]

---

## Quick Reference

| I want to... | Go to |
|-------------|-------|
| Check if my bot is working | Dashboard |
| Update my prices or menu | Knowledge Base |
| Reconnect my WhatsApp | WhatsApp |
| Read customer conversations | Messages |
| See all my customers | Customers |
| Download customer list | Customers → Export CSV |
| See orders placed today | Orders |
| Reply to a customer who asked for human help | Handoffs |
| Check my subscription | Billing |
| Change my password | Profile |

---

*Chatisha — Powered by AI, built for African businesses*
*For support: app.chatisha.com | April 2026*
