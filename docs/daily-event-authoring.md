# 事件式日报编辑与图片附件

这是新版发布说明的本地准备。当前 ChatGPT 08:00 定时任务尚未切换；工作流和校验也只有合并后才生效。

## 唯一正文与稳定身份

规范文件仍为 `docs/daily/YYYY/MM/YYYY-MM-DD.md`。schema v1、`source_count`（无版本号 arXiv marker 数）和 RSS GUID 不变。`portal.layout: events`、`portal.editorial` 与顶层 `research_coverage` 是可选扩展，旧正文仍可构建。

`portal.editorial` 使用一行 JSON：`version: 1`；`events` 中每项保存 `id`、`anchor`、`title`、`group`、`judgment`、`priority`、四维 `tags` 和可选 `images`。`group` 为 `main / brief / paper / analysis`。身份来自已存在的事件 ID、无版本 arXiv ID 或具体 release / PR / commit，不随标题更名。事件标题对应正文 H2；确需不同，补 `heading` 指定原 H2。旧目标放在 `aliases`。

先按既定优先级排列，再按阅读连贯性调整。主新闻和简讯不设条数或字数配额；篇幅短不等于不重要。主要新闻写清具体变化，判断保存在 `judgment`，导读与 RSS 共用。事实细节、限制和人工分析写在 Markdown。不要在正文机械重复导读表的标题、优先级、可运行性和判断。

编辑完 Markdown 后，在 `site/` 中运行：

```sh
node --import tsx scripts/map-events.ts ../docs/daily/YYYY/MM/YYYY-MM-DD.md
```

脚本将 H2 到下一 H2 的所有 AST 段落映射为内容哈希块，保留稳定事件身份和正文原字节。正文变化后要重新运行；遗漏、重复或过期的块映射会令构建失败。每个 H2 必须对应事件或“来源与纠错”，不会静默丢弃内容。长篇事件可用 H3。历史 13 期跨栏目迁移采用人工块映射，不用此脚本重排。

## 研究覆盖

`research_coverage` 是一行 JSON 数组，包含 `overview, playcanvas, opensource, dynamic, viewer, formats, training, avatar, vendors, papers, overseas, chinese, practice` 共 13 个 scope。每项含 `id, status, note, sources`。状态为 `updated / no-change / unavailable`；无法访问时另写 `gap`，来源保存尝试访问的真实网址。不能用一句“无新增”替代检索结果。

历史迁移专用 `historical-record` 只记录旧文能证明的覆盖，不倒填检索时间或访问成功。此状态不能用于 9 月 30 日之后的新报告。论文保留首次归档 marker 与具体编辑摘要。

标签定义在 `site/lib/taxonomy.ts`。技术、项目、内容类型与来源属性分开。LCC 产品家族与 `.lcc` 格式分别标记；许可、正式 release / 分支代码 / 未独立运行等限制仍留在正文。新标签没有主题页时只显示文字。

## 每条主要事件的图片结果

逐条检索对应版本的一手素材，记录采用或不采用及原因。图片不是配额。优先功能界面、方法图和结果图；旧项目演示说明用途和历史版本，不作为当日性能证据。不能确定当时存在的素材不用于历史报道。

未来每日附件限 `site/public/daily-media/YYYY-MM-DD/`。目录内只有 raster 原图、WebP 变体和 `manifest.json`。manifest 使用与 `site/public/media/manifest.json` 相同的 `assets/images` 接口，另加 `date`；每个 asset 加 `retrievedAt`（ISO 时间）和 `sourcePublishedAt`（报告日期之前的来源日期）。包含原始 URL、一手页面、alt、credit、原图及来源 SHA-256。示例与有效样本在 `docs/examples/event-daily.md` 和本地验收记录中。

先保存图片与 assets 清单，再执行：

```sh
npm run media --prefix site -- --date YYYY-MM-DD
python3 scripts/validate_media.py
```

Sharp 固定为现有版本 0.35.5，生成 640 / 960 / 1600px WebP，低分辨率原图不放大。每期最多 20 张、总计 40 MiB；单原图最多 12 MiB、单 WebP 最多 4 MiB，尺寸不超过 20000px。拒绝 SVG、脚本、路径越界、软链接、无清单文件、缺少校验值及晚于报告日期的素材。网站加载合并后的图片映射，详情、缩略图和预览共享原图身份。

本地修改后的自动合并规则只新增以上日期目录；全局图片清单、工作流、schema、脚本和产品代码仍须独立审查。验证器不证明图片版权或事实适配，编辑仍须核验原始出处与图注。

## 评论配置

`site/lib/discussions.ts` 默认 `DISCUSSIONS = null`。配置项包括 repo / repoId / category / categoryId / 深浅主题，回链由日报路径与事件锚点派生。绑定为 `日报 ID::event::事件 ID`，整期为 `日报 ID::daily`，精确匹配。

本轮没有开通 Discussions、安装 App 或写入评论。配置为空时不发送 giscus 请求、不显示提交框。仅 localhost 上 `?commentFixture=mixed|populated|single|empty|reactions|failure` 显示带“本地验收样本 · 非真实评论”标记的测试状态；公共域名忽略参数。真实接入还须启用目标仓库 Discussions、安装 giscus、填写分类身份并单独测试 GitHub 登录和真实写入。


## 阅读版的文章规范

正文由 Markdown 负责，站点组件仅呈现读者功能。不要把目录、评论、来源状态或固定研究栏目写成正文段落。

- 顶部统一称“日报速览”：主新闻按阅读顺序编号，保留一句核心判断；简讯、研究简讯、分析与实践、本周重要内容、来源与纠错、本期讨论继续编号。确有内容的模块才出现。
- 主新闻用事件标题及自然段，交代变化、实际用途、适用条件和来源。短更新汇集成简讯列表；仍保留每条事件的稳定定位与讨论身份。研究简讯和较长分析保留各自标题，正文编号仅用于真正有先后顺序的步骤。
- 普通段落、无序／有序列表、引用、链接及图片通过同一 Markdown 管线渲染。正文与本周推荐的链接用独立蓝色，辅助信息维持低层级；正文不依赖手写样式或嵌入评论 HTML。
- 历史阅读版在 `docs/reading/YYYY-MM-DD.md` 维护事件正文；`sourceHash` 约束其依赖的研究原文。研究归档、来源、论文 marker、旧锚点和首次归档身份不变。
- 配图放在对应正文段落后，图注交代画面用途与出处；事件讨论在图片和图注之后、事件分隔线之前。

评论为空配置时，页面保留“参与讨论”和“本期讨论”，展开只说明尚未开放；没有提交框、虚构首评状态或计数。`mixed` 本地样本在前五条事件依次提供多回复、单条、空评论、表情和失败状态；本期讨论为独立单条样本。样本表单仅更改当前页面内存，刷新清空，公共域名忽略所有样本参数。

底部操作条的收藏只保存在本机浏览器；复制链接不带样本参数。真实服务接入前不展示赞赏数或伪造的互动总量。


## 2026-10 阅读体系与后续编辑

五种文章的统一行文、来源、深读和排版规范见 [高斯日报写作与排版规范](editorial-style.md)。`docs/templates/` 提供日报阅读版、论文、工具、周报和专题模板。v2 阅读版可以绑定尚未采用事件布局的研究原文；构建会检查原文哈希、来源块和事件身份。远端自动生成/发布任务尚未切换，模板与本地检查不代表远端已强制执行。
