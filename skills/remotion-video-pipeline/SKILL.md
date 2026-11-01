---
name: remotion-video-pipeline
description: Produce short promo videos (vertical 9:16 reels, 16:9 web spots) from raw phone/camera footage with Remotion, including proxy generation, contact sheets for choosing clips, brand theming, and the render pitfalls that waste hours (Turkish uppercase, ffmpeg stdin, HEVC output, missing drawtext). Use when the user says "make a promo video", "reel from this footage", "Remotion", "tanıtım videosu", "kısa video render", or needs code-driven text/branding over real footage.
---

# Remotion video pipeline

Real footage + code-drawn typography = on-brand videos with no typos and repeatable edits.

## Pipeline

1. **Inventory** raw clips: `scripts/inventory.sh <raw-dir> > index.tsv` (id, path, duration, resolution).
2. **Proxies**: `scripts/make-proxies.sh index.tsv proxy/` creates 1080-wide, 30 fps, all-intra-ish H.264 (`-g 15`) copies with audio removed. Edit and render against proxies; 4K/HEVC originals make Remotion seek slowly and can crash Chrome.
3. **Choose moments by looking, not guessing**: `scripts/contact-sheet.sh proxy/v01.mp4 sheets/v01.jpg` prints one frame per second in a grid. Open the sheet and note start seconds per cut.
4. **Compose** in `template/` (copy it): `Footage` (trimmed, zoomed clip), `Scrim` (gradient for legible text), `Line` (animated text). One composition per output (e.g. `Main` 30 s, `Teaser` 9 s, `Spot16x9` 20 s).
5. **Render**: `npx remotion render <CompositionId> out/<name>.mp4`. Config already sets H.264, CRF 17, yuv420p.
6. **Verify**: extract 3 stills (`ffmpeg -ss 5 -i out.mp4 -frames:v 1 still.png`) and look at them; check duration and that audio policy (silent or music) is what the client expects.

## Pitfalls (each cost real time)

- Set `lang="tr"` (or the right language) on the root; otherwise CSS `text-transform: uppercase` turns Turkish `i` into `I` (MAKINASI, TEKLIF). Prefer typing the final case in the string.
- `ffmpeg` inside `while read` loops swallows stdin: always pass `-nostdin`.
- zsh splits differently from bash: `set -- $p` and `$2:s` break. Write scripts with `#!/usr/bin/env bash`.
- Many ffmpeg builds have **no `drawtext`**. Draw text in Remotion, never in ffmpeg.
- HTML-based renderers (e.g. Hyperframes) may leave "dim" overlay layers visible between scenes; also fade scenes with explicit opacity animation. Run those renders in the **foreground** (background `nohup` runs get cancelled) and convert HEVC output with `ffmpeg -i in.mp4 -c:v libx264 -crf 18 -pix_fmt yuv420p out.mp4`.
- Phone footage rotation: check `ffprobe` rotation tags; portrait clips in a landscape composition need `objectFit: cover` plus explicit crop.
- Only claim what the footage shows. Do not invent specs, capacities, or prices in on-screen text.
- Keep client files out of the repo you publish; footage and logos belong to the client.

See `references/checklist.md` for the delivery checklist.
