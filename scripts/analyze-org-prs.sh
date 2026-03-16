#!/usr/bin/env bash
#
# analyze-org-prs.sh — Fetch comprehensive PR data from all repos in a GitHub org
#
# Usage:
#   ./scripts/analyze-org-prs.sh [OPTIONS]
#
# Options:
#   -o, --org NAME          GitHub org name (default: BabylonJS)
#   -d, --output-dir DIR    Output directory (default: ./pr-analysis)
#   -s, --since DATE        Start date, ISO format (default: 7 years ago)
#   -u, --until DATE        End date, ISO format (default: today)
#   -r, --repos REPOS       Comma-separated repo names (default: all non-fork repos)
#   --include-forks         Include forked repos
#   --detailed              Fetch extra fields: reviews, comments, participants, reactions
#                           WARNING: much slower for large repos (extra API calls per PR)
#   --skip-existing         Skip repos whose JSON output file already exists
#   -h, --help              Show this help
#
# Requirements: gh (GitHub CLI) authenticated, jq
#
# Output:
#   <output-dir>/raw/<repo>.json         — Raw PR data per repo
#   <output-dir>/combined_prs.json       — All PRs merged into one file
#   <output-dir>/combined_prs.csv        — Flattened CSV for spreadsheet analysis
#   <output-dir>/summary.txt             — High-level statistics
#
# Limitations (see bottom of script for detailed notes):
#   - GitHub GraphQL rate limit: 5,000 points/hour (each page ≈1 point)
#   - For very large repos (>10K PRs), fetching can take 10-30+ minutes
#   - "additions"/"deletions" reflect final merge diff, not incremental commits
#   - Review/comment counts are capped at the first 100 per PR by gh CLI
#   - Draft PR status only available for PRs created after Feb 2019
#   - Deleted user accounts show as null/ghost
#   - The search API (if used) caps at 1,000 results per query
#

set -euo pipefail

# ─── Defaults ──────────────────────────────────────────────────────────────────
ORG="BabylonJS"
OUTPUT_DIR="./pr-analysis"
SINCE=""
UNTIL=""
SPECIFIC_REPOS=""
INCLUDE_FORKS=false
DETAILED=false
SKIP_EXISTING=false

# ─── Parse arguments ──────────────────────────────────────────────────────────
while [[ $# -gt 0 ]]; do
    case "$1" in
        -o|--org)       ORG="$2"; shift 2 ;;
        -d|--output-dir) OUTPUT_DIR="$2"; shift 2 ;;
        -s|--since)     SINCE="$2"; shift 2 ;;
        -u|--until)     UNTIL="$2"; shift 2 ;;
        -r|--repos)     SPECIFIC_REPOS="$2"; shift 2 ;;
        --include-forks) INCLUDE_FORKS=true; shift ;;
        --detailed)     DETAILED=true; shift ;;
        --skip-existing) SKIP_EXISTING=true; shift ;;
        -h|--help)
            sed -n '2,/^$/p' "$0" | sed 's/^#//; s/^ //'
            exit 0
            ;;
        *) echo "Unknown option: $1" >&2; exit 1 ;;
    esac
done

# ─── Compute date range ───────────────────────────────────────────────────────
if [[ -z "$SINCE" ]]; then
    # 7 years ago from today
    if date --version &>/dev/null 2>&1; then
        # GNU date
        SINCE=$(date -d "7 years ago" +%Y-%m-%dT00:00:00Z)
    else
        # macOS date
        SINCE=$(date -v-7y +%Y-%m-%dT00:00:00Z)
    fi
fi
if [[ -z "$UNTIL" ]]; then
    UNTIL=$(date +%Y-%m-%dT23:59:59Z)
fi

echo "═══════════════════════════════════════════════════════════════"
echo "  GitHub PR Analysis for org: $ORG"
echo "  Date range: $SINCE → $UNTIL"
echo "  Output: $OUTPUT_DIR"
echo "  Detailed mode: $DETAILED"
echo "═══════════════════════════════════════════════════════════════"

# ─── Verify tools ─────────────────────────────────────────────────────────────
for cmd in gh jq; do
    if ! command -v "$cmd" &>/dev/null; then
        echo "ERROR: '$cmd' is required but not found." >&2
        exit 1
    fi
done

AUTH_OUTPUT=$(gh auth status 2>&1 || true)
if ! echo "$AUTH_OUTPUT" | grep -q "Logged in"; then
    echo "ERROR: gh is not authenticated. Run 'gh auth login' first." >&2
    exit 1
fi

# ─── Create output dirs ──────────────────────────────────────────────────────
RAW_DIR="$OUTPUT_DIR/raw"
mkdir -p "$RAW_DIR"

# ─── Discover repos ──────────────────────────────────────────────────────────
if [[ -n "$SPECIFIC_REPOS" ]]; then
    IFS=',' read -ra REPOS <<< "$SPECIFIC_REPOS"
else
    echo ""
    echo "Discovering repos in $ORG..."
    REPO_FILTER='.[] | select(.isFork == false) | .name'
    if [[ "$INCLUDE_FORKS" == true ]]; then
        REPO_FILTER='.[] | .name'
    fi
    mapfile -t REPOS < <(
        gh repo list "$ORG" --limit 200 --json name,isFork --jq "$REPO_FILTER"
    )
    echo "Found ${#REPOS[@]} repos (forks $(if $INCLUDE_FORKS; then echo "included"; else echo "excluded"; fi))"
fi

# ─── Define JSON fields ──────────────────────────────────────────────────────
# Lightweight fields: cheap for GitHub to compute, safe for bulk fetch
LIGHT_FIELDS="number,title,state,url,author,createdAt,updatedAt,closedAt,mergedAt,mergedBy,baseRefName,headRefName,isDraft,reviewDecision,labels"

# Expensive fields: additions/deletions/changedFiles require diff computation
# and cause 502 errors on large repos when fetched in bulk
EXPENSIVE_FIELDS="additions,deletions,changedFiles"

# All fast fields combined (used for small repos)
FAST_FIELDS="$LIGHT_FIELDS,$EXPENSIVE_FIELDS"

# Detailed fields add: reviews, comments, participants, reactionGroups, latestReviews
# These require sub-queries per PR page and are significantly slower
DETAIL_FIELDS="$FAST_FIELDS,reviews,comments,participants,reactionGroups,latestReviews"

if [[ "$DETAILED" == true ]]; then
    JSON_FIELDS="$DETAIL_FIELDS"
else
    JSON_FIELDS="$FAST_FIELDS"
fi

# Threshold: repos with more PRs than this skip the full-field attempt
# and go straight to lightweight + enrichment (avoids a guaranteed 502 + wasted time)
LARGE_REPO_THRESHOLD=2000

# ─── Helper: enrich PRs with expensive fields via REST API ────────────────────
# Uses individual REST API calls (GET /repos/:owner/:repo/pulls/:number) which
# are far more reliable than batched GraphQL for diff stats.
# Supports checkpointing: saves after every PR so reruns resume exactly.
enrich_prs() {
    local repo="$1"
    local infile="$2"     # JSON file with lightweight PR data
    local outfile="$3"    # Output file with enriched data
    local total
    total=$(jq 'length' "$infile")

    local MAX_RETRIES=3
    local enriched_file="$infile.enriched"

    # ── Resume from checkpoint if it exists ──
    local start_offset=0
    if [[ -f "$enriched_file" ]]; then
        local existing_enriched
        existing_enriched=$(jq '[.[] | select(.additions != null)] | length' "$enriched_file" 2>/dev/null || echo 0)
        if [[ "$existing_enriched" -gt 0 ]]; then
            start_offset=$(jq '[to_entries[] | select(.value.additions == null)] | .[0].key // length' "$enriched_file")
            echo "  ↻  Resuming enrichment from offset $start_offset ($existing_enriched / $total already enriched)..."
        else
            cp "$infile" "$enriched_file"
            echo "  ↻  Enriching $total PRs with line/file stats (REST API)..."
        fi
    else
        cp "$infile" "$enriched_file"
        echo "  ↻  Enriching $total PRs with line/file stats (REST API)..."
    fi

    local i=$start_offset
    local consecutive_failures=0
    local save_counter=0
    # Buffer: accumulate updates in memory and flush to disk periodically
    # to avoid jq rewriting the whole file on every single PR
    local SAVE_INTERVAL=10
    local pending_updates="[]"

    flush_updates() {
        if [[ "$pending_updates" == "[]" ]]; then return; fi
        jq --argjson updates "$pending_updates" '
            reduce $updates[] as $u (.;
                .[$u.idx].additions = $u.a |
                .[$u.idx].deletions = $u.d |
                .[$u.idx].changedFiles = $u.f
            )
        ' "$enriched_file" > "$enriched_file.tmp" && mv "$enriched_file.tmp" "$enriched_file"
        pending_updates="[]"
    }

    while [[ $i -lt $total ]]; do
        local pr_number
        pr_number=$(jq -r ".[$i].number" "$infile")

        # Fetch via REST API — much more reliable than batched GraphQL
        local attempt=0
        local success=false
        while [[ $attempt -lt $MAX_RETRIES ]]; do
            local result
            if result=$(gh api "repos/$ORG/$repo/pulls/$pr_number" --jq '{a: .additions, d: .deletions, f: .changed_files}' 2>/dev/null); then
                local adds dels files
                adds=$(echo "$result" | jq '.a')
                dels=$(echo "$result" | jq '.d')
                files=$(echo "$result" | jq '.f')
                if [[ "$adds" != "null" ]]; then
                    pending_updates=$(echo "$pending_updates" | jq --argjson idx "$i" --argjson a "$adds" --argjson d "$dels" --argjson f "$files" \
                        '. + [{"idx": $idx, "a": $a, "d": $d, "f": $f}]')
                    success=true
                    consecutive_failures=0
                    break
                fi
            fi
            attempt=$((attempt + 1))
            if [[ $attempt -lt $MAX_RETRIES ]]; then
                sleep $((attempt * 5))
            fi
        done

        if [[ "$success" == false ]]; then
            consecutive_failures=$((consecutive_failures + 1))
            # Still add a record so we don't re-process, but with 0 values
            pending_updates=$(echo "$pending_updates" | jq --argjson idx "$i" \
                '. + [{"idx": $idx, "a": 0, "d": 0, "f": 0}]')

            if [[ $consecutive_failures -ge 5 ]]; then
                echo "  ⏸  $consecutive_failures consecutive failures, pausing 60s..."
                flush_updates
                sleep 60
                consecutive_failures=0
            fi
        fi

        i=$((i + 1))
        save_counter=$((save_counter + 1))

        # Flush to disk periodically
        if (( save_counter % SAVE_INTERVAL == 0 )); then
            flush_updates
        fi

        # Progress indicator every 250 PRs
        if (( i % 250 == 0 || i == total )); then
            flush_updates
            echo "     $i / $total enriched..."
        fi

        # Throttle: ~0.3s between requests = ~200 req/min, well within REST limits
        sleep 0.3
    done

    flush_updates
    mv "$enriched_file" "$outfile"
}

# ─── Helper: check repo PR count to decide strategy ──────────────────────────
get_repo_pr_count() {
    local repo="$1"
    gh api "repos/$ORG/$repo" --jq '.open_issues_count' 2>/dev/null || echo 0
    # Note: open_issues_count includes issues + open PRs. It's a rough heuristic.
    # For a more exact count we'd need to paginate, but this is fast and good enough
    # to distinguish small repos from 10K+ PR repos.
}

# ─── Fetch PRs per repo ──────────────────────────────────────────────────────
TOTAL_PRS=0

for REPO in "${REPOS[@]}"; do
    OUT_FILE="$RAW_DIR/${REPO}.json"

    # ── Skip if already complete ──
    if [[ "$SKIP_EXISTING" == true && -f "$OUT_FILE" ]]; then
        COUNT=$(jq 'length' "$OUT_FILE" 2>/dev/null || echo 0)
        if [[ "$COUNT" -gt 0 ]]; then
            echo "  ⏭  $REPO — skipped (already exists, $COUNT PRs)"
            TOTAL_PRS=$((TOTAL_PRS + COUNT))
            continue
        fi
    fi

    echo ""
    echo "─── Fetching PRs from $ORG/$REPO ───"

    # ── Check for existing checkpoint (interrupted enrichment) ──
    FILTERED_FILE="$OUT_FILE.filtered"
    ENRICHED_FILE="$FILTERED_FILE.enriched"
    if [[ -f "$ENRICHED_FILE" ]]; then
        local_enriched=$(jq 'length' "$ENRICHED_FILE" 2>/dev/null || echo 0)
        local_done=$(jq '[.[] | select(.additions != null)] | length' "$ENRICHED_FILE" 2>/dev/null || echo 0)
        if [[ "$local_enriched" -gt 0 ]]; then
            echo "  📋 Found checkpoint: $local_done / $local_enriched PRs already enriched"
            # Resume enrichment from checkpoint
            enrich_prs "$REPO" "$FILTERED_FILE" "$OUT_FILE"
            rm -f "$FILTERED_FILE" "$ENRICHED_FILE"
            COUNT=$(jq 'length' "$OUT_FILE")
            TOTAL_PRS=$((TOTAL_PRS + COUNT))
            echo "  ✓  $REPO — $COUNT PRs in date range (enriched, resumed)"
            continue
        fi
    fi

    # ── Decide strategy: check if repo is large ──
    # For large repos, skip the full-field attempt (it will 502 and waste minutes)
    USE_FALLBACK=false
    PR_ESTIMATE=$(gh pr list -R "$ORG/$REPO" --state all --limit 1 --json number --jq '.[0].number // 0' 2>/dev/null || echo 0)
    if [[ "$PR_ESTIMATE" -gt "$LARGE_REPO_THRESHOLD" ]]; then
        echo "  ℹ  Large repo detected (~$PR_ESTIMATE PRs), using lightweight fetch + enrichment"
        USE_FALLBACK=true
    fi

    if [[ "$USE_FALLBACK" == false ]]; then
        # Try full field set (works for small/medium repos)
        if gh pr list \
            -R "$ORG/$REPO" \
            --state all \
            --limit 99999 \
            --json "$JSON_FIELDS" \
            > "$OUT_FILE.tmp" 2>/tmp/gh_pr_err.txt; then
            # Full fetch succeeded — filter by date and done
            jq --arg since "$SINCE" --arg until "$UNTIL" '
                [ .[] | select(.createdAt >= $since and .createdAt <= $until) ]
            ' "$OUT_FILE.tmp" > "$OUT_FILE"
            rm -f "$OUT_FILE.tmp"

            COUNT=$(jq 'length' "$OUT_FILE")
            TOTAL_PRS=$((TOTAL_PRS + COUNT))
            echo "  ✓  $REPO — $COUNT PRs in date range"
            continue
        else
            local_err=$(cat /tmp/gh_pr_err.txt 2>/dev/null || echo "unknown")
            if echo "$local_err" | grep -qi "502\|bad gateway\|timeout"; then
                echo "  ⚠  Full fetch got 502, falling back to lightweight + enrichment..."
                USE_FALLBACK=true
                rm -f "$OUT_FILE.tmp"
            else
                echo "  ⚠  $REPO — failed to fetch: $local_err"
                rm -f "$OUT_FILE.tmp"
                echo "[]" > "$OUT_FILE"
                continue
            fi
        fi
    fi

    # ── Fallback: lightweight fetch + enrichment ──
    if [[ "$USE_FALLBACK" == true ]]; then
        # Check if lightweight data was already fetched
        if [[ ! -f "$FILTERED_FILE" ]]; then
            echo "  ↻  Fetching lightweight PR data..."
            if ! gh pr list \
                -R "$ORG/$REPO" \
                --state all \
                --limit 99999 \
                --json "$LIGHT_FIELDS" \
                > "$OUT_FILE.tmp" 2>/dev/null; then
                echo "  ⚠  $REPO — lightweight fetch also failed"
                rm -f "$OUT_FILE.tmp"
                echo "[]" > "$OUT_FILE"
                continue
            fi

            # Filter by date first (to reduce enrichment work)
            jq --arg since "$SINCE" --arg until "$UNTIL" '
                [ .[] | select(.createdAt >= $since and .createdAt <= $until) ]
            ' "$OUT_FILE.tmp" > "$FILTERED_FILE"
            rm -f "$OUT_FILE.tmp"

            FCOUNT=$(jq 'length' "$FILTERED_FILE")
            echo "  ✓  $FCOUNT PRs in date range, starting enrichment..."
        else
            FCOUNT=$(jq 'length' "$FILTERED_FILE")
            echo "  📋 Reusing cached lightweight data ($FCOUNT PRs)"
        fi

        # Enrich with expensive fields (with checkpointing + retry)
        enrich_prs "$REPO" "$FILTERED_FILE" "$OUT_FILE"
        rm -f "$FILTERED_FILE"

        COUNT=$(jq 'length' "$OUT_FILE")
        TOTAL_PRS=$((TOTAL_PRS + COUNT))
        echo "  ✓  $REPO — $COUNT PRs in date range (enriched)"
    fi
done

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "  Total PRs fetched: $TOTAL_PRS"
echo "═══════════════════════════════════════════════════════════════"

# ─── Combine all repos into one file ─────────────────────────────────────────
echo ""
echo "Combining all repos..."

jq -s '
    [ foreach .[] as $file (null;
        null;
        $file[]
    ) ] |
    # Alternative: simple flatten
    null
' /dev/null > /dev/null 2>&1 || true

# Simpler approach: concatenate arrays
jq -s '
    reduce .[] as $arr ([]; . + $arr)
' "$RAW_DIR"/*.json > "$OUTPUT_DIR/combined_prs.json"

COMBINED_COUNT=$(jq 'length' "$OUTPUT_DIR/combined_prs.json")
echo "Combined file: $COMBINED_COUNT PRs total"

# ─── Generate CSV ─────────────────────────────────────────────────────────────
echo "Generating CSV..."

jq -r '
    # CSV header
    (["repo","number","title","state","author","author_is_bot",
     "created_at","updated_at","closed_at","merged_at",
     "merged_by","days_to_close","days_to_merge",
     "additions","deletions","total_lines_changed","changed_files",
     "base_branch","head_branch","is_draft","review_decision",
     "label_names","url"
     ] | @csv),

    # CSV rows
    (.[] |
        # Extract repo name from URL
        (.url | capture("github\\.com/[^/]+/(?<r>[^/]+)/") | .r) as $repo |

        # Compute days to close
        (if .closedAt then
            ( (.closedAt | fromdateiso8601) - (.createdAt | fromdateiso8601) ) / 86400 | floor
        else null end) as $days_close |

        # Compute days to merge
        (if .mergedAt then
            ( (.mergedAt | fromdateiso8601) - (.createdAt | fromdateiso8601) ) / 86400 | floor
        else null end) as $days_merge |

        # Author info
        (.author.login // "ghost") as $author |
        (.author.is_bot // false) as $is_bot |

        # Labels
        ([.labels[]?.name] | join(";")) as $labels |

        # Merged by
        (.mergedBy.login // "") as $merged_by |

        [
            $repo,
            .number,
            (.title | gsub("[\"\\\\]"; "") | gsub("\n"; " ")),
            .state,
            $author,
            $is_bot,
            .createdAt,
            .updatedAt,
            (.closedAt // ""),
            (.mergedAt // ""),
            $merged_by,
            ($days_close // ""),
            ($days_merge // ""),
            (.additions // 0),
            (.deletions // 0),
            ((.additions // 0) + (.deletions // 0)),
            (.changedFiles // 0),
            .baseRefName,
            .headRefName,
            (.isDraft // false),
            (.reviewDecision // ""),
            $labels,
            .url
        ] | @csv
    )
' "$OUTPUT_DIR/combined_prs.json" > "$OUTPUT_DIR/combined_prs.csv"

echo "CSV written to $OUTPUT_DIR/combined_prs.csv"

# ─── Generate summary statistics ─────────────────────────────────────────────
echo "Generating summary..."

jq -r '
    # Group by repo
    group_by(.url | capture("github\\.com/[^/]+/(?<r>[^/]+)/") | .r) |

    "SUMMARY REPORT",
    "═══════════════════════════════════════════════════════════",
    "",
    "OVERALL",
    "  Total PRs:       \(map(length) | add)",
    "  Total repos:     \(length)",
    "  Date range:      \([.[][] | .createdAt] | sort | first) → \([.[][] | .createdAt] | sort | last)",
    "",
    "BY STATE",
    "  Merged:          \([.[][] | select(.state == "MERGED")] | length)",
    "  Closed:          \([.[][] | select(.state == "CLOSED")] | length)",
    "  Open:            \([.[][] | select(.state == "OPEN")] | length)",
    "",
    "CODE CHANGES (all PRs)",
    "  Total additions: \([.[][] | .additions // 0] | add)",
    "  Total deletions: \([.[][] | .deletions // 0] | add)",
    "  Total files:     \([.[][] | .changedFiles // 0] | add)",
    "",
    "PER-REPO BREAKDOWN",
    (
        .[] |
        (.[0].url | capture("github\\.com/[^/]+/(?<r>[^/]+)/") | .r) as $repo |
        "  \($repo):",
        "    PRs: \(length)  |  Merged: \([.[] | select(.state == "MERGED")] | length)  |  Closed: \([.[] | select(.state == "CLOSED")] | length)  |  Open: \([.[] | select(.state == "OPEN")] | length)",
        "    Additions: \([.[] | .additions // 0] | add)  |  Deletions: \([.[] | .deletions // 0] | add)  |  Files changed: \([.[] | .changedFiles // 0] | add)"
    ),
    "",
    "TOP 20 CONTRIBUTORS (by PR count)",
    (
        [.[][] | .author.login // "ghost"] | group_by(.) |
        map({author: .[0], count: length}) | sort_by(-.count) | .[0:20] |
        .[] | "  \(.author): \(.count) PRs"
    ),
    "",
    "REVIEW DECISIONS",
    (
        [.[][] | .reviewDecision // "NONE"] | group_by(.) |
        map({decision: .[0], count: length}) | sort_by(-.count) |
        .[] | "  \(.decision): \(.count)"
    ),
    "",
    "YEARLY BREAKDOWN",
    (
        [.[][] | {year: (.createdAt[:4]), state: .state}] |
        group_by(.year) | 
        map({
            year: .[0].year,
            total: length,
            merged: [.[] | select(.state == "MERGED")] | length,
            closed: [.[] | select(.state == "CLOSED")] | length,
            open: [.[] | select(.state == "OPEN")] | length
        }) | sort_by(.year) |
        .[] | "  \(.year): \(.total) total (\(.merged) merged, \(.closed) closed, \(.open) open)"
    ),
    "",
    "MONTHLY PR CREATION (last 24 months, for trend analysis)",
    (
        [.[][] | .createdAt[:7]] |
        group_by(.) | map({month: .[0], count: length}) |
        sort_by(.month) | .[-24:] |
        .[] | "  \(.month): \(.count)"
    ),
    "",
    "MERGE TIME DISTRIBUTION (merged PRs only)",
    (
        [.[][] | select(.mergedAt != null) |
            ((.mergedAt | fromdateiso8601) - (.createdAt | fromdateiso8601)) / 86400
        ] |
        if length == 0 then "  No merged PRs"
        else
            sort |
            . as $sorted |
            ($sorted | length) as $n |
            "  Median:  \($sorted[$n/2 | floor] | . * 10 | floor | . / 10) days",
            "  P90:     \($sorted[($n * 0.9) | floor] | . * 10 | floor | . / 10) days",
            "  P99:     \($sorted[($n * 0.99) | floor] | . * 10 | floor | . / 10) days",
            "  Max:     \($sorted[-1] | . * 10 | floor | . / 10) days",
            "  < 1 day: \([.[] | select(. < 1)] | length) PRs",
            "  1-7 d:   \([.[] | select(. >= 1 and . < 7)] | length) PRs",
            "  7-30 d:  \([.[] | select(. >= 7 and . < 30)] | length) PRs",
            "  30+ d:   \([.[] | select(. >= 30)] | length) PRs"
        end
    ),
    "",
    "PR SIZE DISTRIBUTION (by total lines changed = additions + deletions)",
    (
        [.[][] | (.additions // 0) + (.deletions // 0)] |
        "  XS (1-10 lines):     \([.[] | select(. >= 1 and . <= 10)] | length)",
        "  S  (11-100 lines):   \([.[] | select(. >= 11 and . <= 100)] | length)",
        "  M  (101-500 lines):  \([.[] | select(. >= 101 and . <= 500)] | length)",
        "  L  (501-1000 lines): \([.[] | select(. >= 501 and . <= 1000)] | length)",
        "  XL (1000+ lines):    \([.[] | select(. > 1000)] | length)"
    ),
    "",
    "DAY-OF-WEEK DISTRIBUTION (PR creation)",
    (
        [.[][] | .createdAt | fromdateiso8601 |
            # 0=Thu for epoch, adjust to get 0=Sun
            ((. / 86400 | floor) + 4) % 7
        ] |
        {
            "0": [.[] | select(. == 0)] | length,
            "1": [.[] | select(. == 1)] | length,
            "2": [.[] | select(. == 2)] | length,
            "3": [.[] | select(. == 3)] | length,
            "4": [.[] | select(. == 4)] | length,
            "5": [.[] | select(. == 5)] | length,
            "6": [.[] | select(. == 6)] | length
        } |
        "  Sun: \(."0")  Mon: \(."1")  Tue: \(."2")  Wed: \(."3")  Thu: \(."4")  Fri: \(."5")  Sat: \(."6")"
    ),
    "",
    "HOUR-OF-DAY DISTRIBUTION (PR creation, UTC)",
    (
        [.[][] | .createdAt[11:13] | tonumber] |
        group_by(.) | map({hour: .[0], count: length}) | sort_by(.hour) |
        map("\(.hour | tostring | if length < 2 then "0\(.)" else . end)h: \(.count)") |
        # Print 4 per line
        [range(0; length; 4) as $i | .[($i):($i+4)] | join("  ")] |
        .[] | "  \(.)"
    )
' "$OUTPUT_DIR/combined_prs.json" > "$OUTPUT_DIR/summary.txt" 2>/dev/null || {
    echo "  (Summary generation had issues with some stats — partial output written)"
}

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "  DONE!"
echo ""
echo "  Output files:"
echo "    Raw JSON per repo:  $RAW_DIR/<repo>.json"
echo "    Combined JSON:      $OUTPUT_DIR/combined_prs.json"
echo "    CSV (for analysis): $OUTPUT_DIR/combined_prs.csv"
echo "    Summary report:     $OUTPUT_DIR/summary.txt"
echo ""
echo "  To view the summary:"
echo "    cat $OUTPUT_DIR/summary.txt"
echo ""
echo "═══════════════════════════════════════════════════════════════"

# ═══════════════════════════════════════════════════════════════════════════════
# LIMITATIONS AND NOTES
# ═══════════════════════════════════════════════════════════════════════════════
#
# 1. API RATE LIMITS
#    - GitHub GraphQL API: 5,000 points/hour (authenticated)
#    - `gh pr list` uses ~1 point per page (100 PRs/page)
#    - A repo with 18,000 PRs needs ~180 requests = fine for rate limits
#    - With --detailed mode, each page may cost more due to nested queries
#    - If you hit rate limits, use --skip-existing to resume
#
# 2. ADDITIONS / DELETIONS
#    - These represent the FINAL diff of the PR (merged or at close time)
#    - They do NOT reflect intermediate commits, force-pushes, or review-driven changes
#    - Rebase-and-merge can report different line counts than squash-merge
#    - Very old PRs (pre-2015) may have null values
#
# 3. REVIEW DATA (--detailed mode only)
#    - `gh pr list` returns up to ~100 reviews/comments per PR
#    - PRs with 100+ reviews will have truncated review lists
#    - Review timestamps tell you WHEN reviews happened, not review turnaround
#    - "APPROVED" / "CHANGES_REQUESTED" reflects the latest review state
#    - `reviewDecision` is only set for PRs with branch protection rules
#
# 4. DRAFT PRS
#    - GitHub draft PRs were introduced in February 2019
#    - PRs created before that date always show isDraft=false
#
# 5. DELETED ACCOUNTS / GHOST USERS
#    - Deleted GitHub accounts appear as author: null or login: "ghost"
#    - Renamed accounts show current username, not historical
#    - Bot accounts (dependabot, etc.) are included — filter by is_bot or login pattern
#
# 6. REPOSITORY ACCESS
#    - Private repos require your gh token to have the `repo` scope
#    - Archived repos are included (PRs are read-only but still fetchable)
#    - Forked repos are excluded by default (use --include-forks)
#
# 7. SEARCH API vs LIST API
#    - This script uses `gh pr list` (GraphQL list API) NOT the search API
#    - The search API caps at 1,000 results per query
#    - The list API has no such cap but requires paginating all PRs
#    - Trade-off: we fetch ALL PRs then filter by date (may fetch some extra)
#
# 8. TIMING / PERFORMANCE
#    - ~100 PRs per API call, ~1-2 seconds per call
#    - Main Babylon.js repo (~18K PRs): expect 3-10 minutes in fast mode
#    - With --detailed: 2-5x slower due to nested queries
#    - Full org (all repos): expect 15-45 minutes total
#    - Use --skip-existing to resume after interruptions
#
# 9. CSV ENCODING
#    - PR titles are cleaned of newlines and unescaped quotes
#    - Label names are semicolon-separated within the labels column
#    - Dates are ISO 8601 format (UTC)
#
# 10. WHAT'S NOT CAPTURED
#    - Individual commit messages and SHAs (use --detailed + commits field)
#    - CI/CD check status details (use statusCheckRollup field)
#    - File-level change details (use files field — very slow for bulk)
#    - PR body/description text (very large, excluded to save space)
#    - Cross-references and linked issues
#    - Time-to-first-review (would need review timestamps analysis)
#    - Number of review rounds / back-and-forth cycles
#
# To get file-level details for specific PRs afterward:
#   gh pr view <number> -R BabylonJS/Babylon.js --json files
#
# To get commit details:
#   gh pr view <number> -R BabylonJS/Babylon.js --json commits
#
