#!/usr/bin/env node
// Zero-dependency publishing gate for bilingual posts. Usage: node check.mjs <folder> [--profile blog|news] [--config file.json]
import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";

const args = process.argv.slice(2);
const flag = (n) => { const i = args.indexOf(n); return i > -1 ? args[i + 1] : undefined; };
const dirArg = args.find((a, i) => !a.startsWith("--") && args[i - 1] !== "--profile" && args[i - 1] !== "--config");
if (!dirArg) { console.error("Usage: check.mjs <folder> [--profile blog|news] [--config file.json]"); process.exit(2); }
const dir = resolve(dirArg);
const user = flag("--config") ? JSON.parse(readFileSync(resolve(flag("--config")), "utf8")) : {};

const DEFAULTS = {
  siteHosts: [], enPrefix: "/en", servicePathPattern: "^/(en/)?(services|hizmetler)\\b",
  profiles: {
    blog: { words: [900, 2200], h2: [5, 12], internal: [3, 8], external: [1, 4], boldMax: 14, faq: [4, 6] },
    news: { words: [150, 650], h2: [2, 6], internal: [1, 3], external: [1, 4], boldMax: 8, faq: null },
  },
  banned: { en: ["world-class", "cutting-edge", "industry-leading", "guaranteed #1"], tr: ["sektör lideri", "garantili 1. sıra", "dünya standartlarında"] },
};
const cfg = { ...DEFAULTS, ...user, profiles: { ...DEFAULTS.profiles, ...(user.profiles ?? {}) }, banned: { ...DEFAULTS.banned, ...(user.banned ?? {}) } };
const profileName = flag("--profile") ?? "blog";
const P = cfg.profiles[profileName];
if (!P) { console.error(`Unknown profile: ${profileName}`); process.exit(2); }

const plain = (h) => h.replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();
const wc = (s) => s.split(/\s+/).filter(Boolean).length;
const low = (s, l) => s.toLocaleLowerCase(l === "tr" ? "tr" : "en");
const FAQ_H = /sık sorulan|sss|merak edilen|frequently asked|faq/i;
const WEAK = /^(here|click here|read more|link|this link|buraya|tıklayın|tıklayınız|devamı|devamını oku|incele)$/i;
const REL_DATE = /\b(yesterday|last week|this week|last month|recently|today|tomorrow|dün|geçen hafta|bu hafta|geçen ay|bugün|yarın|yakında)\b/i;
const hostRe = (h) => new RegExp(`^https?://(www\\.)?${h.replace(/\./g, "\\.")}`, "i");
const isInternal = (href) => (href.startsWith("/") && !href.startsWith("//")) || cfg.siteHosts.some((h) => hostRe(h).test(href));
const toPath = (href) => { let p = href; for (const h of cfg.siteHosts) p = p.replace(hostRe(h), ""); return p || "/"; };

function audit(g) {
  const out = []; const add = (code, level, msg) => out.push({ code, level, msg });
  const text = plain(g.html), words = wc(text), L = g.locale;
  const tl = g.title.trim().length;
  if (tl > 70) add("title_long", "error", `Title is ${tl} chars; max 70 (ideal ≤ 60).`);
  else if (tl > 60) add("title_long_ideal", "warning", `Title is ${tl} chars; ≤ 60 avoids truncation.`);
  if (tl < 25) add("title_short", "warning", `Title is ${tl} chars; at least 25.`);
  const meta = (g.meta ?? "").trim();
  if (!meta) add("meta_missing", "error", "Meta description missing.");
  else if (meta.length > 160) add("meta_long", "error", `Meta is ${meta.length} chars; max 160.`);
  else if (meta.length < 100) add("meta_short", "warning", `Meta is ${meta.length} chars; 100–160 is ideal.`);
  if (g.slug !== undefined && !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(g.slug)) add("slug_invalid", "error", "Slug must be lowercase letters, digits and hyphens only.");

  const heads = [...g.html.matchAll(/<h([1-6])\b[^>]*>([\s\S]*?)<\/h\1>/gi)].map((m) => ({ d: +m[1], t: plain(m[2]), raw: m[2] }));
  if (heads.some((h) => h.d === 1)) add("h1_in_body", "error", "Body contains <h1>; the page template renders the title. Start sections at H2.");
  const h2 = heads.filter((h) => h.d === 2);
  if (h2.length < P.h2[0]) add("h2_few", "warning", `${h2.length} H2; at least ${P.h2[0]}.`);
  if (h2.length > P.h2[1]) add("h2_many", "warning", `${h2.length} H2; at most ${P.h2[1]}.`);
  const seen = new Set(); for (const h of h2) { const k = low(h.t, L); if (seen.has(k)) { add("h2_duplicate", "warning", `Duplicate H2: "${h.t}".`); break; } seen.add(k); }
  let sawH2 = false; for (const h of heads) { if (h.d === 2) sawH2 = true; if (h.d === 3 && !sawH2) { add("heading_skip", "error", `H3 "${h.t}" appears before any H2.`); break; } }
  if (profileName === "blog" && heads.filter((h) => /\?\s*$/.test(h.t)).length < 2) add("question_headings", "warning", "At least 2 headings should be phrased as questions.");
  if (P.faq) {
    const i = heads.findIndex((h) => h.d === 2 && FAQ_H.test(h.t));
    const n = i < 0 ? 0 : heads.slice(i + 1).filter((h) => h.d === 4).length;
    if (i < 0) add("faq_missing", "error", 'FAQ section missing (H2 "FAQ" + each question as H4, answer in <p>).');
    else if (n < P.faq[0] || n > P.faq[1]) add("faq_count", "warning", `FAQ has ${n} questions; expected ${P.faq[0]}–${P.faq[1]}.`);
  }

  const paras = [...g.html.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/gi)].map((m) => m[1]);
  const first = paras[0] ? wc(plain(paras[0])) : 0;
  if (first < 20 || first > 90) add("first_paragraph", "warning", `First paragraph is ${first} words; answer the topic in 20–90.`);
  if (paras.some((p) => wc(plain(p)) > 130)) add("long_paragraph", "warning", "A paragraph exceeds 130 words; split it.");
  if (words < 100) add("too_thin", "error", `${words} words; content is too thin.`);
  else if (words < P.words[0] || words > P.words[1]) add("words_out_of_range", "warning", `${words} words; ${profileName} expects ${P.words[0]}–${P.words[1]}.`);

  const bolds = [...g.html.matchAll(/<(strong|b)\b[^>]*>([\s\S]*?)<\/\1>/gi)].map((m) => plain(m[2])).filter(Boolean);
  const limit = Math.min(P.boldMax, Math.max(2, Math.ceil((words / 1000) * 10)));
  if (bolds.length > limit) add("bold_many", "warning", `${bolds.length} bold phrases; at most ${limit} at this length.`);
  if (bolds.some((b) => wc(b) > 8)) add("bold_long", "warning", "A bold phrase is longer than 8 words.");
  if (heads.some((h) => /<(strong|b)\b/i.test(h.raw))) add("bold_in_heading", "error", "Bold inside a heading.");
  for (const p of paras) { const bw = [...p.matchAll(/<(strong|b)\b[^>]*>([\s\S]*?)<\/\1>/gi)].reduce((t, m) => t + wc(plain(m[2])), 0); if (wc(plain(p)) >= 8 && bw / wc(plain(p)) > 0.6) { add("bold_whole_paragraph", "error", "Most of a paragraph is bold."); break; } }

  const links = [...g.html.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi)].map((m) => ({ href: /href=["']([^"']+)["']/i.exec(m[1])?.[1] ?? "", rel: /rel=["']([^"']+)["']/i.exec(m[1])?.[1] ?? "", text: plain(m[2]) }));
  const inn = links.filter((l) => isInternal(l.href)), ext = links.filter((l) => /^https?:\/\//i.test(l.href) && !isInternal(l.href));
  if (inn.length < P.internal[0]) add("internal_few", "warning", `${inn.length} internal links; at least ${P.internal[0]}.`);
  if (inn.length > P.internal[1]) add("internal_many", "warning", `${inn.length} internal links; at most ${P.internal[1]}.`);
  const targets = inn.map((l) => toPath(l.href).split("#")[0].replace(/\/$/, "") || "/");
  if (new Set(targets).size < targets.length) add("internal_duplicate", "warning", "Same page linked more than once.");
  if (profileName === "blog" && inn.length && !targets.some((t) => new RegExp(cfg.servicePathPattern).test(t))) add("no_service_link", "warning", "No internal link points to a service page.");
  const isEnPath = (p) => p === cfg.enPrefix || p.startsWith(cfg.enPrefix + "/");
  if (inn.some((l) => (L === "en") !== isEnPath(toPath(l.href)))) add("locale_link", "error", L === "en" ? `EN content links to a path without ${cfg.enPrefix}.` : `Default-language content links to ${cfg.enPrefix}.`);
  if (links.some((l) => WEAK.test(l.text) || l.text.length < 3)) add("bad_link_text", "error", 'Link text must be descriptive ("click here" is banned).');
  if (ext.length < P.external[0]) add("external_few", "warning", `${ext.length} external links; at least ${P.external[0]} (primary/official source).`);
  if (ext.length > P.external[1]) add("external_many", "warning", `${ext.length} external links; at most ${P.external[1]}.`);
  if (ext.some((l) => !/noopener/i.test(l.rel))) add("external_rel", "error", 'External links need rel="noopener noreferrer".');
  if (profileName === "news" && g.sourceUrl && !links.some((l) => l.href.replace(/\/$/, "") === g.sourceUrl.replace(/\/$/, ""))) add("source_not_linked", "error", "Primary source URL is not linked in the body.");

  const banned = (cfg.banned[L] ?? []).find((x) => low(text + " " + g.title, L).includes(low(x, L)));
  if (banned) add("banned_phrase", "error", `Banned phrase: "${banned}".`);
  if (/<\s*(script|iframe|object|embed)\b/i.test(g.html) || /<[^>]+\son\w+\s*=/i.test(g.html)) add("script_embed", "error", "Script/iframe/event handler in content.");
  if ([...g.html.matchAll(/<img\b[^>]*>/gi)].some((m) => !/alt=["'][^"']+["']/i.test(m[0]))) add("img_alt", "error", "Image without alt text.");
  if (profileName === "news" && REL_DATE.test(text)) add("relative_date", "warning", "Relative date found; write absolute dates.");

  if (g.keyword) {
    const k = low(g.keyword, L);
    if (!low(g.title, L).includes(k)) add("keyword_title", "warning", "Keyword not in title.");
    if (!low(meta, L).includes(k)) add("keyword_meta", "warning", "Keyword not in meta.");
    if (!low(text.split(/\s+/).slice(0, 100).join(" "), L).includes(k)) add("keyword_first100", "warning", "Keyword not in first 100 words.");
    if (!h2.some((h) => low(h.t, L).includes(k))) add("keyword_h2", "warning", "Keyword not in any H2.");
    const density = ((low(text, L).split(k).length - 1) * wc(k) * 100) / Math.max(1, words);
    if (density > 2.5) add("keyword_stuffing", "warning", `Keyword density ${density.toFixed(1)}% (max 2.5%).`);
  }
  return out;
}
const score = (r) => Math.max(0, 100 - r.filter((x) => x.level === "error").length * 15 - r.filter((x) => x.level === "warning").length * 4);

const spec = JSON.parse(readFileSync(join(dir, "notes.json"), "utf8"));
let errors = 0; const html = {};
for (const n of spec.notes) {
  const content = readFileSync(join(dir, n.file), "utf8"); html[n.locale] = content;
  const r = audit({ html: content, locale: n.locale, title: n.title, slug: n.slug, meta: n.meta, sourceUrl: n.sourceUrl, keyword: n.keyword });
  const e = r.filter((x) => x.level === "error").length; errors += e;
  console.log(`\n== ${n.locale}/${n.slug} (${profileName})  score ${score(r)}  ${e ? "✗ ERRORS" : "✓ no errors"}`);
  for (const x of r) console.log(`   ${x.level === "error" ? "ERROR  " : "warning"} ${x.code}: ${x.msg}`);
}
const locales = Object.keys(html);
if (locales.length === 2) {
  const [a, b] = [html[locales[0]], html[locales[1]]], n = (h, re) => (h.match(re) ?? []).length;
  const diffs = [];
  if (Math.abs(n(a, /<h2\b/gi) - n(b, /<h2\b/gi)) > 1) diffs.push("H2 counts differ");
  if (n(a, /<a\b/gi) !== n(b, /<a\b/gi)) diffs.push("link counts differ");
  if (n(a, /<h4\b/gi) !== n(b, /<h4\b/gi)) diffs.push("FAQ question counts differ");
  const w1 = wc(plain(a)), w2 = wc(plain(b)); if (w1 && (w2 / w1 > 1.6 || w2 / w1 < 0.6)) diffs.push("lengths differ a lot (translation truncated?)");
  console.log(`\n== ${locales.join(" ↔ ")} parity: ${diffs.length ? "" : "✓ parallel"}`); diffs.forEach((d) => console.log(`   warning parity: ${d}`));
}
console.log(errors ? `\n${errors} error(s); fix before publishing.` : "\nNo errors; ready to publish.");
process.exit(errors ? 1 : 0);
