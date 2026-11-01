#!/usr/bin/env node
// Usage: node scan.mjs <url|file.html> [--psi]
import fs from "node:fs";
const [target] = process.argv.slice(2).filter((a) => !a.startsWith("--"));
if (!target) { console.error("Usage: scan.mjs <url|file.html> [--psi]"); process.exit(2); }
const html = /^https?:\/\//.test(target) ? await (await fetch(target, { headers: { "User-Agent": "lcp-scan/1.0" } })).text() : fs.readFileSync(target, "utf8");
const bodyStart = html.search(/<body\b/i); const body = html.slice(bodyStart < 0 ? 0 : bodyStart, (bodyStart < 0 ? 0 : bodyStart) + 40_000);
const tags = [...body.matchAll(/<([a-z][a-z0-9]*)\b([^>]*)>/gi)];
const hidden = [];
tags.forEach((m, i) => {
  const style = /style=["']([^"']*)["']/i.exec(m[2])?.[1] ?? "";
  const why = [];
  if (/opacity\s*:\s*0(?![.\d])/.test(style)) why.push("opacity:0");
  if (/visibility\s*:\s*hidden/.test(style)) why.push("visibility:hidden");
  if (/transform\s*:[^;]*translate/.test(style) && /opacity/.test(style)) why.push("translate+opacity");
  if (why.length) hidden.push({ pos: m.index, tag: m[1], why: why.join(", "), snippet: m[0].slice(0, 110) });
});
const lcpRe = /<(h1|img|p|video)\b[^>]*>/i; const cand = lcpRe.exec(body);
console.log(`Scanned first ${body.length} bytes of <body>.`);
console.log(`Shipped-hidden elements: ${hidden.length}`);
for (const h of hidden.slice(0, 15)) console.log(`  @${h.pos} <${h.tag}> ${h.why}\n    ${h.snippet}`);
if (cand) { const hiddenCand = hidden.some((h) => Math.abs(h.pos - cand.index) < 400); console.log(`\nLikely LCP candidate: <${cand[1]}>  ${hiddenCand ? "⚠ shipped hidden (or inside a hidden wrapper) → LCP waits for hydration" : "visible in SSR HTML"}`); }
if (/framer-motion|data-framer|style="opacity:0;transform/.test(html)) console.log("Hint: Framer Motion signature found in SSR output.");
if (process.argv.includes("--psi")) {
  const key = process.env.GOOGLE_PSI_KEY; if (!key || !/^https?:/.test(target)) { console.log("\n--psi needs GOOGLE_PSI_KEY and a URL."); process.exit(0); }
  const r = []; for (let i = 0; i < 3; i++) { const u = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(target + (target.includes("?") ? "&" : "?") + "x=" + Math.random().toString(36).slice(2))}&strategy=mobile&category=performance&key=${key}`; const j = await (await fetch(u)).json(); const a = j.lighthouseResult?.audits; if (a) r.push({ lcp: a["largest-contentful-paint"].numericValue / 1000, tti: a.interactive.numericValue / 1000, score: j.lighthouseResult.categories.performance.score * 100 }); }
  r.forEach((x, i) => console.log(`run ${i + 1}: score ${x.score} LCP ${x.lcp.toFixed(1)}s TTI ${x.tti.toFixed(1)}s${Math.abs(x.lcp - x.tti) < 0.3 ? "  ← LCP≈TTI: waiting for JS" : ""}`));
}
