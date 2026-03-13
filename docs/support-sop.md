# Flow HQ — Support SOP (Standard Operating Procedures)

> **Audience:** You (the operator). Use this when something breaks or a client reports an issue.
> **Server:** `72.62.114.219` — SSH as `baamrecs`
> **Control plane:** `http://72.62.114.219:3100`
> **Admin dashboard:** `http://72.62.114.219:3100/admin/tenants`

---

## Quick Reference: Common Commands

```bash
pm2 list                          # See all running processes + status
pm2 logs flowhq-control-plane     # Live control-plane logs
pm2 logs <worker-name>            # Live worker logs (e.g. worker-1773130326077)
pm2 restart flowhq-control-plane  # Restart control plane
pm2 restart <worker-name>         # Restart a specific worker
curl http://localhost:3100/health  # Health check (DB + workers)
```

---

## Incident 1: Bot Not Responding to Client Messages

**Symptoms:** Client says "the bot stopped replying"

**Step 1 — Check worker status**
```bash
pm2 list
```
Look for the client's worker process. Status should be `online`. If it's `stopped`, `errored`, or missing:

**Step 2 — Restart the worker**
```bash
pm2 restart <worker-name>
# Wait 30 seconds, then check logs
pm2 logs <worker-name> --lines 50
```

**Step 3 — Check WhatsApp session**
Go to Admin → Tenants → find the client → check "Worker Status".
If status is `QR_PENDING` or `DISCONNECTED`, the WhatsApp session has expired.
→ See **Incident 2** below.

**Step 4 — If worker keeps crashing**
```bash
pm2 logs <worker-name> --lines 100
```
Look for:
- `ECONNREFUSED` or database errors → check DB is running
- `Session expired` or `Authentication failure` → client needs to re-scan QR
- `Out of memory` → worker hit 400MB limit; check for runaway loops, restart is fine

**Client message template:**
> "Habari [Name], tulirekebisha tatizo kwenye bot yako. Tafadhali jaribu tena sasa. Ukipata tatizo lingine, niambie mara moja."

---

## Incident 2: WhatsApp Disconnected / Client Needs to Re-Scan QR

**Symptoms:** Bot stopped, worker shows `QR_PENDING`, or client says "I logged out of WhatsApp"

**Step 1 — Restart the worker to generate a fresh QR**
From Admin dashboard: Tenants → [Client] → "Restart Worker"
Or via SSH:
```bash
pm2 restart <worker-name>
```

**Step 2 — Send client the QR link**
```
http://72.62.114.219:3100/portal/qr
```
The client logs in with their email and scans the QR code shown.

**Step 3 — Confirm connection**
After scanning, worker status should change to `ACTIVE` within ~60 seconds.
Check via Admin dashboard or:
```bash
pm2 logs <worker-name> --lines 20
# Should see: "WhatsApp client ready" or "Client authenticated"
```

**Client message template:**
> "Habari [Name], WhatsApp yako imekatika. Tafadhali bonyeza kiungo hiki ufungue portal na uchanganye QR code upya: [LINK]. Inahitaji dakika 1 tu."

---

## Incident 3: Client Can't Log In to Portal

**Symptoms:** Client says "I can't access the portal" or "login not working"

**Step 1 — Confirm their email**
Ask which email they registered with. Only Google login is supported.

**Step 2 — Check if user + tenant exists**
```bash
psql -U baamrecs flowhq -c "SELECT id, email FROM \"User\" WHERE email = 'client@email.com';"
psql -U baamrecs flowhq -c "SELECT id, status, subscription_status FROM \"Tenant\" WHERE user_id = '<user-id>';"
```

**Step 3 — Common causes**
| Problem | Fix |
|---------|-----|
| User not in DB | They never completed signup — walk them through portal.flowhq.co/auth/signin |
| Tenant status = PAUSED | Subscription expired — renew and unpause via Admin |
| Google OAuth error | Check GOOGLE_CLIENT_ID / SECRET in `apps/web/.env.local`, restart if changed |

**Step 4 — Force clear their session (if stuck)**
```bash
psql -U baamrecs flowhq -c "DELETE FROM \"Session\" WHERE \"userId\" = '<user-id>';"
```
Then ask client to try logging in again.

---

## Incident 4: Control Plane Down (Admin Dashboard Unreachable)

**Symptoms:** `http://72.62.114.219:3100` returns nothing / connection refused

**Step 1 — Check PM2**
```bash
pm2 list
pm2 logs flowhq-control-plane --lines 50
```

**Step 2 — Restart**
```bash
pm2 restart flowhq-control-plane
# Wait 10 seconds
curl http://localhost:3100/health
```

**Step 3 — If it won't start (build/crash loop)**
```bash
pm2 logs flowhq-control-plane --lines 100
# Look for: missing env vars, DB connection refused, port already in use
```

Check for port conflicts:
```bash
lsof -i :3100
```
If another process owns 3100, kill it or change PORT in ecosystem.config.js.

**Step 4 — Full redeploy if code issue**
```bash
cd /var/www/flowhq
bash scripts/deploy.sh
```

---

## Incident 5: All Bots Stopped (Mass Outage)

**Symptoms:** Multiple clients reporting bots not responding at the same time

**Step 1 — Check health endpoint**
```bash
curl http://localhost:3100/health | jq
```
If `"database": { "status": "error" }` → database is down (see Step 2).
If `"workers"` shows errors but database is ok → workers crashed (see Step 3).

**Step 2 — If database is down**
```bash
sudo systemctl status postgresql
sudo systemctl start postgresql
```
Once DB is up, control plane reconnects automatically. Workers may need a restart.

**Step 3 — Bulk restart all workers**
```bash
pm2 restart all
```
Or restart specific workers by listing them first with `pm2 list`.

**Step 4 — Monitor recovery**
```bash
watch -n 5 "curl -s http://localhost:3100/health | jq '.checks'"
```

**Client broadcast message (Swahili):**
> "Wateja wetu wapendwa, tulikuwa na tatizo la kiufundi kwa muda mfupi (HH:MM - HH:MM). Tatizo limesuluhiwa na bot zenu zinafanya kazi tena. Tunaeomba msamaha kwa usumbufu."

---

## Routine Operations

### Daily Checklist
- [ ] Check BetterStack — any alerts overnight?
- [ ] `pm2 list` — all processes online?
- [ ] `curl http://localhost:3100/health` — status ok?
- [ ] Check `/var/www/flowhq/logs/backup.log` — last backup succeeded?

### Deploy New Code
```bash
cd /var/www/flowhq
bash scripts/deploy.sh
```

### View Logs
```bash
# Control plane (all)
pm2 logs flowhq-control-plane

# Specific worker
pm2 logs worker-XXXX

# Last 100 lines, no streaming
pm2 logs flowhq-control-plane --lines 100 --nostream

# Raw log files
tail -f /var/www/flowhq/logs/control-plane-error.log
```

### Restart Everything (maintenance)
```bash
pm2 restart all
pm2 save
```

### Manual DB Backup (outside scheduled time)
```bash
bash /var/www/flowhq/scripts/backup.sh
ls -lh /var/www/flowhq/backups/
```

---

## Setting Up the Daily Backup Cron (One-Time Setup on Server)

SSH into the server, then:
```bash
crontab -e
```
Add this line:
```
0 2 * * * /var/www/flowhq/scripts/backup.sh >> /var/www/flowhq/logs/backup.log 2>&1
```
Save and exit. Verify:
```bash
crontab -l
```

Ensure the script is executable:
```bash
chmod +x /var/www/flowhq/scripts/backup.sh
```

---

## Escalation

If you've tried the above and the issue persists:
1. Check full error logs: `pm2 logs <process> --lines 200`
2. Note the exact error message and timestamp
3. Check if any recent deploy coincides with the start of the issue: `git log --oneline -10`
4. If data may be at risk, restore from backup immediately before doing anything else

### Restore from Backup
```bash
# List available backups
ls -lh /var/www/flowhq/backups/

# Restore (WARNING: this overwrites current data)
gunzip -c /var/www/flowhq/backups/flowhq-backup-YYYY-MM-DD.sql.gz | psql -U baamrecs flowhq
```
