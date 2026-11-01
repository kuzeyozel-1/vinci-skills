#!/usr/bin/env node
// Usage: node calibrate.mjs sources.json [--out dir]
import fs from "node:fs"; import path from "node:path";
const [file] = process.argv.slice(2).filter((a) => !a.startsWith("--"));
const oi = process.argv.indexOf("--out"); const out = oi > -1 ? process.argv[oi + 1] : "calibration";
if (!file) { console.error("Usage: calibrate.mjs sources.json [--out dir]"); process.exit(2); }
const data = JSON.parse(fs.readFileSync(file, "utf8")); const cur = data.currency ?? "";
const median = (a) => { const s = [...a].sort((x, y) => x - y), m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
const round = (n) => (n >= 1000 ? Math.round(n / 50) * 50 : Math.round(n));
const fmt = (n) => n.toLocaleString("en-US");
const prices = {}, rows = [], cites = new Map();
for (const it of data.items) {
  const v = it.sources.map((s) => s.price).filter((p) => Number.isFinite(p) && p > 0);
  if (!v.length) { console.error(`No valid prices for ${it.id}`); process.exit(1); }
  const min = Math.min(...v), max = Math.max(...v), med = median(v), spread = max / min;
  const confidence = v.length >= 3 && spread <= 3 ? "ok" : "low";
  prices[it.id] = { unit: it.unit, unitPrice: round(med), min, max, sources: v.length, confidence };
  rows.push(`| ${it.label ?? it.id} | ${it.unit} | ${v.length} | ${fmt(min)} | ${fmt(round(med))} | ${fmt(max)} | ${spread.toFixed(1)}× | ${confidence} |`);
  for (const s of it.sources) { const k = s.url ?? s.name; if (!cites.has(k)) cites.set(k, { name: s.name, url: s.url, date: s.date, notes: [] }); if (s.note) cites.get(k).notes.push(`${it.label ?? it.id}: ${s.note}`); }
}
fs.mkdirSync(out, { recursive: true });
fs.writeFileSync(path.join(out, "prices.json"), JSON.stringify({ currency: cur, calibratedAt: new Date().toISOString().slice(0, 10), prices }, null, 2));
fs.writeFileSync(path.join(out, "report.md"), `# Calibration report (${cur})\n\n| Item | Unit | Sources | Min | Median (used) | Max | Spread | Confidence |\n|---|---|---|---|---|---|---|---|\n${rows.join("\n")}\n\nConfidence \`low\` = fewer than 3 sources or max/min > 3×. Resolve before publishing.\n`);
fs.writeFileSync(path.join(out, "citations.md"), `# Sources\n\n${[...cites.values()].map((c) => `- ${c.name}${c.url ? ` — ${c.url}` : ""}${c.date ? ` (${c.date})` : ""}${c.notes.length ? `\n  - ${c.notes.join("\n  - ")}` : ""}`).join("\n")}\n`);
const low = Object.entries(prices).filter(([, p]) => p.confidence === "low").map(([k]) => k);
console.log(`✓ ${data.items.length} items → ${out}/ (prices.json, report.md, citations.md)`);
if (low.length) { console.log(`⚠ low confidence: ${low.join(", ")}`); process.exit(3); }
