---
name: sourced-price-calibration
description: Calibrate unit prices for a public estimator/calculator from published market prices instead of copying one competitor. Collect prices with source URL and date, compute median/range/spread per item, flag low-confidence items, and emit a config file plus a citation list to show on the page. Use when the user says "price calculator", "fiyat hesaplayıcı", "calibrate prices", "market price research", "kaynaklı fiyat", or wants defensible numbers for a quote tool or blog table.
---

# Sourced price calibration

Goal: every unit price on a public calculator can be traced to at least three published sources, with the date the page was read. Never anchor on a single competitor and never publish your own quote as if it were "the market".

## Method

1. **Define the items** you need (e.g. `exterior_image`, `floor_plan`, `video_per_10s`) and their unit.
2. **Collect ≥ 3 sources per item** — price lists, calculators, published quotes. Record `name`, `url`, `date` (page date or access date), `price`, and any scope note ("includes 2 revisions"). Normalise to the same unit and currency. Skip sources that bundle items in a way you cannot split.
3. Write them into a `sources.json` (see `examples/sources.json`).
4. Run:
   ```bash
   node scripts/calibrate.mjs sources.json --out calibration/
   ```
   It writes `calibration/prices.json` (median per item, used as the calculator's unit price), `calibration/report.md` (table with min/median/max/spread and confidence) and `calibration/citations.md` (list to render on the page).
5. **Confidence flags:** fewer than 3 sources, or max/min > 3×, marks the item `low`. Resolve by finding more sources or splitting the item; do not hide the flag.
6. Multipliers (project size, complexity) that are your own estimate must be labelled as such on the page.

## Publishing rules

- Show the source list and access dates under the calculator; update it whenever a number changes.
- State whether amounts include VAT; keep it consistent with the sources.
- Do not present a calculator result as an offer: "estimate based on published market prices".
- Re-run the calibration at least quarterly or when two sources move.
