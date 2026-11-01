import { createHmac, timingSafeEqual } from "node:crypto";

const REMIND_BEFORE = 3;
export const isReminderDay = (diff) => diff === REMIND_BEFORE || diff === 0 || (diff < 0 && diff >= -30 && (diff === -1 || diff % 3 === 0));
export const todayIn = (tz = "Europe/Istanbul") => process.env.TODAY ?? new Intl.DateTimeFormat("en-CA", { timeZone: tz }).format(new Date());
const dayNum = (iso) => Math.floor(new Date(`${iso}T00:00:00Z`).getTime() / 86_400_000);
const prevMonth = (p) => { const [y, m] = p.split("-").map(Number); return m === 1 ? `${y - 1}-12` : `${y}-${String(m - 1).padStart(2, "0")}`; };

/** Returns unpaid periods that fall on a reminder day, most overdue first. */
export function findDue(items, today = todayIn()) {
  const month = today.slice(0, 7), out = [];
  for (const it of items.filter((i) => i.active !== false)) {
    const periods = it.repeat === "monthly"
      ? [prevMonth(month), month].filter((p) => !(it.paidPeriods ?? []).includes(p)).map((p) => ({ period: p, due: `${p}-${String(it.day).padStart(2, "0")}` }))
      : it.paid || !it.dueDate ? [] : [{ period: "once", due: it.dueDate }];
    for (const p of periods) { const diff = dayNum(p.due) - dayNum(today); if (isReminderDay(diff)) out.push({ item: it, period: p.period, due: p.due, diff }); }
  }
  return out.sort((a, b) => a.diff - b.diff);
}

export function sign(id, period, secret = process.env.PAYMENT_LINK_SECRET) {
  if (!secret) throw new Error("PAYMENT_LINK_SECRET is not set");
  return createHmac("sha256", secret).update(`payment:${id}:${period}`).digest("hex").slice(0, 32);
}
export function verifyToken(id, period, token, secret) {
  const a = Buffer.from(sign(id, period, secret)), b = Buffer.from(String(token));
  return a.length === b.length && timingSafeEqual(a, b);
}
const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const when = (d) => (d < 0 ? `${-d} days overdue` : d === 0 ? "due today" : `${d} days left`);

export function render(due, baseUrl = process.env.PAYMENT_BASE_URL ?? "https://example.com") {
  const rows = due.map((d) => {
    const color = d.diff < 0 ? "#B42318" : d.diff === 0 ? "#B54708" : "#344054";
    const link = `${baseUrl}/api/paid?id=${encodeURIComponent(d.item.id)}&period=${encodeURIComponent(d.period)}&t=${sign(d.item.id, d.period)}`;
    return `<tr><td style="padding:12px 0;border-bottom:1px solid #eee;font:15px Arial,sans-serif;color:#1f1f1f"><b>${esc(d.item.name)}</b>${d.item.amount ? ` · ${esc(d.item.amount)}` : ""}<br><span style="color:${color};font-size:13px">Due ${d.due} · ${when(d.diff)}</span>${d.item.note ? `<br><span style="color:#667085;font-size:13px">${esc(d.item.note)}</span>` : ""}<br><a href="${link}" style="font-size:13px">Mark as paid</a>${d.item.url ? ` · <a href="${esc(d.item.url)}" style="font-size:13px">Payment page</a>` : ""}</td></tr>`;
  }).join("");
  const overdue = due.filter((d) => d.diff < 0).length;
  const subject = `${overdue ? "⚠ " : ""}Payment reminder: ${due.length} unpaid${overdue ? ` (${overdue} overdue)` : ""} — ${due[0].item.name}${due.length > 1 ? ` +${due.length - 1}` : ""}`;
  return { subject, html: `<!doctype html><html><body style="margin:0;background:#f6f6f6"><table width="100%"><tr><td align="center" style="padding:24px 12px"><table width="560" style="max-width:560px;width:100%;background:#fff;border-radius:12px"><tr><td style="padding:24px 28px 8px;font:700 20px Arial,sans-serif">Unpaid items (${due.length})</td></tr><tr><td style="padding:0 28px 24px"><table width="100%">${rows}</table></td></tr></table></td></tr></table></body></html>` };
}

export async function send({ subject, html }, today = todayIn()) {
  const { RESEND_API_KEY: key, PAYMENT_FROM: from, PAYMENT_TO: to } = process.env;
  if (!key || !from || !to) throw new Error("Set RESEND_API_KEY, PAYMENT_FROM and PAYMENT_TO");
  const res = await fetch("https://api.resend.com/emails", { method: "POST", headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json", "Idempotency-Key": `payment-${today}` }, body: JSON.stringify({ from, to: [to], subject, html }) });
  if (!res.ok) throw new Error(`Resend ${res.status}: ${await res.text()}`);
}
