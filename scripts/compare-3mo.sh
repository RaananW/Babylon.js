#!/usr/bin/env bash
# compare-periods.sh — Compare recent period vs prior (single jq pass, fast)
set -euo pipefail

INPUT="${1:-pr-analysis/combined_prs.json}"
OUTPUT="${2:-pr-analysis/comparison_recent.txt}"
CUTOFF="2026-01-01T00:00:00Z"
RECENT_LABEL="Jan 1 - Mar 14 2026"
RECENT_MO="2.5"
OLDER_LABEL="Mar 2019 - Dec 2025"
OLDER_MO="69"

jq -r --arg cutoff "$CUTOFF" --arg recent_mo "$RECENT_MO" --arg older_mo "$OLDER_MO" --arg recent_label "$RECENT_LABEL" --arg older_label "$OLDER_LABEL" '

def round10: . * 10 | round / 10;
def pct(a; b): if b > 0 then ((a - b) / b * 100 | round) else 0 end;
def pad(n): tostring | if length < n then (" " * (n - length)) + . else . end;
def rpad(n): tostring | if length < n then . + (" " * (n - length)) else . end;

($recent_mo | tonumber) as $rmo |
($older_mo | tonumber) as $omo |

[ .[] | select(.state == "MERGED") |
  (.url | capture("github\\.com/[^/]+/(?<r>[^/]+)/") | .r) as $repo |
  {
    repo: $repo,
    author: (.author.login // "ghost"),
    period: (if .createdAt >= $cutoff then "R" else "O" end),
    merged: true,
    adds: (.additions // 0),
    dels: (.deletions // 0),
    files: (.changedFiles // 0),
    merge_days: (if .mergedAt then ((.mergedAt | fromdateiso8601) - (.createdAt | fromdateiso8601)) / 86400 else null end)
  }
] as $all |

[$all[] | select(.period == "R")] as $r |
[$all[] | select(.period == "O")] as $o |

"==============================================================================",
"  PR ACTIVITY: \($recent_label) vs \($older_label)",
"==============================================================================",
"",
"------------------------------------------------------------------------------",
"  OVERALL",
"------------------------------------------------------------------------------",
"",
(
  ($r | length) as $rc | ($o | length) as $oc |
  ($rc / $rmo) as $rpm | ($oc / $omo) as $opm |
  [$r[] | select(.merged)] | length | . as $rm |
  [$o[] | select(.merged)] | length | . as $om |

  "  \("" | rpad(28)) \("Recent" | pad(10))  \("Prior" | pad(10))  \("Chg/mo" | pad(8))",
  "  \("Total PRs" | rpad(28)) \($rc | pad(10))  \($oc | pad(10))",
  "  \("PRs/month" | rpad(28)) \($rpm | round10 | pad(10))  \($opm | round10 | pad(10))  \(pct($rpm; $opm) | tostring + "%" | pad(8))",
  "  \("Merged" | rpad(28)) \($rm | pad(10))  \($om | pad(10))",
  "  \("Merge rate" | rpad(28)) \(if $rc > 0 then ($rm * 100 / $rc | round | tostring + "%") else "N/A" end | pad(10))  \(if $oc > 0 then ($om * 100 / $oc | round | tostring + "%") else "N/A" end | pad(10))",
  "  \("Unique contributors" | rpad(28)) \([$r[] | .author] | unique | length | pad(10))  \([$o[] | .author] | unique | length | pad(10))",
  "",
  "  \("Additions/month" | rpad(28)) \([$r[] | .adds] | add // 0 | . / $rmo | round | pad(10))  \([$o[] | .adds] | add // 0 | . / $omo | round | pad(10))",
  "  \("Deletions/month" | rpad(28)) \([$r[] | .dels] | add // 0 | . / $rmo | round | pad(10))  \([$o[] | .dels] | add // 0 | . / $omo | round | pad(10))",
  "  \("Files changed/month" | rpad(28)) \([$r[] | .files] | add // 0 | . / $rmo | round | pad(10))  \([$o[] | .files] | add // 0 | . / $omo | round | pad(10))",
  "",
  "  \("Median merge time" | rpad(28)) \([$r[] | select(.merge_days != null) | .merge_days] | sort | if length > 0 then .[length/2 | floor] | round10 | tostring + "d" else "N/A" end | pad(10))  \([$o[] | select(.merge_days != null) | .merge_days] | sort | if length > 0 then .[length/2 | floor] | round10 | tostring + "d" else "N/A" end | pad(10))"
),
"",
"------------------------------------------------------------------------------",
"  PER REPOSITORY",
"------------------------------------------------------------------------------",
(
  ($all | map(.repo) | unique | sort[]) as $repo |
  [$r[] | select(.repo == $repo)] as $rr |
  [$o[] | select(.repo == $repo)] as $or |
  ($rr | length) as $rrc | ($or | length) as $orc |
  ($rrc / $rmo) as $rrpm | ($orc / $omo) as $orpm |

  "",
  "  \($repo)",
  "  \("-" * ($repo | length))",
  "  \("" | rpad(28)) \("Recent" | pad(10))  \("Prior" | pad(10))  \("Chg/mo" | pad(8))",
  "  \("PRs" | rpad(28)) \($rrc | pad(10))  \($orc | pad(10))",
  "  \("PRs/month" | rpad(28)) \($rrpm | round10 | pad(10))  \($orpm | round10 | pad(10))  \(pct($rrpm; $orpm) | tostring + "%" | pad(8))",
  "  \("Merged" | rpad(28)) \([$rr[] | select(.merged)] | length | pad(10))  \([$or[] | select(.merged)] | length | pad(10))",
  "  \("Additions/mo" | rpad(28)) \([$rr[] | .adds] | add // 0 | . / $rmo | round | pad(10))  \([$or[] | .adds] | add // 0 | . / $omo | round | pad(10))",
  "  \("Deletions/mo" | rpad(28)) \([$rr[] | .dels] | add // 0 | . / $rmo | round | pad(10))  \([$or[] | .dels] | add // 0 | . / $omo | round | pad(10))",
  "  \("Unique contributors" | rpad(28)) \([$rr[] | .author] | unique | length | pad(10))  \([$or[] | .author] | unique | length | pad(10))"
),
"",
"------------------------------------------------------------------------------",
"  PER CONTRIBUTOR (active in recent period, sorted by recent PRs)",
"------------------------------------------------------------------------------",
"",
"  \("Contributor" | rpad(24)) \("R.PRs" | pad(6)) \("P.PRs" | pad(6)) \("R.Mrgd" | pad(7)) \("P.Mrgd" | pad(7)) \("R.+lines" | pad(9)) \("P.+lines" | pad(9)) \("R.-lines" | pad(9)) \("P.-lines" | pad(9)) \("Chg/mo" | pad(8))",
(
  [($all | group_by(.author))[] |
    {
      author: .[0].author,
      r_prs: [.[] | select(.period == "R")] | length,
      o_prs: [.[] | select(.period == "O")] | length,
      r_merged: [.[] | select(.period == "R" and .merged)] | length,
      o_merged: [.[] | select(.period == "O" and .merged)] | length,
      r_adds: ([.[] | select(.period == "R") | .adds] | add // 0),
      o_adds: ([.[] | select(.period == "O") | .adds] | add // 0),
      r_dels: ([.[] | select(.period == "R") | .dels] | add // 0),
      o_dels: ([.[] | select(.period == "O") | .dels] | add // 0)
    } |
    .r_pm = (.r_prs / $rmo) |
    .o_pm = (.o_prs / $omo) |
    .pct = pct(.r_pm; .o_pm)
  ] |
  sort_by(-.r_prs) |
  .[] |
  select(.r_prs > 0) |
  "  \(.author | rpad(24)) \(.r_prs | pad(6)) \(.o_prs | pad(6)) \(.r_merged | pad(7)) \(.o_merged | pad(7)) \(.r_adds | pad(9)) \(.o_adds | pad(9)) \(.r_dels | pad(9)) \(.o_dels | pad(9)) \(.pct | tostring + "%" | pad(8))"
),
"",
"  R.=Recent (\($recent_label))  P.=Prior (\($older_label))",
"  Chg/mo = % change in monthly PR rate. Positive = more PRs/month recently.",
"",
"------------------------------------------------------------------------------",
"  CONTRIBUTOR FLOW",
"------------------------------------------------------------------------------",
"",
(
  [($all | group_by(.author))[] |
    { author: .[0].author, r: [.[] | select(.period == "R")] | length, o: [.[] | select(.period == "O")] | length }
  ] |
  {
    new_count: [.[] | select(.r > 0 and .o == 0)] | length,
    returning: [.[] | select(.r > 0 and .o > 0)] | length,
    inactive: [.[] | select(.r == 0 and .o > 0)] | length,
    new_list: [.[] | select(.r > 0 and .o == 0)] | sort_by(-.r) | map("\(.author) (\(.r) PRs)")
  } |
  "  New (recent only):          \(.new_count)",
  "  Returning (both periods):   \(.returning)",
  "  Inactive (prior only):      \(.inactive)",
  "",
  if (.new_list | length) > 0 then
    "  New contributors:",
    (.new_list[] | "    \(.)")
  else empty end
)

' "$INPUT" > "$OUTPUT"

echo "Report written to: $OUTPUT" >&2
cat "$OUTPUT"
