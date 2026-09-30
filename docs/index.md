# Gaussian Splatting Daily Docs

This directory is the durable, human-readable content layer for the project.

## Entry points

- [Architecture](architecture.md)
- [Content schema](schema.md)
- [Corrections](corrections.md)
- [2026 年 9 月 18–30 日逐日日报](daily/2026/09/index.md)
- [历史论文采集汇编](research/2026-09-legacy-paper-collection.md)
- [Daily archive](daily/)

## Invariants

- Daily content is stored under `docs/daily/YYYY/MM/YYYY-MM-DD.md`.
- Website code must treat these files as the source of truth.
- Generated indexes may be deleted and rebuilt.
- Corrections are explicit and reviewable.
