# 来源复核与编辑对应

采集日期：2026-10-05（北京时间）。重写以 2026-10-03 已有报道及报告截止前的一手资料为范围，不追加报告日期之后的产品状态。

## 主要新闻

| 阅读稿 | 对应研究记录 | 复核依据与处理 |
| --- | --- | --- |
| Gaussian-Splat-Lite | 3、5、6、13 栏，原速览第 1 项 | v1.2.0 Release。保留已纠正的 setCamera/update、随机采样 API 和重试间隔含义；算法细节保留在研究记录。 |
| PlayCanvas 三个版本 | 2、5、6、9、13 栏，原速览第 2 项 | Editor 3.5.1、Viewer 1.37.0 Release；PR #1064、#322、SplatTransform #340/#341。区分 Quest 3 已有作者测试与 Pico 未验证、流式场景预算与全部场景。 |
| LichtFeld | 7、13 栏，原速览第 3 项 | PR #2686/#2688 原文。将评估偏差原因与升级建议写入四个段落；保持开发分支与 v0.5.3 区别。 |
| 3DROID | 7、10 栏，原速览第 5 项 | arXiv 2610.01744v1、Hugging Face 数据集 README。保留场景数、尺度可靠性、未含上游原数据和权重、设备及条款限制。 |

## 简讯与研究简讯

- Spirula：PR #131 与 Issue #137；合并航线和 AMD 驱动问题，实验结果不写成稳定能力。
- LocusGS：固定 f5aac796ca6b80f8b271b0bc45051688e027b78b 的 README 与原有代码检查记录，不声称本地跑通。
- track-4dgs：GitHub 截止 2026-10-02T23:15Z 的提交列表返回 9ee3ba967a63e864424a74eb5ded6b829f4ae6a2；读取 diff 确认 setup.py 为 0.6.0，新增 VGGSfM 任意查询帧、特征复用、分块跟踪与置信度。旧完整 SHA 返回 422，改网页来源 URL，事件 ID 保持不变。
- 9 条研究简讯逐篇读取 arXiv v1 摘要，按“研究对象、做法、用途及关键限制”重写，不声称运行或复现。GALA 同时查看项目页；以 v1 的蒸馏/线性混合描述为依据。
- 本期 10 篇论文身份、首次归属和 source_count=10 保持不变；GS-PQM、DSSR-3D 明确为补充收录。
- 没有重新开展原 13 栏全量检索。历史“未发现新增”与检索受限说明完整保存在研究归档中，不补造过程。

## 论文标题复核

| arXiv | 原归档标题 | v1 原论文标题 |
| --- | --- | --- |
| [2610.00040](https://arxiv.org/abs/2610.00040v1) | DSSR-3D: View-Dependent Referring Segmentation on Semantic 3D Gaussians | DSSR-3D: Decoupled Reasoning for View-Dependent Referring in 3D Gaussians |
| [2610.00195](https://arxiv.org/abs/2610.00195v1) | GS-PQM: Full-Reference Quality Metric for Compressed Gaussian Splatting | GS-PQM: A Parameter-Domain Quality Metric for Compressed Gaussian Splatting |
| [2610.00822](https://arxiv.org/abs/2610.00822v1) | TRACE: Privacy-Preserving Next-Best-View over Distributed 3DGS Maps | TRACE: Privacy-Preserving Next-Best-View Selection over Distributed 3D Gaussian-Splat Maps |
| [2610.01707](https://arxiv.org/abs/2610.01707v1) | MEGA: Object-Level Watertight Mesh Extraction from 3D Gaussians | MEGA: Object-Level Mesh Extraction from 3D Gaussian Splatting via Spatial Visual Distillation |
| [2610.01744](https://arxiv.org/abs/2610.01744v1) | 3DROID: A Dataset for 3D Reconstruction in Robotics | 3DROID: A Renderable 3D Gaussian Dataset with Measured Per-Scene Reliability |
| [2610.01876](https://arxiv.org/abs/2610.01876v1) | EvenSplat: Gaussian Splatting under Uneven Illumination | EvenSplat: Coupled 2D-3D Decomposition for Gaussian Splatting under Exposure and Illumination Variation |
| [2610.02207](https://arxiv.org/abs/2610.02207v1) | GALA: Gaussian Avatar Lightweight Animation | One Basis to Animate Them All: Gaussian Blendshape Distillation for Real-Time Avatars |

这 7 项在阅读稿的 paperTitles 中更正，派生到论文列表与搜索。原研究文件及旧标题锚点保留，校验保证旧链接仍能定位。

## 配图与资料

- 沿用已归档的 Gaussian-Splat-Lite v1.2.0 默认场景图。封面与正文共用图片身份；图注仍标为项目演示，不作为排序或 XR 性能证据。
- 本轮没有新增图片、下载数据集或运行上游项目。
- 原始响应、改写前 Markdown/解析数据、冻结 RSS 和截图保存在 `.codex-work/references/editorial-pilot/`，不提交大型采集资料。
