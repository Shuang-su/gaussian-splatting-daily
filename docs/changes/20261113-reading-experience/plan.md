# 实施计划 · 2026-11-13

在预览基线 `ef0c0eb83b` 创建本地分支 `codex/reading-experience-20261113`。先读回 Issue 与仓库权限。以三位 GPT‑6.1 Sol 并行处理手势与宽屏层级、续读与稍后阅读、媒体与来源，主任务整合页头、共享面板、轮播与验收。仅将本次实施范围内的内容入 checkpoint。

| 范围 | 实施 | 验收 |
| --- | --- | --- |
| [续读 #122](https://github.com/Shuang-su/gaussian-splatting-daily/issues/122) | 本机按文章 ID 记录区块锚点、文本或图身份及区块内比例。正文结束标记位于推荐和讨论之前。一次路由交接后恢复，明确锚点、历史和登录回跳优先。 | 重开、刷新、24 px 字号、宽窄切换、锚点、前进后退、主题色重置按钮和标题焦点。 |
| [稍后阅读 #123](https://github.com/Shuang-su/gaussian-splatting-daily/issues/123) | 右下入口和文章更多。右侧弧形封面、左侧文章信息及动作，平直完整列表支持减弱动态。原收藏按已知文章目录迁移一次。 | 保存、移出、撤销、查看全部、键盘、缺图、退出焦点与滚动。 |
| [宽屏层级 #124](https://github.com/Shuang-su/gaussian-splatting-daily/issues/124) | 从主题总览、具体主题到真实解读文章保留相邻层，更早层可返回。卡片来源优先。按 960/600 CSS px 和报告的屏区适配。 | 普通层级、卡片优先、同级换文、宽窄切换、直达、浏览器历史及实际折缝。 |
| [手势 #125](https://github.com/Shuang-su/gaussian-splatting-daily/issues/125) | 100 ms 采样计算速度、加速度及预测距离。纵向缩回，横向只退场一次，再共同恢复来源。 | 真实触摸路径、短拖与刹车、取消、提交、非顶部右滑、固定控制、边缘与普通滚动。 |
| [面板 #126](https://github.com/Shuang-su/gaussian-splatting-daily/issues/126) | 把手专属接管，面板和遮罩跟手，向上有阻力，速度接续与回弹可中断。共享滚动锁。 | 关闭、重新抓取、内部滚动、焦点、减弱动态及评论输入。 |
| [封面与轮播 #127](https://github.com/Shuang-su/gaussian-splatting-daily/issues/127) | 保持现有尺寸与预览，封面下缘渐隐及上滚失焦。复测参考的细线几何，暂停挪到右下。 | 明暗、封面比例、日历、标题和固定控件，缺图对比与分段键盘操作。 |
| [配图 #128](https://github.com/Shuang-su/gaussian-splatting-daily/issues/128) | 22 期分 7／7／8 期做来源和构图审查。编辑插画独立清单与哈希，一手正文图走原有日期媒体校验。 | 日期、哈希、替代文本、响应式裁切、原文身份、RSS、分享图和导出。 |

实测时区为 Asia/Shanghai。上传用已检查的录屏相关片段，采用 PQ 到 sRGB 色调映射并去除音轨与无关通知，原件留存。静态构建按顺序执行，复用既有依赖。
