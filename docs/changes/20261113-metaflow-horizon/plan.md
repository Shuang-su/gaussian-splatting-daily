# Approved implementation plan

Approved by the user on 2026-11-13 in codex://threads/01a1d41b-a66c-7fe2-bfa0-9450ba431b60. This document records the accepted implementation order; docs/horizon-spec.md is the capability contract.

1. Isolate the reading-site branch and reconcile current remote research; preserve unrelated work and create local checkpoints. Root Prism disk is nearly full, so the implementation worktree and its .codex-work staging reside at /Users/shuangsu/Codex/metaflow-horizon.
2. Rename brand and repository to metaflow horizon / metaflow-horizon; preserve 高斯日报 as daily series. Add 日报/文章/专题/研究/应用 navigation, semantic app metadata and stable RSS GUIDs. Retain the existing reading interactions.
3. Adopt 少数派 content, writing and typography principles in docs/editorial-style.md, distinguish researched descriptions from actual tests, and stop using fixed paragraph/section quotas as quality proxies.
4. Audit all dates from 2026-09-18 through cutover; restore missing 2026-10-21—24; read Radiance Fields and linked original sources; preserve discovery and primary links, actual timestamps, gaps, candidate dispositions and old identities. Keep canonical bytes unchanged and use dated, hash-bound supplements.
5. Expand the 2026-11-13 SuperSplat/SOG report and independent explainer; restore Spirula and LichtFeld stories; verify published writer tags and distinguish affected early v3 assets from v2. Do not infer universal retraining or conversion.
6. Implement durable source registry, six-family checks, a seven-day overlap, event disposition validation, supplement provenance checks and meaningful tests. Review independent articles and weekly context against updated reports.
7. Build and verify a static Next.js export at /horizon, deploy to a dedicated Netlify site in the main site's team, and add one-hop routing before Metaflow SPA fallback. Freeze the live main-site deployment and reuse its assets, not the dirty/divergent workspace. Record preview/production IDs and rollback.
8. Rename existing GitHub repository while retaining its Issue/PR/history redirects. Update the original ChatGPT task at 08:00 Asia/Shanghai to produce source checks, research and reader editions, validate/merge and verify public deployment. Remove obsolete arXiv schedule only after the new manual end-to-end path succeeds; keep manual collection.
9. Validate Python, TypeScript, unit tests, static build, links, provenance, RSS identities, responsive navigation, search, article and app pages, deep links and 404; regress main Viewer/Editor/Director. Record manual versus scheduled runs separately. Final status stays observing until three real scheduled runs pass.

Defaults: no paid source services, no new domain, no unrelated production features, no fabricated tests or source coverage, no inaccessible material treated as no news. Important events must receive visible reader destinations or explicit evidence-backed disposition; exhaustive Internet coverage is not claimed.
