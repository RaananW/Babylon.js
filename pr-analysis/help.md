# PR Analysis Scripts

Scripts for fetching and analyzing pull request data across the BabylonJS GitHub organization.

## Prerequisites

- **[GitHub CLI (`gh`)](https://cli.github.com/)** — authenticated (`gh auth login`)
- **[jq](https://jqlang.github.io/jq/)** — JSON processor

## Scripts

### 1. `analyze-org-prs.sh` — Fetch PR data

Fetches comprehensive PR data from all (or selected) repos in the BabylonJS org.

```bash
# Fetch all repos (can take a while for large orgs)
bash scripts/analyze-org-prs.sh

# Fetch specific repos only
bash scripts/analyze-org-prs.sh --repos "Babylon.js,BabylonNative,Documentation"

# Skip repos already fetched
bash scripts/analyze-org-prs.sh --skip-existing

# Custom date range
bash scripts/analyze-org-prs.sh --since 2024-01-01 --until 2025-01-01
```

**Options:**

| Flag                   | Description                                    | Default            |
| ---------------------- | ---------------------------------------------- | ------------------ |
| `-o, --org NAME`       | GitHub org                                     | `BabylonJS`        |
| `-d, --output-dir DIR` | Output directory                               | `./pr-analysis`    |
| `-s, --since DATE`     | Start date (ISO)                               | 7 years ago        |
| `-u, --until DATE`     | End date (ISO)                                 | today              |
| `-r, --repos REPOS`    | Comma-separated repo names                     | all non-fork repos |
| `--include-forks`      | Include forked repos                           | off                |
| `--detailed`           | Fetch reviews, comments, participants (slower) | off                |
| `--skip-existing`      | Skip repos whose output file already exists    | off                |
| `--update`             | Incremental: fetch only new PRs since last run | off                |

**Output files:**

| File                            | Description                          |
| ------------------------------- | ------------------------------------ |
| `pr-analysis/raw/<repo>.json`   | Raw PR data per repo                 |
| `pr-analysis/combined_prs.json` | All repos merged into one JSON array |
| `pr-analysis/combined_prs.csv`  | Flat CSV for Excel/Google Sheets     |
| `pr-analysis/summary.txt`       | High-level statistics                |

The CSV contains these columns: `repo`, `number`, `title`, `state`, `author`, `author_is_bot`, `created_at`, `updated_at`, `closed_at`, `merged_at`, `merged_by`, `days_to_close`, `days_to_merge`, `additions`, `deletions`, `total_lines_changed`, `changed_files`, `base_branch`, `head_branch`, `is_draft`, `review_decision`, `label_names`, `url`.

### 2. `compare-3mo.sh` — Period comparison (PR counts & contributors)

Compares recent activity (since Jan 1, 2026) vs the prior period. Shows per-repo and per-contributor PR counts, merge rates, and contributor flow (new/returning/inactive).

```bash
bash scripts/compare-3mo.sh
```

Output: `pr-analysis/comparison_recent.txt`

### 3. `compare-lines.sh` — Period comparison (lines of code)

Same period split, focused on lines of code: additions, deletions, net growth, and churn per contributor and per repo. Shows both monthly rates and per-PR averages.

```bash
bash scripts/compare-lines.sh
```

Output: `pr-analysis/comparison_lines.txt`

## Typical workflow

```bash
# 1. Fetch data (first time — takes ~30 min for large repos)
bash scripts/analyze-org-prs.sh --repos "Babylon.js,BabylonNative,Documentation"

# 2. Generate comparison reports
bash scripts/compare-3mo.sh
bash scripts/compare-lines.sh

# 3. Open the CSV in Excel for custom analysis
open pr-analysis/combined_prs.csv
```

To refresh data later, use `--skip-existing` to only fetch new repos, or `--update` to incrementally add new PRs to existing repos:

```bash
# Add new PRs since last fetch (fast — only fetches what's new)
bash scripts/analyze-org-prs.sh --repos "Babylon.js,BabylonNative,Documentation" --update

# Or to fully re-fetch a repo, delete its raw file first
rm pr-analysis/raw/Babylon.js.json
bash scripts/analyze-org-prs.sh --repos "Babylon.js"
```

## Notes

- All comparison scripts filter to **merged PRs only**.
- The `state` field values are: `OPEN`, `CLOSED`, `MERGED`.
- Monthly rates use 2.5 months for the recent period (Jan 1 – Mar 15, 2026) and 69 months for the prior period. Adjust the `RECENT_MO` and `OLDER_MO` variables in the scripts if your date range differs.
- GitHub rate limits: 5,000 requests/hour (REST) or 5,000 points/hour (GraphQL). Large repos use REST enrichment at ~0.3s per PR with automatic checkpointing.
