#!/usr/bin/env bash
# Usage: inventory.sh <raw-dir>  -> TSV: id<TAB>path<TAB>seconds<TAB>WxH
set -euo pipefail
export LC_ALL=C
dir="${1:?raw dir}"; n=0
find "$dir" -type f \( -iname '*.mp4' -o -iname '*.mov' -o -iname '*.m4v' \) | sort | while IFS= read -r f; do
  n=$((n+1))
  d=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$f" </dev/null)
  r=$(ffprobe -v error -select_streams v:0 -show_entries stream=width,height -of csv=s=x:p=0 "$f" </dev/null)
  printf 'v%02d\t%s\t%.1f\t%s\n' "$n" "$f" "$d" "$r"
done
