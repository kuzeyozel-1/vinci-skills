#!/usr/bin/env bash
# Usage: contact-sheet.sh <video> <out.jpg> [columns=6] — one frame per second with timestamps by position (row-major).
set -euo pipefail
export LC_ALL=C
v="${1:?video}"; o="${2:?out.jpg}"; c="${3:-6}"
mkdir -p "$(dirname "$o")"
d=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$v"); rows=$(awk -v d="$d" -v c="$c" 'BEGIN{printf "%d", (d+c-1)/c}')
ffmpeg -nostdin -v error -y -i "$v" -vf "fps=1,scale=240:-2,tile=${c}x${rows}" -frames:v 1 -q:v 3 "$o" && echo "✓ $o (${c} per row, 1 frame = 1 s, row-major)"
