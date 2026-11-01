---
name: ssr-animation-lcp-diagnosis
description: Diagnose and fix slow or unstable Largest Contentful Paint caused by entrance animations (Framer Motion initial/whileInView, opacity-0 hero text, hydration-gated content). Scans server-rendered HTML for elements shipped invisible, explains the LCP≈TTI signature, and gives the CSS-only replacement. Use when the user says "LCP is high", "hero takes long to appear", "PageSpeed score fluctuates", "Framer Motion hurts performance", "LCP düşmüyor", or after adding animation to above-the-fold content.
---

# SSR animation → LCP diagnosis

## The failure mode

Animation libraries that set `initial={{ opacity: 0 }}` write **`opacity:0` into the server-rendered HTML**. The browser can paint the element only after React hydrates and runs the animation. Consequences:

1. Chrome does not count opacity-animated elements as painted until the animation settles → LCP delayed even on a fast server.
2. On a cold server (serverless cold start) hydration is late, so LCP jumps from ~2.5 s to 7 s+.
3. **Signature:** LCP ≈ TTI (e.g. 7.18 s vs 7.20 s) — the content waited for JavaScript.

Lab scores vary ±20 points run to run; never judge from a single run. Use the median of 3–5 runs with a cache-busting query (`?x=<random>`).

## Step 1 — scan

```bash
node scripts/scan.mjs https://example.com/          # live URL
node scripts/scan.mjs ./page.html                   # saved HTML
node scripts/scan.mjs https://example.com/ --psi    # also runs PageSpeed (needs GOOGLE_PSI_KEY)
```

Reports elements in the first 40 KB of body that ship hidden (`opacity:0`, `visibility:hidden`, `transform:translate…` with opacity), the likely LCP candidate (largest text/h1/img near the top) and whether the candidate is hidden.

## Step 2 — fix

Rule: **nothing above the fold gets a JS entrance animation.** Below-the-fold sections may use `whileInView`.

- Make the headline (LCP candidate) static: no `initial`, no wrapper that is `opacity:0` in SSR.
- For above-the-fold polish use a pure CSS animation (runs on first paint, no JS):

```css
@keyframes rise { from { opacity: 0; transform: translateY(12px) } to { opacity: 1; transform: none } }
.hero-rise { animation: rise .6s cubic-bezier(.16,1,.3,1) both; animation-delay: var(--d, 0s) }
@media (prefers-reduced-motion: reduce) { .hero-rise { animation: none } }
```

  Keep the LCP element itself free of even this if the score still lags (use `opacity` ≥ 0.01 start or no animation).
- Hero images: `priority`/`fetchpriority="high"`, no `loading="lazy"`. Inline images inside the H1 must not be lazy either.

## Step 3 — verify

Re-run scan (hidden count should be 0 above the fold), then PageSpeed ×5 mobile; compare medians. Record the date and number of runs next to any score you publish.
