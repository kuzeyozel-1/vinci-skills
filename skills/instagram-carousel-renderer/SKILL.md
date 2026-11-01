---
name: instagram-carousel-renderer
description: Render a branded Instagram/LinkedIn carousel (1080x1350 PNG slides + one PDF + caption text) from a small JSON spec using headless Chrome, with all text drawn by code so there are no AI typos. Use when the user says "carousel", "Instagram slides", "LinkedIn document post", "make social slides from this article", "carousel oluştur", or wants a repeatable on-brand slide set.
---

# Instagram carousel renderer

Turns a JSON spec into a cover + N content slides + closing slide as PNGs (1080×1350, 4:5), a single multi-page PDF (LinkedIn document posts), and `caption-<lang>.txt`. Text is rendered by HTML/CSS, so Turkish `ı/İ`, accents and long words are always correct — image generators often corrupt them.

## Requirements
Node 18+ and Google Chrome / Chromium (auto-detected on macOS, Linux, Windows; override with `CHROME_PATH`). Network access is only needed for the web font (falls back to Helvetica/Arial).

## Run
```bash
node scripts/render.mjs examples/spec.json out/
```

## Spec

```json
{
  "id": "my-post", "lang": "en",
  "brand": { "name": "ACME", "sub": "STUDIO", "accent": "#F28123", "bg": "#050814", "label": "ACME NOTES", "url": "example.com/blog", "font": "Montserrat" },
  "category": "GUIDE", "title": "Five checks before you launch.",
  "scene": "optional/path/to/cover-background.png",
  "slides": [ { "title": "Short heading.", "body": "At most 230 characters of body text." } ],
  "source": "Optional source name", "date": "2 November 2026",
  "caption": "Caption text…", "hashtags": ["marketing", "web"]
}
```

Limits are enforced (title ≤ 48 chars, body ≤ 230 chars per slide, max 8 content slides) because longer text becomes unreadable at phone size. Trailing `.` in titles becomes an accent-colored dot.

## Rules that pay off
- Every slide: one idea. Cover = hook question or claim; last slide = where to read more.
- Instagram accepts JPEG only through its API; convert PNG → JPEG before upload (`sharp` or `sips`).
- Check the output visually (open 2–3 PNGs) before posting; Chrome headless prints fonts differently when offline.
- Never put a customer's logo or photo into a template without written permission.
