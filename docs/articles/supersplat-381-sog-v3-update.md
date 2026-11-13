---
genre: "tool"
title: "SuperSplat 3.8.1 与 SOG v3：哪些用户需要升级，哪些模型需要重转"
summary: "编辑器发雾与文件布局变化是两件相关但不同的事。先辨认使用版本和资产来源，再决定检查、升级或重新转换。"
date: "2026-11-13"
author: "metaflow horizon"
topics: ["3dgs", "formats", "webgpu"]
related: [{"date":"2026-11-13","event":"github.com/playcanvas/supersplat/pull/1103"},{"date":"2026-11-13","event":"github.com/playcanvas/engine/pull/10007"}]
sources: [{"title":"SuperSplat 3.8.1 发布","url":"https://github.com/playcanvas/supersplat/releases/tag/v3.8.1"},{"title":"不透明度修复与作者测试","url":"https://github.com/playcanvas/supersplat/pull/1103"},{"title":"Engine 文件布局修复","url":"https://github.com/playcanvas/engine/pull/10007"},{"title":"SplatTransform 配套修改","url":"https://github.com/playcanvas/splat-transform/pull/379"},{"title":"3.11.0 写入代码","url":"https://github.com/playcanvas/splat-transform/blob/v3.11.0/src/lib/writers/write-sog.ts"},{"title":"3.11.1 写入代码","url":"https://github.com/playcanvas/splat-transform/blob/v3.11.1/src/lib/writers/write-sog.ts"},{"title":"3.11.2 写入代码","url":"https://github.com/playcanvas/splat-transform/blob/v3.11.2/src/lib/writers/write-sog.ts"}]
disclosure: "Codex 依据固定发行标签、发布说明与维护者测试记录整理。本文未独立运行转换器、重现画面或完成 Safari/实体设备测试；操作建议用于安排核验。"
---

## 先判断自己遇到的是哪一种问题

SuperSplat 是在浏览器中编辑和发布高斯场景的工具，Viewer 负责播放，SplatTransform 负责格式转换，PlayCanvas Engine 提供底层渲染。这几个项目同时更新，不代表每个使用者都要重新训练模型。

如果你只是在网上看别人发布的场景，通常由网站维护者处理版本配套。如果你使用 3.8.0 编辑模型，需要关注不透明度修复。如果你自己转换或托管 SOG v3，则还需要检查文件布局和读取器。

## 模型发雾不一定是训练出了问题

高斯场景中有很多很淡的点。正常情况下，它们只对画面贡献少量颜色；编辑器把它们显示得过实，就可能出现薄雾、杂点和不正确的边缘。

SuperSplat 3.8.0 使用了新转换库，却继续按旧方式解释不透明度。3.8.1 修正显示、调整和导出，也恢复对合并高斯中大于 1 的不透明度的处理。这个数值用于保持降采样后的整体贡献，不能简单理解为界面上超过百分之百的普通透明度。

建议保留原文件，用新版重新打开已知场景，比较透明区域、边缘、直方图及导出后重新打开的结果。只替换 Viewer，不能修复编辑器先前错误导出的文件。哪些文件实际受损，仍应依据编辑操作和读回结果判断。

## SOG v3 的名字相同，文件布局却发生了变化

早期 v3 把高斯朝向数据分散存入几张纹理的 alpha 通道。WebKit 在 WebGPU 下解码图像时的预乘处理会破坏这些数据。新布局改用独立的 `quats.webp` 存放朝向，并让相关纹理保持不透明。

核对已发布标签可看到：SplatTransform 3.11.0 和 3.11.1 的 v3 写入路径采用旧布局，3.11.2 改为新布局。上游讨论中曾出现旧产物不存在的表述，但不能用这句话否定已经发布的写入代码，也不能据此断言某位用户确实生成过旧产物。

实际盘点时检查元数据中的版本与 `quats`、包内对应纹理以及转换记录。只有确认是早期布局的 v3，才进入重新转换清单。SOG v2 不受这次 v3 布局切换影响。

## 转换器、播放器与缓存要一起检查

本轮配套版本为 SplatTransform 3.11.2、Engine 2.24.1、Viewer 1.43.2，以及 SuperSplat 3.8.1。自行集成网站的团队应先在测试环境核对这组版本，而不是把一个依赖升级后立刻替换生产。

早期 v3 应从仍保留的源 PLY、SPZ 或源场景重新转换。若只剩旧成品，先保存可读取它的旧环境和原文件，再研究恢复路径；不要假定新转换器能直接读取旧布局，也不要手工补一个同名纹理文件。

发布时把元数据与所有纹理视为一组资产。使用带版本的目录，或在确认整个资源集完整后切换入口，可避免缓存层把新元数据与旧纹理混用。

## 最后检查目标设备

作者提供的 Chromium WebGPU、WebGL2 对照不等于 Safari 已完成验证。不透明度修复也保留了原生抗锯齿训练场景与最低不透明度导出筛选的补测边界。

普通创作者可先完成原文件、编辑结果、导出读回三步对照。维护线上查看器的团队还应覆盖目标浏览器、分层加载、旧 v2 与新 v3，并保留上一版应用与资产入口，确认无误后再切换。
