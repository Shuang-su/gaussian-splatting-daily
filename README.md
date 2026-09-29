# Gaussian Splatting Daily

A Git-backed daily feed for **3D Gaussian Splatting (3DGS)**, **4D Gaussian Splatting (4DGS)**, neural rendering, reconstruction, viewers and tooling.

## What this repository does

- Archives each logical day as `docs/daily/YYYY/MM/YYYY-MM-DD.md`.
- Uses GitHub Actions to ingest recent Gaussian Splatting research every day.
- Keeps source metadata deterministic and auditable.
- Opens a tracking Issue and a Pull Request for each Daily run.
- Never requires the website to be the source of truth: the site is rebuilt from `docs/`.
- Optionally enriches the Daily with OpenAI summaries when `OPENAI_API_KEY` is configured.

## Publication flow

```text
arXiv API
  -> normalize / deduplicate
  -> optional OpenAI editorial enrichment
  -> docs/daily/YYYY/MM/YYYY-MM-DD.md
  -> deterministic validation
  -> automation/daily/YYYY-MM-DD
  -> Daily Issue
  -> Pull Request
  -> review / merge
  -> site build
```

The automation intentionally does **not** push Daily content directly to `main`.

## Repository layout

```text
.github/
  workflows/
    daily-ingest.yml
    validate-content.yml
  ISSUE_TEMPLATE/
    correction.yml
  pull_request_template.md

docs/
  index.md
  architecture.md
  schema.md
  corrections.md
  daily/
    _template.md
    YYYY/MM/YYYY-MM-DD.md

data/
  sources.yml
  daily-index.json

state/
  checkpoint.json

scripts/
  generate_daily.py
  validate_daily.py
  build_index.py
```

## Daily schedule

The default schedule is **08:17 Asia/Tokyo**. It avoids the top of the hour and gives the upstream research feeds time to settle.

Manual runs can supply a logical date through `workflow_dispatch`.

## Required repository setting for automated PR creation

GitHub may block `GITHUB_TOKEN` from creating pull requests in a newly created repository. In:

`Settings -> Actions -> General -> Workflow permissions`

enable **Allow GitHub Actions to create and approve pull requests**, or add a fine-grained token / GitHub App token as the `GSD_BOT_TOKEN` repository secret.

The workflow prefers `GSD_BOT_TOKEN` when present and falls back to `GITHUB_TOKEN`.

## Optional OpenAI enrichment

Add `OPENAI_API_KEY` as a repository Actions secret. The generator uses the Responses API to produce a concise Chinese editorial overview and per-paper summaries from the supplied arXiv metadata/abstracts.

Optional repository variable:

```text
OPENAI_MODEL=gpt-5.6-luna
```

If no API key is configured, the Daily still succeeds and publishes deterministic source metadata without AI summaries.

## Data-source acknowledgement

Thank you to arXiv for use of its open access interoperability.

## Design direction

The long-term frontend is described in [docs/architecture.md](docs/architecture.md): a Radiance Fields-inspired research portal with Daily, Papers, Tools, Demos, Topics, Search and an optional interactive Gaussian Splat viewer.
