# 10 月日报同步交付

本地分支：`codex/daily-october-sync`。实现检查点：`12b99b49e846a4acc04493908b50d8779f4372a5`。

远端来源固定于 `7b59a2c2b29c0ebc747718ece4935d561f12355d`。本轮从已合并版本同步 2026-10-01、02、03 三期，不合并远端产品代码、工作流或采集器变更。

## 实际变更

- 首页、日报列表、论文、工具及搜索数据更新至 10 月 3 日。共 16 期日报、52 篇首次归档论文、53 条工具条目；本次新增 10 篇论文、17 条工具条目。
- 10 月 1/2/3 日分别有 4/6/7 条主要新闻；原优先级与核心判断保留，简讯、论文与分析按事件组织。三期共 34 个事件、270 个源内容块，无重复分配或未分配块。
- 三期正文与固定远端版本逐字节一致；仅增加可选元数据。9 月 13 期 Markdown 和月份入口全部与起点一致，论文 marker、旧锚点、人工分析及 9 月 18 日增量保留。
- 带入 PR #44 的 10 月 3 日纠错，包括 GSLite 的相机注册、无参数 update、重试间隔上限与随机采样 API；已有 9 月纠错未覆盖。
- 新增 ARKit Scanner、LuluSplat、Gaussian-Splat-Lite 真实配图与本地响应式版本。三期封面与事件正文使用相同图片身份；原素材、来源版本、时间与 SHA-256 见 [media.json](media.json)。全部 16 期均有封面。
- 更新月份入口、机器索引、分享图片和归档 checkpoint。checkpoint 表示远端已合并的归档进度，不代表部署或定时任务验收。

## 验证与修复

- `python3 scripts/validate_daily.py --all`、`python3 scripts/check_editorial.py --all`：16 期通过。
- `python3 -m unittest discover -s scripts/tests -v`：31 项通过。
- `npm --prefix site test`：32 项通过；包含源内容块完整性、旧链接、首次论文身份、标签、图库、目录、RSS 既有回归与新增日期检索。
- TypeScript 与 Next.js 静态导出通过；`python3 scripts/verify_export.py`：36 个 HTML、2 个现有 RSS 文件、16 期正文一致，无损坏内部路径、资源或锚点。
- 新增三期分别检查 375、390、430、550、768、1024、1440px，覆盖浅色、暗色、系统主题，共 63 组无页面横向溢出、封面加载失败或重复 ID。系统主题使用浏览器媒体模拟；暗色刷新保持。
- 浏览器实际操作：首页 → 10 月 3 日文章；LichtFeld 事件跳转与 1440→390 阅读位置；手机目录 Esc 和焦点恢复；新增封面的旋转、缩放、适应与关闭；首页加载到 12 条、切换论文；3DROID＋论文搜索和旧正文锚点定位。控制台无 error/warn。
- 验证发现并修复两项兼容问题：10 月 2 日英文参数/连续数值撑开窄屏导读，加入自然断词；论文标题包含 Robotics 被误认作栏目名，修正匹配起点并保留两个旧 SLAM 标题映射。最终历史目录标题与起点一致。
- 本地构建准备中曾有工作目录路径、Issue/PR 字段类型与旧目录名称误用，均在交付前修正；最终测试与构建成功。修正标题规则时旧 Cube-Splat 展示标题回归曾失败，补齐已有正式题名映射后 32 项测试全部通过。

详细结果：[validation.json](validation.json)。三期迁移记录位于 `migration/`。整页未重新采集参考站；本轮是已确认版式上的内容同步。

## RSS 与发布边界

按用户要求，本轮不推进 RSS 的排版或更新。每日、每周 RSS 的当前本地预览产物与开始前逐字节一致，校验值见 [feeds-frozen.json](feeds-frozen.json)。现有生成器保留，单元测试只做兼容回归；正常 `npm run build` 仍会生成最新订阅文件。当前预览使用下述工作区专用命令，在内容生成后恢复本轮保存的 RSS，再执行 Next.js 导出。

未运行真实手机手势、GPU/XR/论文复现、GitHub 评论写入、公开 PR、push、合并、Pages 部署或 08:00 定时观察。原自动化指令和调度未修改。

## 本地阅读与重启

- 首页：http://127.0.0.1:4337/gaussian-splatting-daily/
- 最新文章：http://127.0.0.1:4337/gaussian-splatting-daily/daily/2026/10/03/
- 列表：http://127.0.0.1:4337/gaussian-splatting-daily/daily/
- 静态产物：`site/out/`
- 截图：`.codex-work/references/october-sync/screenshots/`，覆盖桌面首页、手机首页、文章、暗色、列表、图片预览与搜索。

```sh
cd /Volumes/Prism/gaussian-splatting-daily-preview-20260930T172319Z/project
sh .codex-work/references/october-sync/build-preview.sh
python3 scripts/preview_site.py --port 4337
```

重启命令仅在 4337 预览进程退出后使用。构建脚本使用 `.codex-work/references/october-sync/feeds-before/` 的本轮快照；这些本地采集与构建材料未纳入生产源码。
