#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

CUTOFF="2026-01-01T00:00:00Z"
RECENT_MO="2.5"
OLDER_MO="69"
INPUT="pr-analysis/combined_prs.json"
OUTPUT="pr-analysis/comparison_lines.txt"

jq -r --arg cutoff "$CUTOFF" --arg rmo "$RECENT_MO" --arg omo "$OLDER_MO" '

def round10: . * 10 | round / 10;
def pad(n): tostring | if length < n then (" " * (n - length)) + . else . end;
def rpad(n): tostring | if length < n then . + (" " * (n - length)) else . end;
def fmtk: if . >= 1000000 then (. / 1000000 | round10 | tostring + "M")
           elif . >= 1000 then (. / 1000 | round10 | tostring + "K")
           else tostring end;

($rmo | tonumber) as $rmo | ($omo | tonumber) as $omo |

[ .[] | select(.state == "MERGED") |
  (.url | capture("github\\.com/[^/]+/(?<r>[^/]+)/") | .r) as $repo |
  {
    repo: $repo,
    author: (.author.login // "ghost"),
    period: (if .createdAt >= $cutoff then "R" else "O" end),
    adds: (.additions // 0),
    dels: (.deletions // 0),
    net: ((.additions // 0) - (.deletions // 0)),
    total: ((.additions // 0) + (.deletions // 0))
  }
] as $all |

"==============================================================================",
"  LINES OF CODE COMPARISON: Jan 1 - Mar 14 2026 vs Mar 2019 - Dec 2025",
"==============================================================================",
"  R = Recent (Jan-Mar 2026, ~2.5 months)  P = Prior (~69 months)",
"  All figures are MONTHLY RATES for fair comparison.",
"",
"------------------------------------------------------------------------------",
"  PER CONTRIBUTOR — monthly rates, sorted by recent total lines touched",
"------------------------------------------------------------------------------",
"",
"  \("Contributor" | rpad(22)) \("R +/mo" | pad(9)) \("P +/mo" | pad(9)) \("R -/mo" | pad(9)) \("P -/mo" | pad(9)) \("R net/mo" | pad(10)) \("P net/mo" | pad(10)) \("R tot/mo" | pad(10)) \("P tot/mo" | pad(10))",
"  \("-" * 22 | rpad(22)) \("-" * 9) \("-" * 9) \("-" * 9) \("-" * 9) \("-" * 10) \("-" * 10) \("-" * 10) \("-" * 10)",
(
  [($all | group_by(.author))[] |
    .[0].author as $a |
    select($a | startswith("app/") | not) |
    {
      author: $a,
      r_adds:  ([.[] | select(.period == "R") | .adds] | add // 0),
      o_adds:  ([.[] | select(.period == "O") | .adds] | add // 0),
      r_dels:  ([.[] | select(.period == "R") | .dels] | add // 0),
      o_dels:  ([.[] | select(.period == "O") | .dels] | add // 0),
      r_total: ([.[] | select(.period == "R") | .total] | add // 0),
      o_total: ([.[] | select(.period == "O") | .total] | add // 0),
      r_net:   ([.[] | select(.period == "R") | .net] | add // 0),
      o_net:   ([.[] | select(.period == "O") | .net] | add // 0)
    } | select(.r_total > 0)
  ] |
  sort_by(-.r_total) |
  .[] |
  "  \(.author | rpad(22)) \(.r_adds / $rmo | round | fmtk | pad(9)) \(.o_adds / $omo | round | fmtk | pad(9)) \(.r_dels / $rmo | round | fmtk | pad(9)) \(.o_dels / $omo | round | fmtk | pad(9)) \(.r_net / $rmo | round | fmtk | pad(10)) \(.o_net / $omo | round | fmtk | pad(10)) \(.r_total / $rmo | round | fmtk | pad(10)) \(.o_total / $omo | round | fmtk | pad(10))"
),
"",
"  +/mo = additions/month  -/mo = deletions/month",
"  net/mo = (adds-dels)/month  tot/mo = (adds+dels)/month",
"",
"------------------------------------------------------------------------------",
"  PER CONTRIBUTOR — average lines per PR (recent vs prior)",
"------------------------------------------------------------------------------",
"",
"  \("Contributor" | rpad(22)) \("R PRs" | pad(6)) \("P PRs" | pad(6)) \("R avg+" | pad(8)) \("P avg+" | pad(8)) \("R avg-" | pad(8)) \("P avg-" | pad(8)) \("R avg.tot" | pad(10)) \("P avg.tot" | pad(10))",
"  \("-" * 22 | rpad(22)) \("-" * 6) \("-" * 6) \("-" * 8) \("-" * 8) \("-" * 8) \("-" * 8) \("-" * 10) \("-" * 10)",
(
  [($all | group_by(.author))[] |
    .[0].author as $a |
    select($a | startswith("app/") | not) |
    {
      author: $a,
      r_adds:  ([.[] | select(.period == "R") | .adds] | add // 0),
      o_adds:  ([.[] | select(.period == "O") | .adds] | add // 0),
      r_dels:  ([.[] | select(.period == "R") | .dels] | add // 0),
      o_dels:  ([.[] | select(.period == "O") | .dels] | add // 0),
      r_total: ([.[] | select(.period == "R") | .total] | add // 0),
      o_total: ([.[] | select(.period == "O") | .total] | add // 0),
      r_prs:   ([.[] | select(.period == "R")] | length),
      o_prs:   ([.[] | select(.period == "O")] | length)
    } | select(.r_prs > 0)
  ] |
  sort_by(-.r_total) |
  .[] |
  (.r_prs | if . > 0 then . else 1 end) as $rp |
  (.o_prs | if . > 0 then . else 1 end) as $op |
  "  \(.author | rpad(22)) \(.r_prs | pad(6)) \(.o_prs | pad(6)) \(.r_adds / $rp | round | fmtk | pad(8)) \(.o_adds / $op | round | fmtk | pad(8)) \(.r_dels / $rp | round | fmtk | pad(8)) \(.o_dels / $op | round | fmtk | pad(8)) \(.r_total / $rp | round | fmtk | pad(10)) \(.o_total / $op | round | fmtk | pad(10))"
),
"",
"  avg = average per PR. Large avg.tot may indicate bulk/generated changes.",
"",
"------------------------------------------------------------------------------",
"  PER REPOSITORY — lines of code monthly rates",
"------------------------------------------------------------------------------",
"",
(
  ($all | map(.repo) | unique | sort[]) as $repo |
  [$all[] | select(.repo == $repo and .period == "R")] as $rr |
  [$all[] | select(.repo == $repo and .period == "O")] as $or |
  ($rr | length) as $rrc | ($or | length) as $orc |

  "  \($repo)",
  "  \("-" * ($repo | length))",
  "  \("" | rpad(28)) \("Recent/mo" | pad(12)) \("Prior/mo" | pad(12)) \("Change" | pad(10))",
  "  \("Additions" | rpad(28)) \([$rr[] | .adds] | add // 0 | . / $rmo | round | fmtk | pad(12)) \([$or[] | .adds] | add // 0 | . / $omo | round | fmtk | pad(12)) \((if ([$or[] | .adds] | add // 0) / $omo > 0 then (((([$rr[] | .adds] | add // 0) / $rmo) / (([$or[] | .adds] | add // 0) / $omo) - 1) * 100 | round | tostring + "%") else "N/A" end) | pad(10))",
  "  \("Deletions" | rpad(28)) \([$rr[] | .dels] | add // 0 | . / $rmo | round | fmtk | pad(12)) \([$or[] | .dels] | add // 0 | . / $omo | round | fmtk | pad(12)) \((if ([$or[] | .dels] | add // 0) / $omo > 0 then (((([$rr[] | .dels] | add // 0) / $rmo) / (([$or[] | .dels] | add // 0) / $omo) - 1) * 100 | round | tostring + "%") else "N/A" end) | pad(10))",
  "  \("Net (adds - dels)" | rpad(28)) \(([$rr[] | .adds] | add // 0) - ([$rr[] | .dels] | add // 0) | . / $rmo | round | fmtk | pad(12)) \(([$or[] | .adds] | add // 0) - ([$or[] | .dels] | add // 0) | . / $omo | round | fmtk | pad(12))",
  "  \("Total (adds + dels)" | rpad(28)) \([$rr[] | .total] | add // 0 | . / $rmo | round | fmtk | pad(12)) \([$or[] | .total] | add // 0 | . / $omo | round | fmtk | pad(12)) \((if ([$or[] | .total] | add // 0) / $omo > 0 then (((([$rr[] | .total] | add // 0) / $rmo) / (([$or[] | .total] | add // 0) / $omo) - 1) * 100 | round | tostring + "%") else "N/A" end) | pad(10))",
  "  \("Avg lines/PR" | rpad(28)) \(if $rrc > 0 then ([$rr[] | .total] | add // 0) / $rrc | round | fmtk else "N/A" end | pad(12)) \(if $orc > 0 then ([$or[] | .total] | add // 0) / $orc | round | fmtk else "N/A" end | pad(12))",
  "  \("PRs" | rpad(28)) \($rrc | fmtk | pad(12)) \($orc | fmtk | pad(12))",
  ""
),

"------------------------------------------------------------------------------",
"  OVERALL TOTALS",
"------------------------------------------------------------------------------",
"",
(
  [$all[] | select(.period == "R")] as $rr |
  [$all[] | select(.period == "O")] as $or |
  ($rr | length) as $rrc | ($or | length) as $orc |
  ([$rr[] | .adds] | add // 0) as $ra | ([$or[] | .adds] | add // 0) as $oa |
  ([$rr[] | .dels] | add // 0) as $rd | ([$or[] | .dels] | add // 0) as $od |
  ([$rr[] | .total] | add // 0) as $rt | ([$or[] | .total] | add // 0) as $ot |

  "  \("" | rpad(28)) \("Recent/mo" | pad(12)) \("Prior/mo" | pad(12)) \("Change" | pad(10))",
  "  \("Additions" | rpad(28)) \($ra / $rmo | round | fmtk | pad(12)) \($oa / $omo | round | fmtk | pad(12)) \(if $oa / $omo > 0 then ((($ra / $rmo) / ($oa / $omo) - 1) * 100 | round | tostring + "%") else "N/A" end | pad(10))",
  "  \("Deletions" | rpad(28)) \($rd / $rmo | round | fmtk | pad(12)) \($od / $omo | round | fmtk | pad(12)) \(if $od / $omo > 0 then ((($rd / $rmo) / ($od / $omo) - 1) * 100 | round | tostring + "%") else "N/A" end | pad(10))",
  "  \("Net growth (adds-dels)" | rpad(28)) \(($ra - $rd) / $rmo | round | fmtk | pad(12)) \(($oa - $od) / $omo | round | fmtk | pad(12))",
  "  \("Total churn (adds+dels)" | rpad(28)) \($rt / $rmo | round | fmtk | pad(12)) \($ot / $omo | round | fmtk | pad(12)) \(if $ot / $omo > 0 then ((($rt / $rmo) / ($ot / $omo) - 1) * 100 | round | tostring + "%") else "N/A" end | pad(10))",
  "  \("Avg lines/PR" | rpad(28)) \(if $rrc > 0 then $rt / $rrc | round | fmtk else "N/A" end | pad(12)) \(if $orc > 0 then $ot / $orc | round | fmtk else "N/A" end | pad(12))"
)

' "$INPUT" > "$OUTPUT"

echo "Report saved to $OUTPUT"
cat "$OUTPUT"
