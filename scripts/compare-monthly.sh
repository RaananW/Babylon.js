#!/usr/bin/env bash
# compare-monthly.sh — Month-by-month PR activity breakdown
#
# Usage:
#   bash scripts/compare-monthly.sh [MONTHS] [INPUT]
#
# Examples:
#   bash scripts/compare-monthly.sh 12          # last 12 months
#   bash scripts/compare-monthly.sh 6           # last 6 months
#   bash scripts/compare-monthly.sh 24 data.json
#
set -euo pipefail
cd "$(dirname "$0")/.."

MONTHS="${1:-12}"
INPUT="${2:-pr-analysis/combined_prs.json}"
OUTPUT="pr-analysis/monthly_${MONTHS}mo.txt"

echo "Generating monthly breakdown for the last $MONTHS months..."

jq -r --argjson months "$MONTHS" '

def pad(n): tostring | if length < n then (" " * (n - length)) + . else . end;
def rpad(n): tostring | if length < n then . + (" " * (n - length)) else . end;
def fmtk: if . >= 1000000 then (. / 1000000 * 10 | round / 10 | tostring + "M")
           elif . >= 1000 then (. / 1000 * 10 | round / 10 | tostring + "K")
           else tostring end;

# Build list of month boundaries (YYYY-MM)
(now | strftime("%Y") | tonumber) as $cur_y |
(now | strftime("%m") | tonumber) as $cur_m |
[range($months; -1; -1) |
  (($cur_y * 12 + $cur_m - 1 - .) | . as $total | [($total / 12 | floor), ($total % 12 + 1)]) |
  "\(.[0])-\(.[1] | tostring | if length < 2 then "0" + . else . end)"
] as $month_keys |

# Classify each merged PR into its month bucket
[.[] | select(.state == "MERGED") |
  (.url | capture("github\\.com/[^/]+/(?<r>[^/]+)/") | .r) as $repo |
  (.createdAt[:7]) as $ym |
  {
    ym: $ym,
    repo: $repo,
    author: (.author.login // "ghost"),
    adds: (.additions // 0),
    dels: (.deletions // 0),
    total: ((.additions // 0) + (.deletions // 0)),
    files: (.changedFiles // 0)
  }
] as $all |

# Filter to only months in our window
[$all[] | select(.ym as $y | $month_keys | index($y) != null)] as $filtered |

# Get unique repos
($filtered | map(.repo) | unique | sort) as $repos |

# ═══════════════════════════════════════════════════════════
# OVERVIEW TABLE
# ═══════════════════════════════════════════════════════════

"==============================================================================",
"  MONTHLY PR ACTIVITY — last \($months) months",
"==============================================================================",
"",
"------------------------------------------------------------------------------",
"  OVERALL — PRs, contributors, and lines per month",
"------------------------------------------------------------------------------",
"",
"  \("Month" | rpad(10)) \("PRs" | pad(6)) \("Authors" | pad(8)) \("Adds" | pad(10)) \("Dels" | pad(10)) \("Net" | pad(10)) \("Churn" | pad(10)) \("Files" | pad(8)) \("Avg/PR" | pad(8))",
"  \("-" * 10 | rpad(10)) \("-" * 6) \("-" * 8) \("-" * 10) \("-" * 10) \("-" * 10) \("-" * 10) \("-" * 8) \("-" * 8)",
(
  $month_keys[] | . as $mk |
  [$filtered[] | select(.ym == $mk)] as $m |
  ($m | length) as $cnt |
  ($m | map(.adds) | add // 0) as $a |
  ($m | map(.dels) | add // 0) as $d |
  ($m | map(.total) | add // 0) as $t |
  ($m | map(.files) | add // 0) as $f |
  ($m | map(.author) | unique | length) as $auth |

  "  \($mk | rpad(10)) \($cnt | pad(6)) \($auth | pad(8)) \($a | fmtk | pad(10)) \($d | fmtk | pad(10)) \($a - $d | fmtk | pad(10)) \($t | fmtk | pad(10)) \($f | fmtk | pad(8)) \(if $cnt > 0 then ($t / $cnt | round | fmtk) else "0" end | pad(8))"
),
"",

# ═══════════════════════════════════════════════════════════
# PER REPOSITORY TABLE
# ═══════════════════════════════════════════════════════════

"------------------------------------------------------------------------------",
"  PER REPOSITORY — PRs per month",
"------------------------------------------------------------------------------",
"",
(
  "  \("Month" | rpad(10)) " +
  ($repos | map(. | rpad(14)) | join(" "))
),
(
  "  \("-" * 10 | rpad(10)) " +
  ($repos | map("-" * 14) | join(" "))
),
(
  $month_keys[] | . as $mk |
  "  \($mk | rpad(10)) " +
  ([$repos[] | . as $r |
    [$filtered[] | select(.ym == $mk and .repo == $r)] | length | pad(14)
  ] | join(" "))
),
"",

# ═══════════════════════════════════════════════════════════
# PER REPOSITORY — lines of code per month
# ═══════════════════════════════════════════════════════════

"------------------------------------------------------------------------------",
"  PER REPOSITORY — total lines changed (adds+dels) per month",
"------------------------------------------------------------------------------",
"",
(
  "  \("Month" | rpad(10)) " +
  ($repos | map(. | rpad(14)) | join(" "))
),
(
  "  \("-" * 10 | rpad(10)) " +
  ($repos | map("-" * 14) | join(" "))
),
(
  $month_keys[] | . as $mk |
  "  \($mk | rpad(10)) " +
  ([$repos[] | . as $r |
    [$filtered[] | select(.ym == $mk and .repo == $r)] | map(.total) | add // 0 | fmtk | pad(14)
  ] | join(" "))
),
"",

# ═══════════════════════════════════════════════════════════
# TOP CONTRIBUTORS PER MONTH
# ═══════════════════════════════════════════════════════════

"------------------------------------------------------------------------------",
"  TOP 10 CONTRIBUTORS PER MONTH (by PR count)",
"------------------------------------------------------------------------------",
"",
(
  $month_keys[] | . as $mk |
  [$filtered[] | select(.ym == $mk)] as $m |
  ($m | length) as $cnt |
  if $cnt > 0 then
    "  \($mk):  " +
    ([($m | group_by(.author))[] |
      { a: .[0].author, n: length } ] |
      sort_by(-.n) | .[0:10] |
      map("\(.a)(\(.n))") | join(", ")
    )
  else
    "  \($mk):  (no PRs)"
  end
),
"",

# ═══════════════════════════════════════════════════════════
# TOP CONTRIBUTORS PER MONTH BY LINES
# ═══════════════════════════════════════════════════════════

"------------------------------------------------------------------------------",
"  TOP 10 CONTRIBUTORS PER MONTH (by lines changed)",
"------------------------------------------------------------------------------",
"",
(
  $month_keys[] | . as $mk |
  [$filtered[] | select(.ym == $mk)] as $m |
  ($m | length) as $cnt |
  if $cnt > 0 then
    "  \($mk):  " +
    ([($m | group_by(.author))[] |
      { a: .[0].author, t: (map(.total) | add) } ] |
      sort_by(-.t) | .[0:10] |
      map("\(.a)(\(.t | fmtk))") | join(", ")
    )
  else
    "  \($mk):  (no PRs)"
  end
)

' "$INPUT" > "$OUTPUT"

echo "Report saved to $OUTPUT"
cat "$OUTPUT"
