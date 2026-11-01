#!/usr/bin/env node
// Minimal Markdown -> PDF via headless Chrome. Usage: node md-to-pdf.mjs <in.md> <out.pdf>
import fs from "node:fs"; import os from "node:os"; import path from "node:path"; import { execFileSync } from "node:child_process";
const [inp, out] = process.argv.slice(2);
if (!inp || !out) { console.error("Usage: md-to-pdf.mjs <in.md> <out.pdf>"); process.exit(2); }
const chrome = [process.env.CHROME_PATH, "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/usr/bin/google-chrome", "/usr/bin/chromium", "/usr/bin/chromium-browser", "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"].filter(Boolean).find((p) => fs.existsSync(p));
if (!chrome) { console.error("Chrome not found. Set CHROME_PATH."); process.exit(2); }
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const inline = (s) => esc(s).replace(/`([^`]+)`/g, "<code>$1</code>").replace(/\*\*([^*]+)\*\*/g, "<b>$1</b>").replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
const lines = fs.readFileSync(inp, "utf8").split("\n"); let html = "", list = null, para = [], code = false, table = [];
const flush = () => { if (para.length) { html += `<p>${inline(para.join(" "))}</p>`; para = []; } };
const endList = () => { if (list) { html += `</${list}>`; list = null; } };
const endTable = () => { if (table.length) { const rows = table.filter((r) => !/^\s*\|?\s*:?-{2,}/.test(r)).map((r) => r.replace(/^\||\|$/g, "").split("|").map((c) => inline(c.trim()))); html += "<table>" + rows.map((r, i) => `<tr>${r.map((c) => `<${i ? "td" : "th"}>${c}</${i ? "td" : "th"}>`).join("")}</tr>`).join("") + "</table>"; table = []; } };
for (const ln of lines) {
  if (ln.startsWith("```")) { flush(); endList(); endTable(); html += code ? "</pre>" : "<pre>"; code = !code; continue; }
  if (code) { html += esc(ln) + "\n"; continue; }
  if (/^\s*\|/.test(ln)) { flush(); endList(); table.push(ln); continue; } else endTable();
  const h = /^(#{1,4})\s+(.*)/.exec(ln); if (h) { flush(); endList(); html += `<h${h[1].length}>${inline(h[2])}</h${h[1].length}>`; continue; }
  const li = /^\s*([-*]|\d+\.)\s+(.*)/.exec(ln); if (li) { flush(); const t = /\d/.test(li[1]) ? "ol" : "ul"; if (list !== t) { endList(); html += `<${t}>`; list = t; } html += `<li>${inline(li[2])}</li>`; continue; }
  if (!ln.trim()) { flush(); endList(); continue; } para.push(ln.trim());
}
flush(); endList(); endTable();
const page = `<!doctype html><html><head><meta charset="utf-8"><style>@page{margin:22mm 18mm}body{font-family:Helvetica,Arial,sans-serif;color:#1a1a1a;line-height:1.55;font-size:11pt}h1{font-size:24pt;margin:0 0 12pt}h2{font-size:15pt;margin:20pt 0 6pt;border-bottom:1px solid #ddd;padding-bottom:3pt}h3{font-size:12pt}code{background:#f2f2f2;padding:1px 4px;border-radius:3px;font-size:9.5pt}pre{background:#f6f6f6;padding:10pt;border-radius:4px;font-size:9pt;white-space:pre-wrap}table{border-collapse:collapse;width:100%;margin:8pt 0}th,td{border:1px solid #ddd;padding:5pt 8pt;text-align:left;font-size:10pt}th{background:#f6f6f6}a{color:#c2570a}</style></head><body>${html}</body></html>`;
const tmp = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "md2pdf-")), "d.html"); fs.writeFileSync(tmp, page);
execFileSync(chrome, ["--headless=new", "--disable-gpu", "--no-sandbox", "--no-pdf-header-footer", `--print-to-pdf=${path.resolve(out)}`, "file://" + tmp], { stdio: "ignore" });
console.log("✓", out);
