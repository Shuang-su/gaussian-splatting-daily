# 本地实施记录

基线 `5454fed721c99a98b1e439351a3afa56df6f329f`；分支 `codex/daily-article-layout`。本轮只在日报工作区实施，Metaflow 未修改。

## 阶段一：页面、历史与素材

13 期共 140 个事件，其中 63 条主要新闻。采用同一 Markdown 中的可选事件块映射，原正文逐字节保持不变；标题、导读、分组和阅读顺序在构建层调整。原有跨栏目段落合入事件，原先开头的长篇总体判断保留到分析与实践。保留全部旧定位、来源链接、42 个首次归档 arXiv marker 和 9 月 18 日下午增量。逐期块映射、原正文哈希及旧锚点见 `migration/`。

样式采用系统无衬线字体、680px 正文、17 / 15px 字号、蓝色链接、红色日期牌、事件分隔线和此前 5 期卡片。统一导读包含判断及展开子目录。主新闻按已有优先级加编辑判断排序，不设数量或字数配额；没有简讯时隐藏栏目。

逐条检查 63 条主要新闻的素材来源；新增六张固定历史提交的原图和响应式 WebP，另复用两张既有演示，共为八条事件新增正文配图。其余没有适合的素材则保留文字。出处和采用理由见 `media-audit.md` / `media-audit.json` 与图片 manifest。既有 Metaflow 标识、首页结构、规范索引 schema 和 source_count 含义保持兼容。

## 阶段二：编辑、评论与发布准备

事件评论与整期评论使用不同稳定 term，普通页面未配置服务时不显示样本、计数或提交框。本地样本只在 localhost 参数开启。giscus 仓库与分类为空，没有启用 Discussions、安装 App、登录或真实写入。

新版编辑说明、任务正文和格式样例分别在 `docs/daily-event-authoring.md`、`docs/chatgpt-daily-events-task.md`、`docs/examples/event-daily.md`。块映射工具拒绝无归属或重复段落。研究覆盖分开记录更新、无新增和不可访问；历史迁移使用可证实的 historical-record，不倒填研究过程。

本地工作流候选增加受限日期图片目录与 provenance 校验，未推送，线上不生效。原 ChatGPT 08:00 调度、成功窗口和保存指令未修改。

## 实际验证

| 范围 | 结果 |
|---|---|
| 内容与来源 | 13 期正文 SHA-256 与基线一致；每块恰好归属一次；原有外部来源链接及旧锚点全部保留；42 个 arXiv 首次归档 marker、schema v1、source_count 与原机器索引一致 |
| 研究与图片附件校验 | 13 期编辑检查通过；历史使用 historical-record；受限媒体样例通过，校验值、路径、未来素材和上采样等失败用例覆盖 |
| Python | 31 项通过 |
| 网站 | 28 项通过，包括事件映射、来源保留、标签、周内选择、RSS、图片几何、原图校验值与所有 WebP 实际解码 |
| 类型与构建 | TypeScript 与 Next.js 静态导出通过，33 HTML、2 RSS、13 日报、78 目录条目、14 分享图；内部资源、路径与正文锚点全部通过 |
| 响应式 | 13 期 × 375 / 390 / 430 / 550 / 768 / 1024 / 1440px × 浅色 / 暗色 / 系统外观共 273 组；无页面横向溢出、重复锚点或缺失导读。系统暗色修正后另跑 91 组，正文链接 #33ACFF、日期数字区 #39393C、背景 #202022 均符合预期 |
| 阅读 | 唯一导读与主新闻同序；旧标题锚点保留；分析子目录按实际子标题展开；Spirula / Mobile-4DGS 分别跳转自己的正文。顶栏偏移只保留全局 76px；原先开头的长篇总体判断移至分析与实践，文字不改 |
| 讨论 | 三个区域同时展开，事件 term 与整期 term 不串联，跨宽度状态保持；populated / empty / failure 样本明确标记。失败重试后焦点进入事件区域，Esc 回到“讨论”按钮，页面 y=2180 前后一致。未配置页面没有 iframe 或提交框 |
| 图片预览 | 新图按正文阅读顺序进入预览；切图恢复默认缩放和旋转，最后缩略图完整可见；关闭后恢复 Mobile-4DGS 触发元素及 y=5006.5。390px 下将宽图旋转 90°、放大两倍，以鼠标拖动实际到达 ±127.02px / ±373px 四角。失败提示保留来源和切图，返回失败图状态仍在，解除请求拦截后重试成功 |
| 其他页面 | 首页、日报、论文、工具、订阅在 390 / 1440px 均无横向溢出或应用错误；Spirula 与 3DGS 主题组合查询实际返回 12 条。现有离线搜索单元测试通过 |
| 本地样例 | docs/examples/event-daily.md 经过 map-events 与 parseArticle，得到一个 draft 事件；真实 Mobile-4DGS 图在隔离的 .codex-work/tmp/article-media-sample 中生成日期附件并通过出处校验，没有加入正式日报或生产资源目录 |

检查过程中修复了导读跳转叠加偏移、系统暗色下新增变量未覆盖、隐藏原标题会丢失源链接，以及评论失败重试后按钮移除导致焦点丢失。初次图片预览测试点击发生在静态页面水合前，重新读取页面就绪状态后验证；预览失败测试中的请求错误属于主动拦截，检查结束后已解除。一次截图取了文档顶部而没有包含弹层，最终 gallery-390-final.png 已重新捕获实际打开的弹层。

未进行真实手机触摸、双指输入或真实 GitHub 评论读写；图片手势的单位测试和浏览器鼠标模拟分别记录，不能替代设备验收。保留历史原文的技术措辞、长代码块和人工分析，后续再改行文风格。本轮没有逐一恢复全部历史聊天内部引用，现有待复核来源提示和记录继续保留。

## 证据、版本与重启

截图与浏览器 JSON 在 `.codex-work/references/daily-article-layout/`。`responsive-matrix.json` 是 273 组布局记录；`system-dark-final.json` 是修正后 91 组外观读回；`discussion-checks.json`、`gallery-checks.json` 记录交互。`daily-30-1440-full-final.png` 覆盖整篇文章；`article-lichtfeld-550-light-final.png` 对应用户 550px 批注；`past-daily-390-final.png`、`gallery-390-final.png` 分别覆盖往期和预览。逐期手机正文截图为 `event-DD-390-system-dark-final.png`，另有首页与列表截图。文件校验值见 `screenshots-manifest.json`。

- 阶段一页面、历史与图片：`f3715b0fefab2d865b5d9c95c3ef3c91eedc27b3`。
- 阶段二任务、校验与受限附件：`0ef32c14c73160be7ac4e6d9f3a69fc3857871f6`。
- 最终验收记录和隔离媒体样例入口保存为后续 checkpoint，最终 SHA 由 Git 与交付回复给出。

实际打开验证的门户为 `http://127.0.0.1:4337/gaussian-splatting-daily/`，正文为 `http://127.0.0.1:4337/gaussian-splatting-daily/daily/2026/09/30/`。产物在 `site/out/`；临时 4317 开发服务已停止，4337 静态服务保留。

在项目根目录重建与重启：

```sh
npm run build --prefix site
python3 scripts/verify_export.py
python3 scripts/preview_site.py --port 4337
```

4337 已运行时无需再次启动。现有少数派 / Radiance Fields 参考工程未修改。公开 PR、推送、合并、Pages 部署、真实评论接入与 08:00 定时发布均未执行。本地构建不计为公开上线。
