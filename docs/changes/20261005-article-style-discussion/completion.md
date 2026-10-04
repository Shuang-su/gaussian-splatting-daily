# 本地完成记录

本轮按 13 条样式和评论批注修复了所有 16 期共享的文章组件。详情见 style-review.md；用户请求与实施范围分别见 request.md、plan.md。

## 结果

- 统一“日报速览”，主新闻保留简述，其余实际模块接续编号；沿用旧导读锚点与事件 ID。简讯用语义列表。
- 修正系统字体顺序、辅助字号、日期牌阴影、往期卡片间距、文末蓝色链接，并收拢推荐区与来源区的重复留白。
- 恢复每条事件的讨论入口和独立整期讨论区，加入底部操作条。未配置时没有假计数、样本留言、提交框或 giscus iframe。
- 新的显式本地样本支持首评、单条／两条预览、多条及回复、表情、失败重试、排序、输入、Esc 与返回焦点；状态按日报／事件稳定 ID 隔离。
- 本机收藏刷新后保留，可撤回；复制文章链接不携带样本参数。未做任何 GitHub 评论写入。
- 修复 9 月 30 日正文与研究归档重复的 group-brief，测试改为覆盖实际渲染组件。

## 实际验证

- `python3 scripts/validate_daily.py --all`：16 期通过。
- `python3 scripts/check_editorial.py --all`：16 期通过。
- `python3 -m unittest discover -s scripts/tests`：31 项通过。
- `npm --prefix site run test`：40 项通过。新增样本域名边界、状态组合、表情可逆及连续编号检查；增强真实组件锚点排重检查。
- TypeScript 与 Next.js 静态构建通过。
- `python3 scripts/verify_export.py`：36 个 HTML、16 期、内部链接／资源／锚点通过，2 个冻结 RSS 文件可解析。
- 浏览器：9 月 30 日普通浅色和样本暗色分别检查 375 / 390 / 430 / 550 / 768 / 1024 / 1440px，均无横向溢出、底栏越界。正文为手机 15px / 27px、桌面 17px / 30.6px；日期牌 64 / 72px。
- 550px 逐页检查 9 月 18 日—10 月 3 日全部 16 期：导读目标存在、普通页面没有样本和 iframe、所有实际存在的往期卡片均有缩略图。9 月 30 日重复锚点已修正并读回唯一。
- 讨论预览、二级回复、默认／最新排序、首评添加、表情、失败重试、事件与整期隔离、跨断点状态、Esc 焦点、手机目录焦点、收藏刷新、复制链接通过。额外确认表情再次点击可撤回，整期样本提交会同步底部计数，事件评论不受影响。
- 图片旋转／放大／关闭焦点回归通过；旧 #group-analysis 正确打开研究归档。系统外观跟随当前浅色系统；最后恢复操作前的浅色偏好。
- 浏览器未捕获 console error / warning。明细在 validation.json。

## 证据和可运行页面

本地门户：http://127.0.0.1:4337/gaussian-splatting-daily/daily/2026/09/30/

混合样本：http://127.0.0.1:4337/gaussian-splatting-daily/daily/2026/09/30/?commentFixture=mixed

静态产物：site/out/。截图与参考测量保存在 `.codex-work/references/article-style-discussion/`，包括桌面速览、往期卡片、550px 深浅讨论、390px 二级回复、简讯和图片预览。长页 fullPage 截图一次未能生成，改用实际可见视口分段截图；未把失败截图当作验收证据。

初次新增编号测试误把保留的旧锚点中的“今日最值得看”当作可见标题，修正断言后通过；视觉检查发现的“10”折行和重复锚点均已修复。

## 未运行与保留边界

真实 GitHub/giscus 登录、外部评论写入、真实评论摘要同步、真实手机手势和系统深浅模式实时切换未运行。当前系统为浅色，已验证跟随系统选择及浏览器中手动深浅主题。没有 push、部署、RSS 更新或每日任务调度切换。

冻结 RSS SHA-256：

- daily.xml：55adf548fc2e1df7707d8cb71928ba198fc513ec05502b8f86e5b741235c787f
- weekly.xml：b7b867166f627ccbbc6b45fb688d9f0ae0415696c3a2fde2e3518d2f67923b66

## Checkpoint

实施 checkpoint 和最终完成记录的 SHA 将在提交后读回记录。分支为 codex/article-style-discussion，起点 be15aaae4fefeb22a4eac38bd5459bf283858770。
