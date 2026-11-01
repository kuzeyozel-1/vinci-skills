# Production wiring

## Cron route (Next.js / any serverless)

```ts
// app/api/cron/payment-reminder/route.ts
import { findDue, render, send } from "@/lib/payment-reminder/lib";  // copy scripts/lib.mjs
export async function GET(req: Request) {
  if (req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) return new Response("unauthorized", { status: 401 }); // fail closed
  const due = findDue(await loadPayments());
  if (!due.length) return Response.json({ ok: true, sent: false });
  await send(render(due));
  return Response.json({ ok: true, sent: true, count: due.length });
}
```

Fail **closed** when `CRON_SECRET` is missing in production, otherwise anyone can trigger mail.

Schedule (UTC!) — 08:30 in UTC+3 is `30 5 * * *` in `vercel.json` `crons`.

## Mark-paid endpoint

`GET /api/paid?id=…&period=…&t=…` → `verifyToken(id, period, t)`; if valid, update storage and show a confirmation page. Make the GET page only *confirm* and do the write on POST if mail scanners prefetch links in your environment.

## Resend

Verify a sending **subdomain** (DKIM + SPF + MX records it gives you), keep DMARC at `p=none` for a few weeks while watching reports, then tighten. Free tier is enough for a daily digest.
