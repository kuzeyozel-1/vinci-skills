---
name: bilingual-content-gate
description: Publishing gate for bilingual (e.g. TR/EN) blog posts and news notes. Runs a deterministic quality check (title/meta length, heading hierarchy, FAQ block, bold abuse, internal/external link rules, banned phrases, script/iframe, image alt, TR↔EN parity) on a folder of HTML files before anything is published. Use when the user says "publish gate", "content check", "pre-publish check", "yayın öncesi kontrol", "TR/EN parity check", or before pushing posts to a CMS/Firestore.
---

# Bilingual content gate

A zero-dependency Node script that audits a folder of HTML posts and exits with code 1 if any **error** is found. It never edits content and never talks to a database. Use it as the last step before a publish tool.

## Folder layout

```
my-batch/
  notes.json     # list of posts (see examples/notes.json)
  tr.html        # body HTML, no <h1> (page template renders the title)
  en.html
```

`notes.json`:

```json
{ "notes": [
  { "file": "tr.html", "locale": "tr", "slug": "ornek-yazi", "title": "…", "meta": "…", "sourceUrl": "https://… (news only)", "keyword": "primary keyword" },
  { "file": "en.html", "locale": "en", "slug": "sample-post", "title": "…", "meta": "…" }
] }
```

## Run

```bash
node scripts/check.mjs <folder> [--profile blog|news] [--config my-config.json]
```

- Profile is `blog` by default (900–2200 words, 5–12 H2, FAQ 4–6 questions) or `news` (150–650 words, 2–6 H2, source link required). Override anything in a config file; see `references/config.md`.
- Score = 100 − 15 per error − 4 per warning. **Do not publish below 100 errors-free; fix warnings unless you have a reason.**

## What it checks

See `references/rules.md` for the full list and the reasoning behind each threshold. Short version: answer-first first paragraph, no H1 inside body, FAQ as `<h2>` + `<h4>` questions, ≤ N bold phrases, descriptive link text, `rel="noopener"` on external links, locale-correct internal links (`/en/…` only in EN), no inline scripts/handlers, every image has alt, no relative dates in news ("yesterday"), keyword placement, TR↔EN structural parity.

## Workflow

1. Draft both language versions. 2. Run the gate. 3. Fix errors, then warnings. 4. Only then hand the folder to the publish step (CMS API, Firestore script, etc. — see `references/publish-template.md` for a Firestore Admin SDK template that writes drafts by default and links `alternateSlug` between languages).

Never put real API keys or customer data into `notes.json` or the config.
