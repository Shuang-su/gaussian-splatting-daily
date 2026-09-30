# 09-18 至 09-30 历史归档核验

核验基线：main `31ed3d0524d133e7cb2dece0d5e9be396ad12a89`（PR #32）；完整 09-30 正文来自 [PR #31](https://github.com/Shuang-su/gaussian-splatting-daily/pull/31)。本轮复用已有 13 个日报文件与追踪 Issue，不重新生成历史报告。

## 参考与方法

- [收集与呈现](https://chatgpt.com/share/6abb78fa-3d58-83ee-86e0-d4791dfc601c)：产品、归档与呈现要求。
- [每日深度情报原聊天](https://chatgpt.com/share/6abb77e3-2854-83ee-a59d-1b8d31259f88)：逐日读取 09-18 上午、下午增量及 09-19–29 日报，对照同日文件的栏目、主要事件、人工判断与来源。
- [继续设计开发](https://chatgpt.com/share/6abcd619-9ef4-83ee-a759-fa7f92fa582c)：09-30 编辑、任务配置与 PR #31 / #32 的上下文。

对公开聊天的中文正文去除显示控件和内部引用标签后，以连续 64 个汉字的指纹在同日期文件中匹配，辅助发现遗漏与错放。逐项检查未匹配片段：18 / 19 日为新增纠错说明及引用标题；20、23、24、25、26 日为公开来源链接标题和引用转换；29 日末尾为错误目标仓库的发布说明。**这种指纹不覆盖全部英文、数字、标点，也不是逐字一致性证明**；主事件、日期、栏目与剩余片段另做人工阅读比对。

09-29 原聊天曾尝试归档到 `gaussian-splatting-radar` 并报告 404，属于当时的发布状态，不是日报研究正文缺失。后来正确仓库已有 Issue #26 / PR #27 的归档，本轮保留这个可追踪差异。09-30 保留 PR #31 全部 13 栏、12 条 canonical arXiv 和原有论文图像。

## 日期、入口与标识

source_count 保持 schema v1 中“首次 canonical arXiv marker 数”的含义，不是全部来源链接数。首次 marker 不带 v 后缀；重复论文链接留在正文但不重复 marker。工具重点条目按仓库 + Release / PR / commit 去重。

| 日期 | 追踪 Issue | 已有归档 PR | arXiv marker | 待复核引用 | 中文指纹辅助匹配 |
|---|---|---|---:|---:|---|
| [2026-09-18](daily/2026/09/2026-09-18.md) | [#4](https://github.com/Shuang-su/gaussian-splatting-daily/issues/4) | [#5](https://github.com/Shuang-su/gaussian-splatting-daily/pull/5) | 3 | 28 | 45/46；42/44 |
| [2026-09-19](daily/2026/09/2026-09-19.md) | [#6](https://github.com/Shuang-su/gaussian-splatting-daily/issues/6) | [#7](https://github.com/Shuang-su/gaussian-splatting-daily/pull/7) | 4 | 29 | 53/54 |
| [2026-09-20](daily/2026/09/2026-09-20.md) | [#8](https://github.com/Shuang-su/gaussian-splatting-daily/issues/8) | [#9](https://github.com/Shuang-su/gaussian-splatting-daily/pull/9) | 0 | 29 | 44/48 |
| [2026-09-21](daily/2026/09/2026-09-21.md) | [#10](https://github.com/Shuang-su/gaussian-splatting-daily/issues/10) | [#11](https://github.com/Shuang-su/gaussian-splatting-daily/pull/11) | 0 | 17 | 47/47 |
| [2026-09-22](daily/2026/09/2026-09-22.md) | [#12](https://github.com/Shuang-su/gaussian-splatting-daily/issues/12) | [#13](https://github.com/Shuang-su/gaussian-splatting-daily/pull/13) | 4 | 23 | 51/51 |
| [2026-09-23](daily/2026/09/2026-09-23.md) | [#14](https://github.com/Shuang-su/gaussian-splatting-daily/issues/14) | [#15](https://github.com/Shuang-su/gaussian-splatting-daily/pull/15) | 4 | 31 | 56/57 |
| [2026-09-24](daily/2026/09/2026-09-24.md) | [#16](https://github.com/Shuang-su/gaussian-splatting-daily/issues/16) | [#17](https://github.com/Shuang-su/gaussian-splatting-daily/pull/17) | 6 | 23 | 60/61 |
| [2026-09-25](daily/2026/09/2026-09-25.md) | [#18](https://github.com/Shuang-su/gaussian-splatting-daily/issues/18) | [#19](https://github.com/Shuang-su/gaussian-splatting-daily/pull/19) | 1 | 0 | 64/65 |
| [2026-09-26](daily/2026/09/2026-09-26.md) | [#20](https://github.com/Shuang-su/gaussian-splatting-daily/issues/20) | [#21](https://github.com/Shuang-su/gaussian-splatting-daily/pull/21) | 4 | 0 | 47/48 |
| [2026-09-27](daily/2026/09/2026-09-27.md) | [#22](https://github.com/Shuang-su/gaussian-splatting-daily/issues/22) | [#23](https://github.com/Shuang-su/gaussian-splatting-daily/pull/23) | 0 | 0 | 64/64 |
| [2026-09-28](daily/2026/09/2026-09-28.md) | [#24](https://github.com/Shuang-su/gaussian-splatting-daily/issues/24) | [#25](https://github.com/Shuang-su/gaussian-splatting-daily/pull/25) | 0 | 0 | 67/67 |
| [2026-09-29](daily/2026/09/2026-09-29.md) | [#26](https://github.com/Shuang-su/gaussian-splatting-daily/issues/26) | [#27](https://github.com/Shuang-su/gaussian-splatting-daily/pull/27) | 4 | 0 | 51/53 |
| [2026-09-30](daily/2026/09/2026-09-30.md) | [#29](https://github.com/Shuang-su/gaussian-splatting-daily/issues/29) | [#30](https://github.com/Shuang-su/gaussian-splatting-daily/pull/30), [#31](https://github.com/Shuang-su/gaussian-splatting-daily/pull/31) | 12 | 0 | PR #31 正文及条目对照 |

09-18 上午正文、当日下午增量及既有人工分析均保留。月份入口、总入口、daily-index、portal-index 与 checkpoint 同步至 09-30；checkpoint 日期校准以已合并正文为依据，并不意味着之前已有网站部署。

## 纠错与未恢复来源

[纠错记录](corrections.md) 明确记录 KHR_gaussian_splatting 的 Complete / Ratified 状态，修正同步到 09-18 / 19 的开头和 09-20 的官方证据链接。其余无法恢复的聊天内部引用保留原位置和原聊天链接，不能当作已核实的一手来源。下面按日期、正文行号与邻近文字列出，便于后续逐条复核；行号对应本轮内容版本，后续编辑可能移动。

### 2026-09-30 云端补核

原统计的 184 处仅计算通用占位文字，另有 09-20 的 Niantic 与 B站两处具名待复核引用，合计原为 186 处。本次依据 [官方 PR #306](https://github.com/playcanvas/supersplat-viewer/pull/306) 与 [v1.33.0 Release](https://github.com/playcanvas/supersplat-viewer/releases/tag/v1.33.0)，恢复 09-24 的 6 处来源，尚余 180 处（178 通用、2 具名）。这表示来源链接仍待核验，不代表缺少 180 篇正文，也不表示其他内容已经逐事实重新验证。

恢复范围：1.33.0 发布于 2026-09-23 09:49:54 UTC；碰撞不再阻塞 reveal；单调 streaming progress 与去除重复预取；hasCollision / walkAllowed 变化事件；spawn search 的 8,120,601 → 7,153 probes；late collision 与临时 floor。保持原报告的历史时间窗口与分析，未用今天的版本状态替换历史状态。

### 2026-09-18

- [正文第 76 行](https://github.com/Shuang-su/gaussian-splatting-daily/blob/main/docs/daily/2026/09/2026-09-18.md#L76)：只有至少一盏灯真的需要更新 shadow，才开始共享 preparation；完全缓存的灯直接跳过全部 compute。
- [正文第 99 行](https://github.com/Shuang-su/gaussian-splatting-daily/blob/main/docs/daily/2026/09/2026-09-18.md#L99)：所以这是一个相当完整的调度修复。
- [正文第 119 行](https://github.com/Shuang-su/gaussian-splatting-daily/blob/main/docs/daily/2026/09/2026-09-18.md#L119)：`alejandro-garnung-ctic/WildGS-SLAM` 实际是 `GradientSpaces/WildGS-SLAM` 的 fork，原项目是 CVPR 2025。
- [正文第 121 行](https://github.com/Shuang-su/gaussian-splatting-daily/blob/main/docs/daily/2026/09/2026-09-18.md#L121)：`ckeisc/vkraygs` 则是 `facebookresearch/vkraygs` 的 fork，原项目是 CVPR 2025 Hardware-Rasterized Ray-Based Gaussian Splatting。
- [正文第 123 行](https://github.com/Shuang-su/gaussian-splatting-daily/blob/main/docs/daily/2026/09/2026-09-18.md#L123)：`EvanHon1818/RoboSimGS` 也是旧 `Maxwell-Zhao/RoboSimGS` 的 fork。
- [正文第 274 行](https://github.com/Shuang-su/gaussian-splatting-daily/blob/main/docs/daily/2026/09/2026-09-18.md#L274)：。
- [正文第 283 行](https://github.com/Shuang-su/gaussian-splatting-daily/blob/main/docs/daily/2026/09/2026-09-18.md#L283)：- 增加完整的 in-memory regression tests。
- [正文第 455 行](https://github.com/Shuang-su/gaussian-splatting-daily/blob/main/docs/daily/2026/09/2026-09-18.md#L455)：并且 motion fallback 也使用这些默认值。
- [正文第 843 行](https://github.com/Shuang-su/gaussian-splatting-daily/blob/main/docs/daily/2026/09/2026-09-18.md#L843)：Viewer 正式 Release 仍停在 **v1.31.2（9 月 9 日）**，所以 #301 依旧属于 `main` 能测、正式 npm/release 尚未独立发版的状态。
- [正文第 878 行](https://github.com/Shuang-su/gaussian-splatting-daily/blob/main/docs/daily/2026/09/2026-09-18.md#L878)： per-light/per-camera render data 记录请求，避免另外分配请求对象。**GSplatShadowRenderer 也会检查相机对应的 directional shadow pass 是否真的被调度，再决定是否进行 Gaussian compute culling。**
- [正文第 916 行](https://github.com/Shuang-su/gaussian-splatting-daily/blob/main/docs/daily/2026/09/2026-09-18.md#L916)：而不是 6 次重复决定/准备。测试覆盖 clustered / non-clustered、spot / omni、`THISFRAME`、disabled pass、lightmapper 等情况。
- [正文第 993 行](https://github.com/Shuang-su/gaussian-splatting-daily/blob/main/docs/daily/2026/09/2026-09-18.md#L993)：- 仓库没有声明 SPDX/license。
- [正文第 1027 行](https://github.com/Shuang-su/gaussian-splatting-daily/blob/main/docs/daily/2026/09/2026-09-18.md#L1027)：README 明确把它定位为 **real-to-sim-to-real / data-efficient VLA adaptation**。
- [正文第 1055 行](https://github.com/Shuang-su/gaussian-splatting-daily/blob/main/docs/daily/2026/09/2026-09-18.md#L1055)：- trajectory recording。
- [正文第 1094 行](https://github.com/Shuang-su/gaussian-splatting-daily/blob/main/docs/daily/2026/09/2026-09-18.md#L1094)：实时同步 camera pose。
- [正文第 1129 行](https://github.com/Shuang-su/gaussian-splatting-daily/blob/main/docs/daily/2026/09/2026-09-18.md#L1129)：同步的。
- [正文第 1146 行](https://github.com/Shuang-su/gaussian-splatting-daily/blob/main/docs/daily/2026/09/2026-09-18.md#L1146)：。
- [正文第 1171 行](https://github.com/Shuang-su/gaussian-splatting-daily/blob/main/docs/daily/2026/09/2026-09-18.md#L1171)：- teleoperation 3.2657 m/s³。
- [正文第 1209 行](https://github.com/Shuang-su/gaussian-splatting-daily/blob/main/docs/daily/2026/09/2026-09-18.md#L1209)：的 fork；原项目是 **CVPR 2026 4C4D: 4 Camera 4D Gaussian Splatting**，早在 4 月已经存在。
- [正文第 1230 行](https://github.com/Shuang-su/gaussian-splatting-daily/blob/main/docs/daily/2026/09/2026-09-18.md#L1230)：没有超过 #301 的新 commit，正式 Release 也仍是 v1.31.2。
- [正文第 1262 行](https://github.com/Shuang-su/gaussian-splatting-daily/blob/main/docs/daily/2026/09/2026-09-18.md#L1262)：因为 Gaussian 本身具有 opacity，不应该因为材质是默认材质就被错误走 opaque 路径。
- [正文第 1285 行](https://github.com/Shuang-su/gaussian-splatting-daily/blob/main/docs/daily/2026/09/2026-09-18.md#L1285)：shader quad 的顶点 1/2 根据 winding 正确翻转，而 centroid normal 不再错误随 quad winding 取反。
- [正文第 1322 行](https://github.com/Shuang-su/gaussian-splatting-daily/blob/main/docs/daily/2026/09/2026-09-18.md#L1322)：时重建。
- [正文第 1347 行](https://github.com/Shuang-su/gaussian-splatting-daily/blob/main/docs/daily/2026/09/2026-09-18.md#L1347)：> 如果回收站操作不可用，必须显示永久删除警告，不能静默删除。
- [正文第 1396 行](https://github.com/Shuang-su/gaussian-splatting-daily/blob/main/docs/daily/2026/09/2026-09-18.md#L1396)：同时 `PortalAccountService` 正式提供公开 `busy` property，而不是 GallerySync 偷看内部 worker thread。
- [正文第 1421 行](https://github.com/Shuang-su/gaussian-splatting-daily/blob/main/docs/daily/2026/09/2026-09-18.md#L1421)：入口。
- [正文第 1574 行](https://github.com/Shuang-su/gaussian-splatting-daily/blob/main/docs/daily/2026/09/2026-09-18.md#L1574)：目前没有给 arXiv ID。
- [正文第 1722 行](https://github.com/Shuang-su/gaussian-splatting-daily/blob/main/docs/daily/2026/09/2026-09-18.md#L1722)：但**不要直接复制代码进项目**，因为当前仓库没有明确许可证。

### 2026-09-19

- [正文第 50 行](https://github.com/Shuang-su/gaussian-splatting-daily/blob/main/docs/daily/2026/09/2026-09-19.md#L50)：最新正式 SuperSplat **仍然是 v3.3.0**，9 月 14 日发布，所以今天没有新的 Editor Release。
- [正文第 104 行](https://github.com/Shuang-su/gaussian-splatting-daily/blob/main/docs/daily/2026/09/2026-09-19.md#L104)：而且不是“sort dispatch 数量减少”，而是只使用 stochastic view 时，**sorter 连对象都不分配**；以后切回 sorted/pick 才 lazy-create。
- [正文第 141 行](https://github.com/Shuang-su/gaussian-splatting-daily/blob/main/docs/daily/2026/09/2026-09-19.md#L141)：尤其值得测试。
- [正文第 184 行](https://github.com/Shuang-su/gaussian-splatting-daily/blob/main/docs/daily/2026/09/2026-09-19.md#L184)：等选择。
- [正文第 220 行](https://github.com/Shuang-su/gaussian-splatting-daily/blob/main/docs/daily/2026/09/2026-09-19.md#L220)：而不是只在 transparent overlay 里画。
- [正文第 252 行](https://github.com/Shuang-su/gaussian-splatting-daily/blob/main/docs/daily/2026/09/2026-09-19.md#L252)：这对 Editor 和 Metaflow POI/picking 都非常重要。
- [正文第 330 行](https://github.com/Shuang-su/gaussian-splatting-daily/blob/main/docs/daily/2026/09/2026-09-19.md#L330)：即使应用明明已经打开 `withCredentials`，还是失败。
- [正文第 342 行](https://github.com/Shuang-su/gaussian-splatting-daily/blob/main/docs/daily/2026/09/2026-09-19.md#L342)：。
- [正文第 384 行](https://github.com/Shuang-su/gaussian-splatting-daily/blob/main/docs/daily/2026/09/2026-09-19.md#L384)：第三条尤其重要，因为它不是另一个“行业私有格式”，而是 OpenUSD 自己的 GS schema。
- [正文第 479 行](https://github.com/Shuang-su/gaussian-splatting-daily/blob/main/docs/daily/2026/09/2026-09-19.md#L479)：读取时统一转换成 Blender 内部 full-float geometry attribute。
- [正文第 596 行](https://github.com/Shuang-su/gaussian-splatting-daily/blob/main/docs/daily/2026/09/2026-09-19.md#L596)：。
- [正文第 691 行](https://github.com/Shuang-su/gaussian-splatting-daily/blob/main/docs/daily/2026/09/2026-09-19.md#L691)：。
- [正文第 722 行](https://github.com/Shuang-su/gaussian-splatting-daily/blob/main/docs/daily/2026/09/2026-09-19.md#L722)：该段原聊天内部引用
- [正文第 742 行](https://github.com/Shuang-su/gaussian-splatting-daily/blob/main/docs/daily/2026/09/2026-09-19.md#L742)：强制降低 budget 做测试。
- [正文第 786 行](https://github.com/Shuang-su/gaussian-splatting-daily/blob/main/docs/daily/2026/09/2026-09-19.md#L786)：因为 GUT rasterizer 根本没写 `_max_screen_share`。
- [正文第 831 行](https://github.com/Shuang-su/gaussian-splatting-daily/blob/main/docs/daily/2026/09/2026-09-19.md#L831)：。
- [正文第 863 行](https://github.com/Shuang-su/gaussian-splatting-daily/blob/main/docs/daily/2026/09/2026-09-19.md#L863)：。
- [正文第 875 行](https://github.com/Shuang-su/gaussian-splatting-daily/blob/main/docs/daily/2026/09/2026-09-19.md#L875)：并且这些变化都在作者测得的重复波动范围内。
- [正文第 895 行](https://github.com/Shuang-su/gaussian-splatting-daily/blob/main/docs/daily/2026/09/2026-09-19.md#L895)：**2026-09-18 05:10 UTC**。
- [正文第 903 行](https://github.com/Shuang-su/gaussian-splatting-daily/blob/main/docs/daily/2026/09/2026-09-19.md#L903)：**2026-09-18 11:45 UTC**。
- [正文第 909 行](https://github.com/Shuang-su/gaussian-splatting-daily/blob/main/docs/daily/2026/09/2026-09-19.md#L909)：- 最初由 NVIDIA High-Fidelity Physics Research Group / Spatial Intelligence Lab 开发。
- [正文第 939 行](https://github.com/Shuang-su/gaussian-splatting-daily/blob/main/docs/daily/2026/09/2026-09-19.md#L939)：。
- [正文第 951 行](https://github.com/Shuang-su/gaussian-splatting-daily/blob/main/docs/daily/2026/09/2026-09-19.md#L951)：仍留在 `fvdb-core`。
- [正文第 997 行](https://github.com/Shuang-su/gaussian-splatting-daily/blob/main/docs/daily/2026/09/2026-09-19.md#L997)：也就是说 Viewer 不再直接依赖 Reality Capture model object。
- [正文第 1016 行](https://github.com/Shuang-su/gaussian-splatting-daily/blob/main/docs/daily/2026/09/2026-09-19.md#L1016)：该段原聊天内部引用
- [正文第 1029 行](https://github.com/Shuang-su/gaussian-splatting-daily/blob/main/docs/daily/2026/09/2026-09-19.md#L1029)：该段原聊天内部引用
- [正文第 1378 行](https://github.com/Shuang-su/gaussian-splatting-daily/blob/main/docs/daily/2026/09/2026-09-19.md#L1378)：该段原聊天内部引用
- [正文第 1425 行](https://github.com/Shuang-su/gaussian-splatting-daily/blob/main/docs/daily/2026/09/2026-09-19.md#L1425)：的一体 toolbox。

### 2026-09-20

- [正文第 68 行](https://github.com/Shuang-su/gaussian-splatting-daily/blob/main/docs/daily/2026/09/2026-09-20.md#L68)：但当时宿主能稳定操作的公开 API 还比较有限。#302 把 Viewer 内置 UI 使用的控制逻辑与宿主 API **统一到同一套公开接口**。内置按钮不再是一套私有逻辑、宿主再另外 hack 一套；宿主调用 API 后，内置 timeline/button 状态也会同步。
- [正文第 93 行](https://github.com/Shuang-su/gaussian-splatting-daily/blob/main/docs/daily/2026/09/2026-09-20.md#L93)：并直接暴露只读 annotation 数据，以及 `state/events`。
- [正文第 123 行](https://github.com/Shuang-su/gaussian-splatting-daily/blob/main/docs/daily/2026/09/2026-09-20.md#L123)：尤其 `setMoveInput(x,z)` 会走正常 fly/walk/collision 路径，而不是让外部 UI 自己再实现移动逻辑；annotation selection 也直接走 authored camera transition。
- [正文第 147 行](https://github.com/Shuang-su/gaussian-splatting-daily/blob/main/docs/daily/2026/09/2026-09-20.md#L147)：处理。
- [正文第 173 行](https://github.com/Shuang-su/gaussian-splatting-daily/blob/main/docs/daily/2026/09/2026-09-20.md#L173)：仍需要真实设备验证。
- [正文第 197 行](https://github.com/Shuang-su/gaussian-splatting-daily/blob/main/docs/daily/2026/09/2026-09-20.md#L197)：默认 **关闭**，目前只支持 COLMAP data。
- [正文第 237 行](https://github.com/Shuang-su/gaussian-splatting-daily/blob/main/docs/daily/2026/09/2026-09-20.md#L237)：gsplat 当前仓库是 **Apache-2.0**，约 5.7k stars。
- [正文第 287 行](https://github.com/Shuang-su/gaussian-splatting-daily/blob/main/docs/daily/2026/09/2026-09-20.md#L287)：。
- [正文第 313 行](https://github.com/Shuang-su/gaussian-splatting-daily/blob/main/docs/daily/2026/09/2026-09-20.md#L313)：默认 30k steps 理论上明显有摊销空间，但**作者并没有给 30k 完整 wall-time benchmark**。
- [正文第 346 行](https://github.com/Shuang-su/gaussian-splatting-daily/blob/main/docs/daily/2026/09/2026-09-20.md#L346)：。
- [正文第 365 行](https://github.com/Shuang-su/gaussian-splatting-daily/blob/main/docs/daily/2026/09/2026-09-20.md#L365)：继续从 step 0 训练。
- [正文第 416 行](https://github.com/Shuang-su/gaussian-splatting-daily/blob/main/docs/daily/2026/09/2026-09-20.md#L416)：。
- [正文第 430 行](https://github.com/Shuang-su/gaussian-splatting-daily/blob/main/docs/daily/2026/09/2026-09-20.md#L430)：否则直接 warm start 可能把两个坐标系叠错。
- [正文第 440 行](https://github.com/Shuang-su/gaussian-splatting-daily/blob/main/docs/daily/2026/09/2026-09-20.md#L440)：- 自带 SfM、视频抽帧、masking、360/equirectangular 等流程。
- [正文第 448 行](https://github.com/Shuang-su/gaussian-splatting-daily/blob/main/docs/daily/2026/09/2026-09-20.md#L448)：**master 可测，尚未进入正式 binary release。**
- [正文第 512 行](https://github.com/Shuang-su/gaussian-splatting-daily/blob/main/docs/daily/2026/09/2026-09-20.md#L512)：。
- [正文第 542 行](https://github.com/Shuang-su/gaussian-splatting-daily/blob/main/docs/daily/2026/09/2026-09-20.md#L542)：。
- [正文第 576 行](https://github.com/Shuang-su/gaussian-splatting-daily/blob/main/docs/daily/2026/09/2026-09-20.md#L576)：而不会边 autosave 边把它当垃圾清掉。
- [正文第 614 行](https://github.com/Shuang-su/gaussian-splatting-daily/blob/main/docs/daily/2026/09/2026-09-20.md#L614)：。
- [正文第 644 行](https://github.com/Shuang-su/gaussian-splatting-daily/blob/main/docs/daily/2026/09/2026-09-20.md#L644)：并加入 Khronos 已 ratified extension registry。
- [正文第 677 行](https://github.com/Shuang-su/gaussian-splatting-daily/blob/main/docs/daily/2026/09/2026-09-20.md#L677)：。
- [正文第 709 行](https://github.com/Shuang-su/gaussian-splatting-daily/blob/main/docs/daily/2026/09/2026-09-20.md#L709)：Rotation 也按 glTF quaternion 约定；SH degree 0 必须存在，基础 extension 定义到 degree 3。
- [正文第 745 行](https://github.com/Shuang-su/gaussian-splatting-daily/blob/main/docs/daily/2026/09/2026-09-20.md#L745)：- `3dgs_ply2gltf`。
- [正文第 786 行](https://github.com/Shuang-su/gaussian-splatting-daily/blob/main/docs/daily/2026/09/2026-09-20.md#L786)：当 B200 这种 GPU 把 raster 时间压到个位数毫秒后，普通 PNG decode 已经能成为每 step 的主要组成部分。#1062 正是这种“非 CUDA kernel”优化开始变得重要的例子。
- [正文第 900 行](https://github.com/Shuang-su/gaussian-splatting-daily/blob/main/docs/daily/2026/09/2026-09-20.md#L900)：Niantic Spatial 官方 Gaussian Splat Relighting 介绍（原始引用待复核）
- [正文第 912 行](https://github.com/Shuang-su/gaussian-splatting-daily/blob/main/docs/daily/2026/09/2026-09-20.md#L912)：**2026-09-18 13:57 UTC**。
- [正文第 921 行](https://github.com/Shuang-su/gaussian-splatting-daily/blob/main/docs/daily/2026/09/2026-09-20.md#L921)：- streaming compound compact 后 static GS part 消失。
- [正文第 1041 行](https://github.com/Shuang-su/gaussian-splatting-daily/blob/main/docs/daily/2026/09/2026-09-20.md#L1041)：B站：知天下全量上线 3DGS 作品 XR 体验（原始引用待复核）

### 2026-09-21

- [正文第 103 行](https://github.com/Shuang-su/gaussian-splatting-daily/blob/main/docs/daily/2026/09/2026-09-21.md#L103)：正式构建。
- [正文第 107 行](https://github.com/Shuang-su/gaussian-splatting-daily/blob/main/docs/daily/2026/09/2026-09-21.md#L107)：许可证是 **GPL-3.0**。
- [正文第 164 行](https://github.com/Shuang-su/gaussian-splatting-daily/blob/main/docs/daily/2026/09/2026-09-21.md#L164)：随后又继续补 UI/UX。
- [正文第 228 行](https://github.com/Shuang-su/gaussian-splatting-daily/blob/main/docs/daily/2026/09/2026-09-21.md#L228)：这其实和 Blender / Photoshop 的编辑器架构非常接近。
- [正文第 255 行](https://github.com/Shuang-su/gaussian-splatting-daily/blob/main/docs/daily/2026/09/2026-09-21.md#L255)：。
- [正文第 316 行](https://github.com/Shuang-su/gaussian-splatting-daily/blob/main/docs/daily/2026/09/2026-09-21.md#L316)：。
- [正文第 342 行](https://github.com/Shuang-su/gaussian-splatting-daily/blob/main/docs/daily/2026/09/2026-09-21.md#L342)：。
- [正文第 436 行](https://github.com/Shuang-su/gaussian-splatting-daily/blob/main/docs/daily/2026/09/2026-09-21.md#L436)：该段原聊天内部引用
- [正文第 516 行](https://github.com/Shuang-su/gaussian-splatting-daily/blob/main/docs/daily/2026/09/2026-09-21.md#L516)：一遍。
- [正文第 536 行](https://github.com/Shuang-su/gaussian-splatting-daily/blob/main/docs/daily/2026/09/2026-09-21.md#L536)：花在完整 dataset preprocessing 上。
- [正文第 649 行](https://github.com/Shuang-su/gaussian-splatting-daily/blob/main/docs/daily/2026/09/2026-09-21.md#L649)：不重新编码，不保存 unrelated dirty edits。
- [正文第 667 行](https://github.com/Shuang-su/gaussian-splatting-daily/blob/main/docs/daily/2026/09/2026-09-21.md#L667)：而不是复制/重写 646 MB。
- [正文第 684 行](https://github.com/Shuang-su/gaussian-splatting-daily/blob/main/docs/daily/2026/09/2026-09-21.md#L684)：做当前 generation 身份校验。
- [正文第 726 行](https://github.com/Shuang-su/gaussian-splatting-daily/blob/main/docs/daily/2026/09/2026-09-21.md#L726)：。
- [正文第 1137 行](https://github.com/Shuang-su/gaussian-splatting-daily/blob/main/docs/daily/2026/09/2026-09-21.md#L1137)：但我们应该确认自己的大场景 dataset 是否也有类似收益。
- [正文第 1185 行](https://github.com/Shuang-su/gaussian-splatting-daily/blob/main/docs/daily/2026/09/2026-09-21.md#L1185)：这里更值得学习的是**架构**，不是直接把代码移进 Metaflow——Spirula 是 GPL-3.0。

### 2026-09-22

- [正文第 54 行](https://github.com/Shuang-su/gaussian-splatting-daily/blob/main/docs/daily/2026/09/2026-09-22.md#L54)：- dependency 更新。
- [正文第 98 行](https://github.com/Shuang-su/gaussian-splatting-daily/blob/main/docs/daily/2026/09/2026-09-22.md#L98)：而且明确支持 `ui:false`：宿主可以完全自己做 UI，仍然使用 Viewer 的相机、碰撞、annotation、XR 和移动系统。
- [正文第 108 行](https://github.com/Shuang-su/gaussian-splatting-daily/blob/main/docs/daily/2026/09/2026-09-22.md#L108)：。
- [正文第 120 行](https://github.com/Shuang-su/gaussian-splatting-daily/blob/main/docs/daily/2026/09/2026-09-22.md#L120)：。
- [正文第 165 行](https://github.com/Shuang-su/gaussian-splatting-daily/blob/main/docs/daily/2026/09/2026-09-22.md#L165)：- **#322 aperture-sampled DOF / linear-light accumulation**。
- [正文第 217 行](https://github.com/Shuang-su/gaussian-splatting-daily/blob/main/docs/daily/2026/09/2026-09-22.md#L217)：。PR 明确说明会**跨帧复用 GPU-resident scene data**，大场景则保留 streaming fallback，并通过 worker 做 sequence encoding。
- [正文第 261 行](https://github.com/Shuang-su/gaussian-splatting-daily/blob/main/docs/daily/2026/09/2026-09-22.md#L261)：所以如果 Metaflow 后续直接作为 library 使用，而不是只跑 CLI，需要注意这个 API breaking change。
- [正文第 305 行](https://github.com/Shuang-su/gaussian-splatting-daily/blob/main/docs/daily/2026/09/2026-09-22.md#L305)：强失焦可以提高到 64 等。
- [正文第 343 行](https://github.com/Shuang-su/gaussian-splatting-daily/blob/main/docs/daily/2026/09/2026-09-22.md#L343)：#322 的验证覆盖了 840 tests；维护者也明确说明 NVIDIA allocation 行为目前是模拟覆盖，而不是此次 PR 中真实 NVIDIA hardware run。
- [正文第 345 行](https://github.com/Shuang-su/gaussian-splatting-daily/blob/main/docs/daily/2026/09/2026-09-22.md#L345)：SplatTransform `v3.5.1` 为 **MIT**，Node 要求现为 **>=22**，开发依赖已经同步 Viewer 1.32.0 / PlayCanvas 2.22.3。
- [正文第 357 行](https://github.com/Shuang-su/gaussian-splatting-daily/blob/main/docs/daily/2026/09/2026-09-22.md#L357)：正式带入 Release。
- [正文第 457 行](https://github.com/Shuang-su/gaussian-splatting-daily/blob/main/docs/daily/2026/09/2026-09-22.md#L457)：但改动范围已经明显超出一个简单 screenshot 按钮。
- [正文第 491 行](https://github.com/Shuang-su/gaussian-splatting-daily/blob/main/docs/daily/2026/09/2026-09-22.md#L491)：ss 争用 worker 的 latest-wins slot，可能让 preview 停止、export 卡在第一帧或 cancel 后卡 0 帧；现在改为**每 worker 一次一个 pass、60 秒 timeout、cancel 时 abandon in-flight request**。
- [正文第 536 行](https://github.com/Shuang-su/gaussian-splatting-daily/blob/main/docs/daily/2026/09/2026-09-22.md#L536)：相关的 lossless WebP 编码，使“更快生成 vs 更小输出”变成明确的 CLI 参数。
- [正文第 548 行](https://github.com/Shuang-su/gaussian-splatting-daily/blob/main/docs/daily/2026/09/2026-09-22.md#L548)：**Keep training initialization aligned when centering datasets (#2260)**。
- [正文第 599 行](https://github.com/Shuang-su/gaussian-splatting-daily/blob/main/docs/daily/2026/09/2026-09-22.md#L599)：统一减去**dataset 自己的 centralization origin**。
- [正文第 626 行](https://github.com/Shuang-su/gaussian-splatting-daily/blob/main/docs/daily/2026/09/2026-09-22.md#L626)：**2026-09-22 05:06 北京时间左右**。
- [正文第 659 行](https://github.com/Shuang-su/gaussian-splatting-daily/blob/main/docs/daily/2026/09/2026-09-22.md#L659)：> 即使 crop box 是空的，prepare training 也仍保留全部 8 个 seed。
- [正文第 734 行](https://github.com/Shuang-su/gaussian-splatting-daily/blob/main/docs/daily/2026/09/2026-09-22.md#L734)：。
- [正文第 742 行](https://github.com/Shuang-su/gaussian-splatting-daily/blob/main/docs/daily/2026/09/2026-09-22.md#L742)：- 无正式 Release。
- [正文第 810 行](https://github.com/Shuang-su/gaussian-splatting-daily/blob/main/docs/daily/2026/09/2026-09-22.md#L810)：`nerfstudio-project/gsplat`。
- [正文第 838 行](https://github.com/Shuang-su/gaussian-splatting-daily/blob/main/docs/daily/2026/09/2026-09-22.md#L838)：也就是当前 nerfstudio gsplat 上游本身的 commit。
- [正文第 844 行](https://github.com/Shuang-su/gaussian-splatting-daily/blob/main/docs/daily/2026/09/2026-09-22.md#L844)：不是 ROCm port。

### 2026-09-23

- [正文第 95 行](https://github.com/Shuang-su/gaussian-splatting-daily/blob/main/docs/daily/2026/09/2026-09-23.md#L95)：而不是先构造单独 `x/y/z` 表再随机读取源文件。
- [正文第 118 行](https://github.com/Shuang-su/gaussian-splatting-daily/blob/main/docs/daily/2026/09/2026-09-23.md#L118)：**2.4 s → 0.5 s**。
- [正文第 138 行](https://github.com/Shuang-su/gaussian-splatting-daily/blob/main/docs/daily/2026/09/2026-09-23.md#L138)：理论上会更受益于“读取量减半”。
- [正文第 152 行](https://github.com/Shuang-su/gaussian-splatting-daily/blob/main/docs/daily/2026/09/2026-09-23.md#L152)：现在不再维护静态拷贝，而是在 build 时从当前安装的 splat-transform package 复制匹配的 WASM。
- [正文第 164 行](https://github.com/Shuang-su/gaussian-splatting-daily/blob/main/docs/daily/2026/09/2026-09-23.md#L164)：该段原聊天内部引用
- [正文第 177 行](https://github.com/Shuang-su/gaussian-splatting-daily/blob/main/docs/daily/2026/09/2026-09-23.md#L177)：- #327 exported Morton APIs。
- [正文第 200 行](https://github.com/Shuang-su/gaussian-splatting-daily/blob/main/docs/daily/2026/09/2026-09-23.md#L200)：输出经过 `cmp` 验证为 byte-identical。
- [正文第 244 行](https://github.com/Shuang-su/gaussian-splatting-daily/blob/main/docs/daily/2026/09/2026-09-23.md#L244)：。
- [正文第 264 行](https://github.com/Shuang-su/gaussian-splatting-daily/blob/main/docs/daily/2026/09/2026-09-23.md#L264)：并且顺序 identical。
- [正文第 275 行](https://github.com/Shuang-su/gaussian-splatting-daily/blob/main/docs/daily/2026/09/2026-09-23.md#L275)：维护者也明确说明：单个 SOG 的现实规模通常约 1–2M Gaussian，更大的资产应该走 LOD writer 分成小 unit。
- [正文第 314 行](https://github.com/Shuang-su/gaussian-splatting-daily/blob/main/docs/daily/2026/09/2026-09-23.md#L314)：没有 `up` 就回退到全局 `--camera-up`。
- [正文第 320 行](https://github.com/Shuang-su/gaussian-splatting-daily/blob/main/docs/daily/2026/09/2026-09-23.md#L320)：因此只有自定义 track JSON 能完整利用这项能力；要让 Editor 直接 author roll，还需要未来修改 Editor/Viewer animation schema。
- [正文第 406 行](https://github.com/Shuang-su/gaussian-splatting-daily/blob/main/docs/daily/2026/09/2026-09-23.md#L406)：当前 GitHub Editor 已到 **v2.32.8**。
- [正文第 444 行](https://github.com/Shuang-su/gaussian-splatting-daily/blob/main/docs/daily/2026/09/2026-09-23.md#L444)：。
- [正文第 451 行](https://github.com/Shuang-su/gaussian-splatting-daily/blob/main/docs/daily/2026/09/2026-09-23.md#L451)：- uncaptured error listener 会正确解除，避免共享 device 长期积累 listener。
- [正文第 517 行](https://github.com/Shuang-su/gaussian-splatting-daily/blob/main/docs/daily/2026/09/2026-09-23.md#L517)：- 项目自称 RAL 2026。
- [正文第 558 行](https://github.com/Shuang-su/gaussian-splatting-daily/blob/main/docs/daily/2026/09/2026-09-23.md#L558)：- Hierarchical Localization。
- [正文第 570 行](https://github.com/Shuang-su/gaussian-splatting-daily/blob/main/docs/daily/2026/09/2026-09-23.md#L570)：。
- [正文第 627 行](https://github.com/Shuang-su/gaussian-splatting-daily/blob/main/docs/daily/2026/09/2026-09-23.md#L627)：- `simple-knn`。
- [正文第 643 行](https://github.com/Shuang-su/gaussian-splatting-daily/blob/main/docs/daily/2026/09/2026-09-23.md#L643)：等真正存在明显温度变化的场景。
- [正文第 649 行](https://github.com/Shuang-su/gaussian-splatting-daily/blob/main/docs/daily/2026/09/2026-09-23.md#L649)：- RGB / thermal 都 resize 到 **320×240**。
- [正文第 659 行](https://github.com/Shuang-su/gaussian-splatting-daily/blob/main/docs/daily/2026/09/2026-09-23.md#L659)：并继承 INRIA 3DGS 的非商业限制。
- [正文第 707 行](https://github.com/Shuang-su/gaussian-splatting-daily/blob/main/docs/daily/2026/09/2026-09-23.md#L707)：- VRAM。
- [正文第 723 行](https://github.com/Shuang-su/gaussian-splatting-daily/blob/main/docs/daily/2026/09/2026-09-23.md#L723)：该段原聊天内部引用
- [正文第 769 行](https://github.com/Shuang-su/gaussian-splatting-daily/blob/main/docs/daily/2026/09/2026-09-23.md#L769)：。
- [正文第 790 行](https://github.com/Shuang-su/gaussian-splatting-daily/blob/main/docs/daily/2026/09/2026-09-23.md#L790)：该段原聊天内部引用
- [正文第 854 行](https://github.com/Shuang-su/gaussian-splatting-daily/blob/main/docs/daily/2026/09/2026-09-23.md#L854)：再次明显提速，并给 17.5M 级 Morton sort 提供线性 radix 路径。
- [正文第 894 行](https://github.com/Shuang-su/gaussian-splatting-daily/blob/main/docs/daily/2026/09/2026-09-23.md#L894)：。
- [正文第 923 行](https://github.com/Shuang-su/gaussian-splatting-daily/blob/main/docs/daily/2026/09/2026-09-23.md#L923)：。
- [正文第 1120 行](https://github.com/Shuang-su/gaussian-splatting-daily/blob/main/docs/daily/2026/09/2026-09-23.md#L1120)：DTG 已有完整训练、渲染和 evaluation script。
- [正文第 1122 行](https://github.com/Shuang-su/gaussian-splatting-daily/blob/main/docs/daily/2026/09/2026-09-23.md#L1122)：BayesianGS-SLAM 已有 Conda + CUDA third-party build + `run_slam.py`。

### 2026-09-24

- [正文第 195 行](https://github.com/Shuang-su/gaussian-splatting-daily/blob/main/docs/daily/2026/09/2026-09-24.md#L195)：连续正式发布。
- [正文第 205 行](https://github.com/Shuang-su/gaussian-splatting-daily/blob/main/docs/daily/2026/09/2026-09-24.md#L205)：。
- [正文第 258 行](https://github.com/Shuang-su/gaussian-splatting-daily/blob/main/docs/daily/2026/09/2026-09-24.md#L258)：而且 streamed SOG 新细节到达后，occlusion test 会重新跑。
- [正文第 277 行](https://github.com/Shuang-su/gaussian-splatting-daily/blob/main/docs/daily/2026/09/2026-09-24.md#L277)：该段原聊天内部引用
- [正文第 314 行](https://github.com/Shuang-su/gaussian-splatting-daily/blob/main/docs/daily/2026/09/2026-09-24.md#L314)：该段原聊天内部引用
- [正文第 337 行](https://github.com/Shuang-su/gaussian-splatting-daily/blob/main/docs/daily/2026/09/2026-09-24.md#L337)：同步。
- [正文第 375 行](https://github.com/Shuang-su/gaussian-splatting-daily/blob/main/docs/daily/2026/09/2026-09-24.md#L375)：也就是 camera-relative precision。
- [正文第 394 行](https://github.com/Shuang-su/gaussian-splatting-daily/blob/main/docs/daily/2026/09/2026-09-24.md#L394)：都重写了相应 fraction 逻辑。
- [正文第 437 行](https://github.com/Shuang-su/gaussian-splatting-daily/blob/main/docs/daily/2026/09/2026-09-24.md#L437)：现在 covariance Jacobian 保留 projection scale 的符号。
- [正文第 479 行](https://github.com/Shuang-su/gaussian-splatting-daily/blob/main/docs/daily/2026/09/2026-09-24.md#L479)：uniform，而不是猜 matrix sign。
- [正文第 513 行](https://github.com/Shuang-su/gaussian-splatting-daily/blob/main/docs/daily/2026/09/2026-09-24.md#L513)：。
- [正文第 521 行](https://github.com/Shuang-su/gaussian-splatting-daily/blob/main/docs/daily/2026/09/2026-09-24.md#L521)：。
- [正文第 554 行](https://github.com/Shuang-su/gaussian-splatting-daily/blob/main/docs/daily/2026/09/2026-09-24.md#L554)：。
- [正文第 575 行](https://github.com/Shuang-su/gaussian-splatting-daily/blob/main/docs/daily/2026/09/2026-09-24.md#L575)：。
- [正文第 658 行](https://github.com/Shuang-su/gaussian-splatting-daily/blob/main/docs/daily/2026/09/2026-09-24.md#L658)：。
- [正文第 716 行](https://github.com/Shuang-su/gaussian-splatting-daily/blob/main/docs/daily/2026/09/2026-09-24.md#L716)：也就是双方真正轮流。
- [正文第 738 行](https://github.com/Shuang-su/gaussian-splatting-daily/blob/main/docs/daily/2026/09/2026-09-24.md#L738)：。
- [正文第 760 行](https://github.com/Shuang-su/gaussian-splatting-daily/blob/main/docs/daily/2026/09/2026-09-24.md#L760)：。
- [正文第 797 行](https://github.com/Shuang-su/gaussian-splatting-daily/blob/main/docs/daily/2026/09/2026-09-24.md#L797)：只有内容 stamp 变化才重新替换 scene。
- [正文第 817 行](https://github.com/Shuang-su/gaussian-splatting-daily/blob/main/docs/daily/2026/09/2026-09-24.md#L817)：。
- [正文第 843 行](https://github.com/Shuang-su/gaussian-splatting-daily/blob/main/docs/daily/2026/09/2026-09-24.md#L843)：全过程保留。
- [正文第 941 行](https://github.com/Shuang-su/gaussian-splatting-daily/blob/main/docs/daily/2026/09/2026-09-24.md#L941)：该段原聊天内部引用
- [正文第 995 行](https://github.com/Shuang-su/gaussian-splatting-daily/blob/main/docs/daily/2026/09/2026-09-24.md#L995)：视为一个资产整体。

