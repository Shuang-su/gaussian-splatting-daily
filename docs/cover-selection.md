# 封面与正文图片

2026 年 9 月 18—30 日日报采用项目官方公开的场景、界面和论文图片。每张图片保留出处和原图；日报元数据中的简介、标题和图片与正文使用同一份 Markdown。正文内容没有因选图修改。

## 日报封面

| 日期 | 图片 | 出处与画面 |
|---|---|---|
| 09-18 | Blender 高斯渲染示例 | [Blender 5.3 Rendering](https://developer.blender.org/docs/release_notes/5.3/rendering/) 中的织物帽子重建图，原图 480×270，不放大生成更高分辨率版本。 |
| 09-19 | SuperSplat 随机透明度演示 | [SuperSplat 3.0 官方文章](https://blog.playcanvas.com/new-in-supersplat-editor-3-0-rebuilt-on-webgpu/) 的 Stochastic Alpha 视频第 4 秒：温室、仙人掌和编辑器界面。 |
| 09-20 | 不设封面 | 标准状态与宿主 API 的消息没有已确认的对应功能画面。 |
| 09-21 | LichtFeld 木屋训练界面 | [LichtFeld 官网](https://lichtfeld.io/) 的 Meihogen 演示静态封面，显示林间木屋和训练面板。 |
| 09-22 | SuperSplat Viewer 教堂场景 | [SuperSplat Viewer README](https://github.com/playcanvas/supersplat-viewer) 的官方截图，保留场景、相机时间线和播放器控制。 |
| 09-23 | SuperSplat 多场景编辑 | [SuperSplat 3.0 官方文章](https://blog.playcanvas.com/new-in-supersplat-editor-3-0-rebuilt-on-webgpu/) 的 WebGPU 编辑视频第 1 秒：庭院、自行车和长椅。 |
| 09-24 | AMD 高斯重建对照 | [AMD ROCm 博客](https://rocm.blogs.amd.com/software-tools-optimization/point-2-gaussian/README.html) 中同一庭院在不同高斯数量下的重建结果，完整展示两幅图。 |
| 09-25 | 不设封面 | glTF/GLB IO 与下载调度的消息没有已确认的对应功能画面。 |
| 09-26 | 不设封面 | Metal 张量后端的代码和性能表没有对应训练功能截图。 |
| 09-27 | LichtFeld Viewer 建筑重建 | [LichtFeld README](https://github.com/MrNeRF/LichtFeld-Studio) 的 viewer_demo.gif 第 150 帧：建筑、道路和 Viewer 面板。 |
| 09-28 | 不设封面 | Spirula 官方 Garage 演示持续覆盖性能宣传文字，不能说明当日分区训练变化；LichtFeld Vulkan Trainer 尚无对应功能截图。 |
| 09-29 | PlayCanvas LOD 控件 | [Editor 2.32 官方文章](https://blog.playcanvas.com/new-in-playcanvas-editor-joints-parallax-occlusion-and-splat-lod/) 的高斯 LOD 控件视频第 2 秒：玩偶猫模型和右侧 LOD 设置。 |
| 09-30 | LichtFeld 温室场景 | [LichtFeld 官网](https://lichtfeld.io/) 的 Botanics 静态场景预览，原图 1024×683。 |

项目演示用于说明相关工具的实际界面或场景，不表示它展示了当天的指定 PR、版本或性能实验。图注使用项目名称和“项目演示”；具体版本、合入状态和性能口径保留在正文。Blender 发布说明图和 AMD 重建对照图分别使用原始机构归属。

Spirula README 将 Garage 数据集归属为 [Simon Bethke](https://www.kaggle.com/datasets/simonbethke/garage)，并注明 CC BY-SA 4.0。已保存的官方演示第 30 帧与出处留在素材归档中。最终逐帧复核发现 Garage 段（第 12–35 帧）始终带有较大性能宣传文字，因此日报封面与 Spirula 工具条目均采用文字展示，不使用该素材。Mandelbulb 截图也不能说明分区训练。这里不将软件代码许可扩大解释为全部媒体素材的许可。

## 论文图片

09-30 正文的 11 张 arXiv 图片均保存为本地文件，保留相同的画面和论文来源。方法流程图、结果对照图和性能曲线不裁掉标注，使用完整显示方式。

- Prior-Driven Enhancements 原正文图片为 Ladybug 6 相机照片，226×227；替代文字明确描述相机，不写成重建结果。
- CollisionSplatting 原正文图片为精确率／召回率曲线，替代文字明确描述曲线。
- 其余图片分别为 Imagine3D-LLM 模型结构、EndoPrior-GS 渲染对比、WINGS 补洞流程、NRF-GS 庭院细节、DispFlow-GS 运动拆分、AESplat 对照、安全过滤器对照、遥感重建对照和帧选择流程。

## 静态文件

`site/public/media/manifest.json` 以原始远程地址映射本地图片，记录官方来源、图注、替代文字、尺寸、派生文件与原图 SHA-256。视频或动画截取的画面另外记录秒数或帧号和原始素材 SHA-256。

`site/public/media/originals/` 保存所采用的原图与视频／动画原尺寸静态帧。`site/public/media/images/` 保存 WebP 派生图片。生成宽度为 640、960、1600 像素，原图不足目标尺寸时保留原宽度，并去除重复尺寸。封面使用适当尺寸的静态图片，原图通过图片预览入口打开。

在 `site/` 下运行 `node --import tsx scripts/prepare-media.ts`，即可从保存的原图重建派生图片和映射。该命令不访问网络，并在生成前核对原图校验值。
