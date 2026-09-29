# 2026 年 9 月历史论文采集汇编（22 条）

> 这些条目原被集中放入 9 月 29 日的 bootstrap 文件，但其 Published 日期各不相同。迁至此处保留原采集文本，不将它们计为 9 月 29 日新事件。历史摘要未经本次逐篇重验。

# 历史研究内容

这是仓库建立前已收集内容的首批历史回填。覆盖 2026 年 9 月已发现的 3DGS / 4DGS 研究信号，主题集中在动态场景、稀疏/稠密视角重建、几何质量、压缩与效率、SLAM/机器人，以及反射/热成像等扩展方向。

> Backfill 说明：canonical arXiv ID 与链接已保留；未在本次回填中重新做全文编辑的条目明确标记为“待编辑增强”。后续 Daily 自动化会继续跨历史文件按 arXiv ID 去重。

## 论文与研究

### [Gauss What You Need: Compact Gaussian Splatting Across Scene Scales](https://arxiv.org/abs/2609.31248)

<!-- arxiv:2609.31248 -->

- **arXiv:** [2609.31248](https://arxiv.org/abs/2609.31248)
- **Authors:** Afif Boudaoud, Jiayi Liu, Alexandru Calotoiu, Torsten Hoefler
- **Published:** 2026-09-25
- **Topic:** density control / compression / large-scale scenes

**编辑摘要：** 作者提出 TangoGS，把 capture scale 与训练过程中的质量反馈结合起来，用于自动调节 Gaussian 数量，目标是在不同场景尺度间减少手工重新调参。

### [Dynamic Thermal Gaussians: Multimodal 4D Gaussian Splatting](https://arxiv.org/abs/2609.24531)

<!-- arxiv:2609.24531 -->

- **arXiv:** [2609.24531](https://arxiv.org/abs/2609.24531)
- **Authors:** Rongfeng Lu, Lifeng Lin, Xiaobao Wei, Quan Chen, Ming Lu, Yitian Xue, Yaoqi Sun, Yuhan Gao, Anke Xue, Chenggang Yan
- **Published:** 2026-09-21
- **Topic:** 4DGS / multimodal / thermal

**编辑摘要：** 将动态 Gaussian 表示扩展到 RGB 与热成像的共享时空场景表示，是 4DGS 向多模态感知扩展的一个明确方向。

### [GARO: Geometry-Aware Redundancy Optimization for Real-Time and High-Fidelity Dynamic Gaussian Splatting](https://arxiv.org/abs/2609.23509)

<!-- arxiv:2609.23509 -->

- **arXiv:** [2609.23509](https://arxiv.org/abs/2609.23509)
- **Authors:** Huiwen Xue, Kaixing Zhao, Zuheng Ming, Tingcheng Li
- **Published:** 2026-09-20
- **Topic:** dynamic GS / pruning / rendering efficiency

**编辑摘要：** 作者从优化活跃度和几何复杂度两方面识别动态 Gaussian 中的冗余点，重点面向动态场景的表示压缩和实时渲染效率。

### [Elevator-VIGS: Separating Elevator Motion from Robot Motion in Visual-Inertial Gaussian Splatting SLAM](https://arxiv.org/abs/2609.23491)

<!-- arxiv:2609.23491 -->

- **arXiv:** [2609.23491](https://arxiv.org/abs/2609.23491)
- **Authors:** Rui Zhou, Zihan Zhu, Wei Zhang, Zizhou Luo, Norbert Haala, Marc Pollefeys
- **Published:** 2026-09-20
- **Topic:** GS-SLAM / visual-inertial / robotics

**编辑摘要：** 关注电梯运动导致视觉与 IMU 参考系冲突的问题，把机器人相对电梯的运动与电梯相对世界的运输状态拆开估计。

### [GAPS: Generative Active Pseudo-view Selection for Sparse-View 3D Gaussian Splatting](https://arxiv.org/abs/2609.23436)

<!-- arxiv:2609.23436 -->

- **arXiv:** [2609.23436](https://arxiv.org/abs/2609.23436)
- **Authors:** Hongfei Zhu, Haochen Deng, Sitao Zhang, Ling Zhou
- **Published:** 2026-09-20
- **Topic:** sparse-view / diffusion / active view selection

**编辑摘要：** 把生成式 pseudo-view 与主动视角选择结合，重点不是无条件增加生成图，而是选择同时具有重建信息量和生成可靠性的视角。

### [LiteTex-GS: Fast and Lightweight Texturing for Gaussian Splatting](https://arxiv.org/abs/2609.23380)

<!-- arxiv:2609.23380 -->

- **arXiv:** [2609.23380](https://arxiv.org/abs/2609.23380)
- **Authors:** Zhiwei Li, Yijia Guo, Yishi Lu, Liwen Hu, Hong Rao, Shengbo Chen, Lei Ma
- **Published:** 2026-09-20
- **Topic:** texturing / compact representation

**编辑摘要：** 尝试以自适应局部纹理降低为高频外观细节堆积大量 Gaussian 的需求，同时配合 pruning 保持紧凑几何表示。

### [GrapeSplat: Geometry-Grounded Reconstruction via Amalgamated Pose-Free Encoding for Feed-Forward 3D Gaussian Splatting](https://arxiv.org/abs/2609.23182)

<!-- arxiv:2609.23182 -->

- **arXiv:** [2609.23182](https://arxiv.org/abs/2609.23182)
- **Authors:** Si-Yu Lu, Yung-Yao Chen, Yi Jan Chen, Shang-Lin Li, Ching-Chan Liao, Wen-Huang Cheng
- **Published:** 2026-09-19
- **Topic:** feed-forward GS / pose-free / sparse voxels

**编辑摘要：** 将多视图线索汇入 voxel-aligned 稀疏场景表示，再从占据网格解码 Gaussians，目标是摆脱逐像素 Gaussian 数量随输入分辨率和视角数线性膨胀的问题。

### [Splat-CBF: Safe Next-Best-View Control in 3D Gaussian-Splat Maps](https://arxiv.org/abs/2609.23100)

<!-- arxiv:2609.23100 -->

- **arXiv:** [2609.23100](https://arxiv.org/abs/2609.23100)
- **Authors:** Amirhossein Mollaei Khass, Athanasios Cosse, Nader Motee
- **Published:** 2026-09-19
- **Topic:** robotics / active perception / control

**编辑摘要：** 把 3D Gaussian-splat map 用于 next-best-view 控制，并与 control barrier function 结合处理安全约束。

### [VDGS: Visibility-Driven Large-Scale 3D Gaussian Splatting for Aerial Scene Reconstruction](https://arxiv.org/abs/2609.23049)

<!-- arxiv:2609.23049 -->

- **arXiv:** [2609.23049](https://arxiv.org/abs/2609.23049)
- **Published:** 2026-09-19
- **Topic:** large-scale / aerial reconstruction / visibility

**编辑摘要：** 使用 visibility-driven statistics 表达不同区域受到的视角监督强度，并将其用于大尺度航拍场景的分区和优化补偿。

### [Compressing 3D Gaussian Splatting via Cross-Representation Priors](https://arxiv.org/abs/2609.23005)

<!-- arxiv:2609.23005 -->

- **arXiv:** [2609.23005](https://arxiv.org/abs/2609.23005)
- **Published:** 2026-09-19
- **Topic:** compression

**编辑摘要：** 待编辑增强；已保留 canonical source，后续可进一步补充压缩策略、表示先验与实验结论。

### [D3GS: Depth, DINO, and RGB Diffusion Co-Guided 3D Gaussian Splatting for Sparse-View Reconstruction](https://arxiv.org/abs/2609.22941)

<!-- arxiv:2609.22941 -->

- **arXiv:** [2609.22941](https://arxiv.org/abs/2609.22941)
- **Published:** 2026-09-19
- **Topic:** sparse-view / depth / foundation features / diffusion

**编辑摘要：** 待编辑增强；标题显示其联合利用深度、DINO 表征和 RGB diffusion 先验约束 sparse-view 3DGS。

### [RGS: Reflection-aware Gaussian Splatting via Learning Geometry Continuity for Reflective Objects](https://arxiv.org/abs/2609.19421)

<!-- arxiv:2609.19421 -->

- **arXiv:** [2609.19421](https://arxiv.org/abs/2609.19421)
- **Authors:** Xiaobiao Du, Yida Wang, Cheng Bi, Kun Zhan, Xin Yu
- **Published:** 2026-09-16
- **Topic:** reflective objects / geometry / rendering

**编辑摘要：** 面向反射区域容易出现的几何退化，作者引入几何先验、跨视角形状一致性和 reflection-aware densification。

### [Filling the Unseen: Scene Extrapolation via 3D Gaussian Splatting](https://arxiv.org/abs/2609.13262)

<!-- arxiv:2609.13262 -->

- **arXiv:** [2609.13262](https://arxiv.org/abs/2609.13262)
- **Authors:** Yunlai Zhou, Yiren Lu, Tuo Liang, Disheng Liu, Vipin Chaudhary, Yu Yin
- **Published:** 2026-09-06
- **Topic:** scene extrapolation / generative reconstruction

**编辑摘要：** 针对训练视角分布外的场景外推，作者尝试减少逐步 generate-reconstruct-shift 带来的误差累积，并用质量感知机制限制生成数据对已重建区域的破坏。

### [Is Gaussian Splatting Becoming Neural Again? A Taxonomy and Controlled Study of Learned Parameterization](https://arxiv.org/abs/2609.12395)

<!-- arxiv:2609.12395 -->

- **arXiv:** [2609.12395](https://arxiv.org/abs/2609.12395)
- **Authors:** YuanHang Wang, Xin Cao, Yi Zhang
- **Published:** 2026-09-11
- **Topic:** taxonomy / learned parameterization

**编辑摘要：** 从 attribute decoding、spatial sharing、view-conditioned decoding、topology generation 和 amortized inference 等维度梳理 Gaussian 表示重新“神经化”的趋势。

### [VS-Splat: Voxel-Selective feed-forward Gaussian Splatting for end-to-end 3D object reconstruction from sparse-views](https://arxiv.org/abs/2609.12343)

<!-- arxiv:2609.12343 -->

- **arXiv:** [2609.12343](https://arxiv.org/abs/2609.12343)
- **Authors:** Yunsu Jeong, Hyuk Heo, Youngsang Kwak, Jaehwa Kwak, Il Yong Chun
- **Published:** 2026-09-11
- **Topic:** feed-forward / sparse-view / voxel selection

**编辑摘要：** 通过可学习 voxel selection，把更多 Gaussian 预测容量集中到更可能属于物体的体素，而不是均匀铺满 3D 空间。

### [RIDE: Relocalization-Informed Depth Estimation with 3D Gaussian Splatting](https://arxiv.org/abs/2609.11079)

<!-- arxiv:2609.11079 -->

- **arXiv:** [2609.11079](https://arxiv.org/abs/2609.11079)
- **Authors:** Jiarong Lian, Zhe Xiao, Zhaoyang Zhang, Wei Li, Ruizhi Chen
- **Published:** 2026-09-10
- **Topic:** robotics / relocalization / metric depth

**编辑摘要：** 把 3DGS relocalization 中 PnP-RANSAC 对应关系产生的稀疏度量深度，与视频深度模型的几何先验结合，用于机器人 RGB 流的稠密 metric depth。

### [CVT-GS: Learning to Simplify 3D Gaussian Splatting with Centroidal Voronoi Tessellation](https://arxiv.org/abs/2609.08730)

<!-- arxiv:2609.08730 -->

- **arXiv:** [2609.08730](https://arxiv.org/abs/2609.08730)
- **Published:** 2026-09-08
- **Topic:** simplification / representation

**编辑摘要：** 待编辑增强；已收录为 Gaussian simplification 方向信号。

### [GSComplete: Gaussian Splat Completion with 2D Diffusion Priors](https://arxiv.org/abs/2609.08449)

<!-- arxiv:2609.08449 -->

- **arXiv:** [2609.08449](https://arxiv.org/abs/2609.08449)
- **Published:** 2026-09-08
- **Topic:** completion / diffusion priors

**编辑摘要：** 待编辑增强；已收录为 diffusion prior 辅助 Gaussian completion 方向信号。

### [EdMCGS: Event-Driven Markov Chain Gaussian Splatting for Extreme-Low-Frame-Rate Dynamic Scene Reconstruction](https://arxiv.org/abs/2609.08332)

<!-- arxiv:2609.08332 -->

- **arXiv:** [2609.08332](https://arxiv.org/abs/2609.08332)
- **Published:** 2026-09-08
- **Topic:** dynamic GS / event camera / low frame rate

**编辑摘要：** 待编辑增强；已收录为事件信息辅助极低帧率动态场景重建方向信号。

### [TV-SGS: Gaussian Splatting with Geometric Information Propagation via Tensor Voting under sparse views](https://arxiv.org/abs/2609.07734)

<!-- arxiv:2609.07734 -->

- **arXiv:** [2609.07734](https://arxiv.org/abs/2609.07734)
- **Authors:** Harish N Sathishchandra, Philippos Mordohai
- **Published:** 2026-09-07
- **Topic:** sparse-view / geometry regularization

**编辑摘要：** 用 Tensor Voting 在 splats 之间传播几何信息，增加不依赖 2D rendering 的 3D regularization，重点针对稀疏视角下几何监督不足。

### [AVSplat: Dense-View Feed-Forward 3D Gaussian Splatting with Assist-View Preconditioning](https://arxiv.org/abs/2609.05925)

<!-- arxiv:2609.05925 -->

- **arXiv:** [2609.05925](https://arxiv.org/abs/2609.05925)
- **Authors:** Muyu Xu, Fangneng Zhan, Yu Wei, Hanspeter Pfister, Shijian Lu
- **Published:** 2026-09-05
- **Topic:** feed-forward / dense-view / aggregation

**编辑摘要：** 针对 feed-forward 3DGS 输入视角变多反而可能退化的问题，在全局聚合前引入 Assist Views，并配合 occupancy-aware voxel fusion。

### [STARS-GS: Structure-Aware Regularized Gaussian Splatting for Large-Scale Aerial Surface Reconstruction](https://arxiv.org/abs/2609.03447)

<!-- arxiv:2609.03447 -->

- **arXiv:** [2609.03447](https://arxiv.org/abs/2609.03447)
- **Published:** 2026-09-03
- **Topic:** aerial / large-scale / surface reconstruction

**编辑摘要：** 面向大尺度航拍表面重建，关注分区导致结构割裂、局部 Gaussian 组织以及异质结构下统一 regularization 的局限。

## 自动化说明

- 逻辑日期：Asia/Tokyo。
- 本文件为仓库初始化时的历史内容回填，不代表这些论文都在 2026-09-29 当天发布。
- canonical arXiv ID、URL 与发布日期来自公开论文元数据；“待编辑增强”表示本次未重新做全文级编辑。
- 后续自动化会在每个新条目上尝试从 arXiv HTML 发现首个 figure，并以远程图片 + 相邻来源说明呈现。
- Thank you to arXiv for use of its open access interoperability.
