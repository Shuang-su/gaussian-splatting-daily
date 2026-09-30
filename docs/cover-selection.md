# 封面选择与图片归属

封面围绕当日主线逐日选择；论文第一张方法图只作论文条目图，不自动成为日报封面。少数派的插画、商标和原创图片没有复制。

| 日期 | 选择 | 原因与限制 |
|---|---|---|
| 09-18 | 自绘 Importer Correctness 示意 | 导入正确性；不表现不存在的测试结果 |
| 09-19 | 自绘 Stochastic Rendering 示意 | 渲染路径主线；不伪装产品截图 |
| 09-20 | 自绘 Format & Interop 示意 | KHR 扩展状态与互操作性；有明确纠错 |
| 09-21 | LichtFeld 官方视频静态海报 | 训练 / Viewer 主线，避免动态营销 GIF 干扰阅读 |
| 09-22 / 23 / 24 | SuperSplat 官方雪林编辑器图 | 当日 PlayCanvas / 编辑器主线，图示不是当日版本 |
| 09-25 | 自绘 Format Pipeline 示意 | 格式与传输链，与标准状态分开判断 |
| 09-26 | 自绘 Native Backends 示意 | 原生后端与训练 / Viewer 方向 |
| 09-27 | LichtFeld 官方视频静态海报 | 原生训练工具主线，旧示意与当日事实分开 |
| 09-28 | Spirula 官方静态界面 | 分区 / SfM 主线，固定来源 commit |
| 09-29 / 30 | SuperSplat 官方雪林编辑器图 | distance-only LOD、转换与 Web 工具主线 |

来源：

- [SuperSplat README](https://github.com/playcanvas/supersplat#readme)：官方公开编辑器图，编辑器 UI 与模型轮廓清晰，静态加载。裁切偏向雪林房屋，保留场景与工具关系。
- [Spirula 固定 commit](https://github.com/harry7557558/spirula-studio/tree/1943edaf83abf0d00b9ca2d2023424ba1e831d6a/assets)：官方 screenshot.png，替代原动态营销 clip。信用文字明确非当日版本截图。
- [LichtFeld 官方演示视频](https://www.youtube.com/watch?v=i-04z4_eqiU)：静态 poster，用 contain 避免裁掉界面及标注。
- 自绘 SVG 保存在 site/public/covers/，1200×675，浅色几何与主题文字，标为高斯日报编辑示意，不表示性能实测或产品截图。
- 论文图链接原 arXiv HTML，邻近保留论文 ID 与作者归属。

元数据直接存于每日 Markdown 的 portal.image；alt 描述图片真实内容，caption 指向官方来源。主题切换不篡改图片颜色。加载失败时显示“图片暂不可用”与原归属链接，全文仍可阅读。

本轮选择改善可读性和主线关联；同一项目的多日封面会重复官方示意。若未来有更适合当天事件的官方新图，可通过内容 PR 明确替换来源和归属。

## 图片预览

正文与封面统一进入原图画廊：暗色遮罩、左右切换、底部缩略图、旋转 / 缩放 / 适应屏幕、图注与来源。按钮、Esc 和左右键可操作，关闭恢复原焦点与正文滚动；手机支持按钮及横向滑动切图。远程原图失败仍显示来源。与少数派参考相同的交互意图独立实现，没有引入其代码或图片。
