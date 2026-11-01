#!/usr/bin/env node
// Branded carousel renderer: spec.json -> PNG slides + PDF + caption. Usage: node render.mjs <spec.json> <outDir>
import fs from "node:fs"; import os from "node:os"; import path from "node:path"; import { execFileSync } from "node:child_process";

const [specPath, outDir] = process.argv.slice(2);
if (!specPath || !outDir) { console.error("Usage: render.mjs <spec.json> <outDir>"); process.exit(2); }

function findChrome() {
  const c = [process.env.CHROME_PATH, "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/Applications/Chromium.app/Contents/MacOS/Chromium", "/usr/bin/google-chrome", "/usr/bin/google-chrome-stable", "/usr/bin/chromium", "/usr/bin/chromium-browser", "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe", "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe"].filter(Boolean);
  const hit = c.find((p) => fs.existsSync(p));
  if (!hit) { console.error("Chrome/Chromium not found. Set CHROME_PATH."); process.exit(2); }
  return hit;
}
const CHROME = findChrome();
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const dot = (s, accent) => esc(s).replace(/\.$/, `<span style="color:${accent}">.</span>`);

const spec = JSON.parse(fs.readFileSync(specPath, "utf8"));
const lang = spec.lang ?? "en";
const B = { name: "BRAND", sub: "", accent: "#F28123", bg: "#050814", label: "NOTES", url: "example.com", font: "Montserrat", ...(spec.brand ?? {}) };
const T = { en: { swipe: "SWIPE", full: "Read the full article", source: "Source" }, tr: { swipe: "KAYDIR", full: "Tam yazı", source: "Kaynak" } }[lang] ?? { swipe: "SWIPE", full: "Read more", source: "Source" };
const MAX_BODY = 230, MAX_TITLE = 48;
if (!spec.slides?.length || spec.slides.length > 8) { console.error("Provide 1–8 content slides."); process.exit(1); }
for (const s of spec.slides) {
  if (s.body.length > MAX_BODY) { console.error(`Body over ${MAX_BODY} chars (${s.body.length}): "${s.title}"`); process.exit(1); }
  if (s.title.length > MAX_TITLE) { console.error(`Title over ${MAX_TITLE} chars: "${s.title}"`); process.exit(1); }
}
const total = spec.slides.length + 2, A = B.accent;
const css = `*{margin:0;padding:0;box-sizing:border-box}@page{size:1080px 1350px;margin:0}
body{background:${B.bg};font-family:'${B.font}',Helvetica,Arial,sans-serif;color:#fff}
.s{width:1080px;height:1350px;position:relative;overflow:hidden;background:radial-gradient(120% 70% at 50% 0%,#14234d 0%,${B.bg} 60%,#000 100%);page-break-after:always}
.s:last-child{page-break-after:auto}
.brand{position:absolute;top:64px;right:72px;font-weight:800;font-size:30px;letter-spacing:.02em}.brand i{font-style:normal;font-weight:500;opacity:.75}
.pg{position:absolute;top:70px;left:72px;font-weight:800;font-size:24px;letter-spacing:.16em;color:${A}}
.foot{position:absolute;left:72px;right:72px;bottom:64px;display:flex;justify-content:space-between;font-size:24px;font-weight:500;color:rgba(255,255,255,.6)}
.bg{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}.shade{position:absolute;left:0;right:0;bottom:0;height:62%;background:linear-gradient(to top,rgba(0,0,0,.92),rgba(0,0,0,0))}
.glow{position:absolute;left:50%;top:34%;width:900px;height:900px;transform:translate(-50%,-50%);background:radial-gradient(circle,${A}38,${A}00 62%)}
.cv{position:absolute;left:72px;right:72px;bottom:150px}.tag{color:${A};font-weight:800;font-size:28px;letter-spacing:.16em;margin-bottom:28px}
.title{font-weight:800;font-size:${spec.title.length > 40 ? 92 : 112}px;line-height:1.04;letter-spacing:-.02em}
.swipe{position:absolute;right:72px;bottom:64px;font-weight:800;font-size:24px;letter-spacing:.2em;color:${A}}
.c{position:absolute;left:72px;right:72px;top:170px;bottom:170px;display:flex;flex-direction:column;justify-content:center}
.rule{width:120px;height:8px;background:${A};border-radius:4px;margin-bottom:36px}.h{font-weight:800;font-size:84px;line-height:1.05;letter-spacing:-.02em}
.p{margin-top:56px;font-weight:500;font-size:56px;line-height:1.38;color:rgba(255,255,255,.92)}
.end{position:absolute;left:72px;right:72px;top:170px;bottom:170px;display:flex;flex-direction:column;justify-content:center}
.end .n{font-weight:800;font-size:44px;letter-spacing:.14em;color:${A}}.end .t{margin-top:36px;font-weight:800;font-size:92px;line-height:1.05}.end .u{margin-top:44px;font-weight:700;font-size:40px;color:${A}}.end .k{margin-top:70px;font-size:30px;color:rgba(255,255,255,.65)}`;
const brand = `<div class="brand">${esc(B.name)} <i>${esc(B.sub)}</i></div>`;
const pg = (i) => `<div class="pg">${String(i).padStart(2, "0")} / ${String(total).padStart(2, "0")}</div>`;
const scene = spec.scene ? `<img class="bg" src="file://${path.resolve(spec.scene)}"><div class="shade"></div>` : `<div class="glow"></div>`;
const cover = `<div class="s">${scene}${brand}<div class="cv"><div class="tag">${esc(spec.category ?? "")}</div><div class="title">${dot(spec.title, A)}</div></div><div class="swipe">${T.swipe} →</div></div>`;
const body = spec.slides.map((s, i) => `<div class="s">${pg(i + 2)}${brand}<div class="c"><div class="rule"></div><div class="h">${dot(s.title, A)}</div><div class="p">${esc(s.body)}</div></div><div class="foot"><span>${esc(B.label)}</span><span>${esc(spec.date ?? "")}</span></div></div>`);
const closing = `<div class="s">${pg(total)}${brand}<div class="end"><div class="n">${esc(B.label)}</div><div class="t">${dot(T.full + ".", A)}</div><div class="u">${esc(B.url)}</div><div class="k">${spec.source ? `${T.source}: ${esc(spec.source)} · ` : ""}${esc(spec.date ?? "")}</div></div></div>`;
const slides = [cover, ...body, closing];
const page = (inner) => `<!doctype html><html lang="${lang}"><head><meta charset="utf-8"><link href="https://fonts.googleapis.com/css2?family=${encodeURIComponent(B.font)}:wght@500;700;800&display=swap" rel="stylesheet"><style>${css}</style></head><body>${inner}</body></html>`;

fs.mkdirSync(outDir, { recursive: true });
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "carousel-")), base = `${spec.id ?? "carousel"}-${lang}`;
const shot = (html, out) => { const f = path.join(tmp, "s.html"); fs.writeFileSync(f, html); execFileSync(CHROME, ["--headless=new", "--disable-gpu", "--no-sandbox", "--hide-scrollbars", "--force-device-scale-factor=1", "--window-size=1080,1350", "--virtual-time-budget=8000", `--screenshot=${out}`, "file://" + f], { stdio: "ignore" }); };
slides.forEach((s, i) => shot(page(s), path.join(outDir, `${base}-${String(i + 1).padStart(2, "0")}.png`)));
const all = path.join(tmp, "all.html"); fs.writeFileSync(all, page(slides.join("")));
execFileSync(CHROME, ["--headless=new", "--disable-gpu", "--no-sandbox", "--no-pdf-header-footer", "--virtual-time-budget=8000", `--print-to-pdf=${path.join(outDir, base + ".pdf")}`, "file://" + all], { stdio: "ignore" });
fs.writeFileSync(path.join(outDir, `caption-${lang}.txt`), `${spec.caption ?? ""}\n\n${B.url}\n\n${(spec.hashtags ?? []).map((t) => "#" + t).join(" ")}\n`);
console.log(`✓ ${slides.length} slides + PDF + caption → ${outDir}`);
