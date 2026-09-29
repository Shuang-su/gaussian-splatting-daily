# Daily Content Schema

Schema version: **1**

## Canonical path

`docs/daily/YYYY/MM/YYYY-MM-DD.md`

The path date and the frontmatter `date` must match.

## Required frontmatter

| Field | Type | Meaning |
|---|---|---|
| `schema_version` | integer | Content contract version; currently `1` |
| `id` | string | Stable ID: `gsd-YYYY-MM-DD` |
| `date` | date string | Logical Daily date |
| `timezone` | string | Must be `Asia/Tokyo` in v1 |
| `generated_at` | ISO-8601 string | Generation timestamp |
| `status` | enum-like string | `draft`, `published`, `no-data`, or `corrected` |
| `title` | string | Human-readable title |
| `source_count` | integer | Number of newly archived source items |
| `ai_enrichment` | boolean | Whether AI editorial enrichment succeeded |
| `ai_model` | string | Model ID, or empty when AI was not used |

## Paper markers

Every archived arXiv paper must include exactly one marker:

```html
<!-- arxiv:2609.12345 -->
```

The version suffix is stripped before the marker is written so later revisions do not create duplicate papers.

## Required body sections

```markdown
# 今日概览

## 论文与研究

## 自动化说明
```

A `no-data` Daily is valid and intentionally distinguishes “the automation ran and found nothing new” from “the automation failed”.

## Corrections

After a Daily is merged, factual corrections should:

1. open a Correction Issue;
2. update the original Daily through a PR;
3. add an entry to `docs/corrections.md`;
4. preserve the original source/provenance context.
