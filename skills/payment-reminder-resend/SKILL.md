---
name: payment-reminder-resend
description: Small-business payment reminder that emails you about unpaid recurring or one-off bills (hosting, domains, subscriptions, invoices) on a sparse schedule until you mark them paid via a signed one-click link. Includes the due-date logic, a Resend email sender, HMAC "mark as paid" tokens and a cron/serverless wiring guide. Use when the user says "payment reminder", "ödeme hatırlatıcı", "remind me of bills", "subscription due dates", or asks for a cron that emails overdue payments.
---

# Payment reminder (Resend)

Bank balances are not read. An item counts as **unpaid until someone marks it paid** — that is deliberate, it needs no bank API and survives declined cards.

## Schedule logic (`scripts/lib.mjs`)

For each active item and each period (this month and last month for recurring items):

| Days to due date | Reminder |
|---|---|
| +3 | yes (heads-up) |
| 0 | yes (due today) |
| −1 | yes (first overdue day) |
| −2…−30 | every 3rd day |
| older than 30 days overdue | stops (assumed handled) |

One digest email lists all items that hit a reminder day, subject prefixed with ⚠ when anything is overdue. `Idempotency-Key: payment-<date>` makes a re-run on the same day harmless.

## Data

`payments.json` (or a database collection; see `references/storage.md`):

```json
[ { "id": "hosting", "name": "Hosting", "amount": "20 USD", "repeat": "monthly", "day": 21, "paidPeriods": [], "url": "https://billing.example.com", "note": "card ending 0000", "active": true },
  { "id": "domain", "name": "Domain renewal", "repeat": "once", "dueDate": "2026-12-01", "paid": false } ]
```

## Run locally

```bash
export PAYMENT_LINK_SECRET=$(openssl rand -hex 32)   # signs the "mark paid" links
export RESEND_API_KEY=re_xxx PAYMENT_FROM="Reminders <reminders@mail.example.com>" PAYMENT_TO=you@example.com
export PAYMENT_BASE_URL=https://example.com           # where /api/paid is served
node scripts/remind.mjs examples/payments.json            # dry run: prints what would be sent
node scripts/remind.mjs examples/payments.json --send     # sends
TODAY=2026-11-20 node scripts/remind.mjs examples/payments.json   # simulate a date
```

## Production wiring

See `references/wiring.md`: a serverless cron route (08:30 local), a `GET /api/paid?id&period&t` endpoint that verifies the token with `verifyToken` and updates storage, and the Resend domain setup (use a **subdomain** for sending so mail reputation stays separate from your main domain; add SPF, DKIM, DMARC).

Never commit `PAYMENT_LINK_SECRET` or API keys.
