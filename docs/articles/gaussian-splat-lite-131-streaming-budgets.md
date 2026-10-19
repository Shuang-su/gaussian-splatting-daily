---
genre: tool
title: 'Gaussian-Splat-Lite 1.3.1：理解内存预算与加载机制'
summary: '高斯数量、常驻缓存和进程内存是三个不同的指标。先分清它们，再判断一次大场景更新是否真的更适合你的设备。'
date: '2026-10-19'
author: Metaflow
topics: [3dgs, streaming, lod, webgpu]
related:
  - date: '2026-10-18'
    event: github.com/WilliamLiu-1997/Gaussian-Splat-Lite/releases/tag/v1.3.1
sources:
  - title: Gaussian-Splat-Lite 1.3.1 发行说明
    url: https://github.com/WilliamLiu-1997/Gaussian-Splat-Lite/releases/tag/v1.3.1
  - title: 1.3.1 RAD 调度器文档
    url: https://github.com/WilliamLiu-1997/Gaussian-Splat-Lite/blob/v1.3.1/docs/RadStreamScheduler.md
  - title: 1.3.1 SOG 调度器文档
    url: https://github.com/WilliamLiu-1997/Gaussian-Splat-Lite/blob/v1.3.1/docs/SogStreamScheduler.md
disclosure: '本文由 Codex 辅助撰写，核对了固定版本的发行说明与调度器文档。文中的复测步骤为编辑建议，尚未执行设备性能实验，不构成实测评测。'
---
大场景查看器通常先显示较粗的内容，再随相机移动加载细节。为了避免设备超出承受范围，应用会设置预算。但界面上一个“预算”数值，可能约束高斯数量，也可能约束缓存字节，两者不能互换。

Gaussian-Splat-Lite 1.3.1 把这些边界写得更明确。对于已经使用其流式加载路径的项目，这次更新最值得检查的是内存与画质如何共同变化，而不是寻找一个适用于所有设备的默认数字。

## 先分清三个预算对象

数量预算决定当前选择多少高斯。常驻缓存预算控制为流式加载保留的数据。进程总内存则还包含图片、解码中间结果、渲染目标及应用自己的资源。降低其中一个指标，并不能推导其他指标按相同比例降低。

| 观察对象 | 能说明什么 | 还需要同时记录什么 |
|---|---|---|
| 当前高斯数量 | 本次细节选择的规模 | 场景覆盖、边缘和层级切换 |
| CPU／GPU 常驻缓存 | 调度器保留数据的估计占用 | 临时解码、上传与过渡峰值 |
| 整个进程的内存 | 应用整体资源压力 | 峰值出现时正在进行的操作 |

发行说明明确把新增的 CPU、GPU 上限限定为流式缓存。因此，“GPU 缓存设成 1 GiB”应与具体字段一起记录，不能改写为“应用最多只用 1 GiB 显存”。[发行说明](https://github.com/WilliamLiu-1997/Gaussian-Splat-Lite/releases/tag/v1.3.1)

## 平滑过渡也需要空间

切换层级时，旧细节和新细节可能同时存在，以完成淡入淡出。当设备空间充裕，这有助于减轻跳变；预算紧张时，保留两份数据的成本就更明显。

RAD 调度器允许调整选择容差，并可关闭过渡。选择严格限制的同时，应观察画面是否更容易突然变清晰或变粗糙。资源边界与视觉连续性需要在同一次测试中判断。

:::details[RAD 参数核对]

1.3.1 的默认 CPU 常驻缓存为 2 GiB，GPU 为 1 GiB。`splatBudgetTolerance` 默认 0.1；设为 0 可以约束每次新选择的数量，配合 `fadeDurationMs: 0` 取消层级交叠。它们仍不保证进程总内存上限。

调度器需要注册相机，并在渲染前持续调用更新。按需渲染的应用也要让加载与重试有机会推进；资源移除时应调用释放接口。完整调用约定见固定版本的 [RAD 文档](https://github.com/WilliamLiu-1997/Gaussian-Splat-Lite/blob/v1.3.1/docs/RadStreamScheduler.md)。

:::

## SOG 的目标模式与上限模式

SOG 调度器的 `target` 模式会调整距离层级，尝试利用设定的预算；`limit` 模式保留配置的距离分层，只在超出预算时降低细节。两者回答的是不同问题：前者决定如何使用可用容量，后者决定既定层级在容量受限时如何退让。

这里讨论的是带有层次索引的流式 SOG。普通单文件 SOG 与分层场景的加载入口不同，配置时应先确认资产结构。[SOG 文档](https://github.com/WilliamLiu-1997/Gaussian-Splat-Lite/blob/v1.3.1/docs/SogStreamScheduler.md)

## 用同一条路线观察变化

建议先保存一条覆盖室内、远景和快速转向的相机路线，固定视口尺寸与画质设置，再比较旧版和 1.3.1。每次记录首个可显示画面、细化过程、缓存、进程峰值与截图，不只保留最终帧率。

还应加入一次断网恢复和一次场景卸载。前者能暴露重试是否让界面停滞，后者能检查资源是否真正释放。若降低预算后只看见更低内存，却遗漏了远处长期缺少细节，结论便不完整。

这篇解读提供的是核对方法。选择参数的最后一步，仍应由目标设备、实际资产和可以接受的画质共同决定。
