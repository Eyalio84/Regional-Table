#!/usr/bin/env bash
# check-copy.sh — positioning red-flag grep for regional-table.
# Scans editorial copy surfaces for banned phrases. See docs/POSITIONING.md for rationale.
#
# Exit 0: clean. Exit 1: matches found — rewrite before committing.
#
# Scanned paths:
#   src/pages/*.astro and src/pages/**/*.astro
#   src/content/**/*.mdx
#   src/content/**/*.yaml
#
# Whitelisted (discussed but not used as copy):
#   docs/POSITIONING.md
#   docs/DECISIONS.md

set -u
cd "$(dirname "$0")/.."

# Banned phrases — sourced from docs/POSITIONING.md.
# Word-boundary anchors (\b) on single words; substring match on multi-word phrases.
# Case-insensitive match (-i in grep call below).
BANNED=(
  "revolutionize"
  "revolutionise"
  "seamlessly"
  "cutting-edge"
  "cutting edge"
  "leverage"
  "unleash"
  "next-gen"
  "next-generation"
  "game-changing"
  "game changing"
  "best-in-class"
  "best in class"
  "synergy"
  "synergies"
  "disruptive"
  "paradigm shift"
  "empower"
  "\brobust\b"
  "scalable solution"
)

# Build a single alternation pattern for grep -E
PATTERN=$(IFS='|'; echo "${BANNED[*]}")

# Paths to scan: pages (all .astro) and content (MDX + YAML)
SCAN_PATHS=(
  "src/pages"
  "src/content"
)

# Gather files to scan
FILES=()
for path in "${SCAN_PATHS[@]}"; do
  if [ -d "$path" ]; then
    while IFS= read -r -d '' file; do
      FILES+=("$file")
    done < <(find "$path" -type f \( -name "*.astro" -o -name "*.mdx" -o -name "*.yaml" -o -name "*.yml" \) -print0 2>/dev/null)
  fi
done

if [ ${#FILES[@]} -eq 0 ]; then
  echo "[OK] No content files found to scan (expected once content is authored in M1+)."
  exit 0
fi

# Run the grep
MATCHES=$(grep -rniE "$PATTERN" "${FILES[@]}" 2>/dev/null \
  | grep -v "docs/POSITIONING.md" \
  | grep -v "docs/DECISIONS.md" \
  || true)

if [ -n "$MATCHES" ]; then
  echo "[FAIL] Positioning red flags found:"
  echo ""
  echo "$MATCHES"
  echo ""
  echo "Rules:  docs/POSITIONING.md"
  echo "Fix:    Rewrite the sentence to be specific. Ask what the regional expert would actually say."
  echo ""
  exit 1
fi

echo "[OK] Copy check clean — no banned phrases found."
exit 0
