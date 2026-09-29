# Gaussian Splatting Daily Docs

This directory is the durable, human-readable content layer for the project.

## Entry points

- [Architecture](architecture.md)
- [Content schema](schema.md)
- [Corrections](corrections.md)
- [Daily archive](daily/)

## Invariants

- Daily content is stored under `docs/daily/YYYY/MM/YYYY-MM-DD.md`.
- Website code must treat these files as the source of truth.
- Generated indexes may be deleted and rebuilt.
- Corrections are explicit and reviewable.
