# 纠错记录

## 2026-09-30 — 09-18 / 09-19 的 KHR_gaussian_splatting 状态

- 追踪：[Issue #33](https://github.com/Shuang-su/gaussian-splatting-daily/issues/33)；与历史核验 PR 一并记录。
- 原文：09-18 及 09-19 曾称扩展处于 Release Candidate。09-20 已有人工纠错，但未同步纠错日志与前两日正文。
- 修正：官方 glTF 仓库 [2026-09-03 commit 81762cc](https://github.com/KhronosGroup/glTF/commit/81762cc328b160eafaa0d577dd547a998401ade9) 将该扩展标为 Complete / Ratified。它在前两日报告日期之前已完成此状态变化。
- 同步：09-18 / 09-19 正文开头增加明确纠错，保留历史判断和 18 日下午增量；09-20 已有纠错的内部引用恢复为官方 commit 链接。
- 影响：标准状态不是当天新发布；不据此声称所有工具已完整支持该扩展。

## 2026-09-30 — 历史来源补核与计数修正

- 追踪：[Issue #33](https://github.com/Shuang-su/gaussian-splatting-daily/issues/33)，随门户产品 PR 审查。
- 原统计 184 处只含通用占位，漏计 09-20 的两处具名待复核引用，已修正计数与页面提示。
- 依据 [SuperSplat Viewer 官方 PR #306](https://github.com/playcanvas/supersplat-viewer/pull/306) 和 [官方 v1.33.0 Release](https://github.com/playcanvas/supersplat-viewer/releases/tag/v1.33.0)，补齐 09-24 六处来源。保留历史报告时间、原分析和版本语境。
- 补核后仍有 180 处来源待核验，详见 [历史审计](history-audit.md)。未将原聊天链接冒充第一手来源。

## 2026-10-03 — Daily 2026-10-03

- Issue: #43
- PR: #44
- Entry: Gaussian-Splat-Lite v1.2.0 / 10 篇论文编辑摘要
- Change: `setCamera(camera)` 注册相机，`update()` 无参数；流式重试的 30 秒是等待间隔上限，并非总截止时间；随机采样控制 API 为 `autoAdvanceStochasticSample`。为已有的 10 篇实质摘要补齐 `**编辑摘要：**` 标签，保持严格编辑校验。
- Evidence: [v1.2.0 release](https://github.com/WilliamLiu-1997/Gaussian-Splat-Lite/releases/tag/v1.2.0)、[v1.2.0 SogStreamScheduler](https://github.com/WilliamLiu-1997/Gaussian-Splat-Lite/blob/v1.2.0/docs/SogStreamScheduler.md)

## 提交后续纠错

使用 [纠错 Issue](https://github.com/Shuang-su/gaussian-splatting-daily/issues/new?template=correction.yml)，提供当日日报、条目、原说法、修正和第一手来源。通过新 PR 修正正文并追加本日志，保留原归档上下文。
