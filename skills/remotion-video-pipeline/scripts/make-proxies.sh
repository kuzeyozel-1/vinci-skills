#!/usr/bin/env bash
# Usage: make-proxies.sh index.tsv <out-dir>  — 1080-wide, 30 fps, no audio, short GOP for fast seeking.
set -euo pipefail
export LC_ALL=C
idx="${1:?index.tsv}"; out="${2:?out dir}"; mkdir -p "$out"
while IFS=$'\t' read -r -u 3 id f dur res; do
  [ -f "$out/$id.mp4" ] && continue
  w=${res%x*}; h=${res#*x}
  if [ "$h" -gt "$w" ]; then S="scale=1080:-2"; else S="scale=-2:1080"; fi   # portrait: 1080 wide; landscape: 1080 tall
  ffmpeg -nostdin -v error -y -i "$f" -an -vf "fps=30,$S,format=yuv420p" -c:v libx264 -preset veryfast -crf 20 -g 15 -movflags +faststart "$out/$id.mp4" && echo "ok $id"
done 3< "$idx"
