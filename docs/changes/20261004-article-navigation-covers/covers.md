# 13 期封面检查

检查日期：2026-10-04。全部 13 期均有本地封面，使用 12 张不同图片；本轮补齐 4 期并替换 9 月 30 日封面，新增原图 2 张。原图与 WebP 的来源、尺寸及 SHA-256 见 `covers.json` 和 `site/public/media/manifest.json`。

| 日期 | 图像 | 用途与时点 |
|---|---|---|
| 2026-09-18 | [Blender 高斯渲染示例中的织物帽子](https://developer.blender.org/docs/release_notes/5.3/rendering/) | 沿用基线封面；本轮重新核对本地解码、尺寸、来源入口和页面加载，未重新宣称为当天版本测试结果。 |
| 2026-09-19 | [SuperSplat 随机透明度演示中的温室与仙人掌](https://blog.playcanvas.com/new-in-supersplat-editor-3-0-rebuilt-on-webgpu/) | 沿用基线封面；本轮重新核对本地解码、尺寸、来源入口和页面加载，未重新宣称为当天版本测试结果。 |
| 2026-09-20 | [Niantic Spatial 展示同一寺庙场景在不同光照和天气下的外观](https://www.nianticspatial.com/blog/introducing-gaussian-splat-relighting) | 新增：Niantic Spatial 官方重光照公告画面，公告日期 2026-09-18，与当期重光照报道对应。 |
| 2026-09-21 | [LichtFeld Studio 中的林间木屋训练界面](https://lichtfeld.io/) | 沿用基线封面；本轮重新核对本地解码、尺寸、来源入口和页面加载，未重新宣称为当天版本测试结果。 |
| 2026-09-22 | [SuperSplat Viewer 中的教堂与相机时间线](https://github.com/playcanvas/supersplat-viewer) | 沿用基线封面；本轮重新核对本地解码、尺寸、来源入口和页面加载，未重新宣称为当天版本测试结果。 |
| 2026-09-23 | [SuperSplat 编辑器中的庭院、自行车与长椅](https://blog.playcanvas.com/new-in-supersplat-editor-3-0-rebuilt-on-webgpu/) | 沿用基线封面；本轮重新核对本地解码、尺寸、来源入口和页面加载，未重新宣称为当天版本测试结果。 |
| 2026-09-24 | [同一庭院在不同高斯数量下的重建对比](https://rocm.blogs.amd.com/software-tools-optimization/point-2-gaussian/README.html) | 沿用基线封面；本轮重新核对本地解码、尺寸、来源入口和页面加载，未重新宣称为当天版本测试结果。 |
| 2026-09-25 | [IA’GS 的照片导入与新建重建任务界面](https://github.com/by-lastime/IA-GS/tree/58278f55c3c0325d12c9e628edec0eb18438eca5) | 补齐：复用当期 IA’GS 事件的官方界面，固定仓库提交 58278f55c3c0325d12c9e628edec0eb18438eca5。 |
| 2026-09-26 | [LichtFeld Studio 中的林间木屋训练界面](https://lichtfeld.io/) | 补齐：复用 LichtFeld 官方项目界面；原图未标注发布日期，不作为 Metal 后端实现或性能的证据。 |
| 2026-09-27 | [LichtFeld Viewer 中的建筑与道路重建](https://github.com/MrNeRF/LichtFeld-Studio) | 沿用基线封面；本轮重新核对本地解码、尺寸、来源入口和页面加载，未重新宣称为当天版本测试结果。 |
| 2026-09-28 | [OOOSplat 高斯模型预览与变换调整界面](https://github.com/ooolabdev/ooosplat/tree/0e19a3b74122c3bab0103bc2ad3140da0853c74f) | 补齐：复用当期 OOOSplat 官方界面，固定仓库提交 0e19a3b74122c3bab0103bc2ad3140da0853c74f；不作为高清补拍结果。 |
| 2026-09-29 | [PlayCanvas Editor 中的玩偶猫高斯模型与 LOD 控件](https://blog.playcanvas.com/new-in-playcanvas-editor-joints-parallax-occlusion-and-splat-lod/) | 沿用基线封面；本轮重新核对本地解码、尺寸、来源入口和页面加载，未重新宣称为当天版本测试结果。 |
| 2026-09-30 | [Spirula Studio 报道使用的彩色螺旋题图](https://radiancefields.com/spirula-studio-v2026.9.30-trains-large-scenes-in-parts-and-merges-them) | 替换：Radiance Fields 同日 Spirula Studio 版本报道的原始题图；是报道插画，不是分区训练结果图。 |

新增原图保持下载字节不变；Niantic 的无后缀媒体响应经解码为 PNG，归档使用 `.png` 后缀。按原图尺寸生成 640 / 960 / 1600px WebP，小图不放大。Spirula 题图原始尺寸 1600×480，Niantic 原图为 1920×1080。

封面仍可点击预览，图片身份由原图路径确定；文章顶部不再显示图注，完整出处在预览和文末「来源与纠错」中显示。列表和往期缩略图复用同一封面。

原始采集文件与未采用候选保存在 `.codex-work/references/article-navigation-covers/`。此前正文逐事件补图记录保持在 `../20261004-daily-article-layout/media-audit.json`，本轮只调整封面元数据，未改写正文。
