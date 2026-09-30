# 高斯日报 · Gaussian Splatting Daily

关注 3DGS / 4DGS、辐射场、重建、工具链与实际应用的中文研究日报。**Markdown 是唯一正文，网站和索引由归档构建。**

[公开门户](https://shuang-su.github.io/gaussian-splatting-daily/) · [2026 年 9 月归档](docs/daily/2026/09/index.md) · [历史核验](docs/history-audit.md) · [纠错记录](docs/corrections.md)

## 内容与网站

首版提供首页、完整日报、论文、工具、主题、图片与浏览器搜索。Next.js / TypeScript 静态导出到 GitHub Pages，无运行时后端。文章页优先参考少数派日报的封面、日期牌、速览和正文阅读节奏；首页兼顾 Radiance Fields 的头条与紧凑次要新闻。中文品牌与图片独立选取。

- 已有 2026-09-18 至 09-30 共 13 份日报；18 日上午正文、下午增量和人工分析保留。
- 论文按无版本 arXiv marker 首次归档；后续更新引用原条目。工具用仓库与 Release / PR / commit 标识去重。
- 来源无法从原聊天内部引用恢复时，正文和核验记录明确标为待复核。
- 图片从官方来源逐日选择，并标注归属；编辑示意图明确说明性质，图片加载失败保留文字与来源。
- 文章全文、目录、表格、来源、纠错和 GitHub Issue / PR 均可从门户访问。手机、平板、桌面使用不同布局，支持浅色、暗色和系统主题。

## 每日发布

原 ChatGPT 任务 **「3DGS / 4DGS 每日深度情报」** 是主要研究和 AI 编辑入口，时间为**每天北京时间 08:00**。报告日期按 Asia/Shanghai 判断；schema v1 的 Asia/Tokyo 字段暂时兼容，不改变逻辑日期。补跑必须显式指定日期。

1. 读取最新 main、当日归档和上次成功窗口，实时巡检原有 13 栏公开来源。
2. 保留既有正文，生成完整中文日报、重点元数据与衍生索引，复用当日 Issue / 分支 / PR。
3. 内容 PR 使用 `automation/daily/YYYY-MM-DD` 和 `daily-publish` 标签，等待当前提交的内容校验、测试及静态构建。
4. 仅允许日报及衍生索引进入自动 squash merge；工作流、schema、网站代码使用独立 PR。
5. 等待 Pages 成功，读回公开首页、当日日报及 `deployment.json` 的 main SHA，再记录成功窗口与交付状态。

研究、归档、部署分别报告。失败时保留正文、Issue、PR，下次复用；不推进成功窗口。详细执行约定与重部署见 [发布运行手册](docs/publication.md)。不需要新增 OpenAI API Key 或付费 AI API 服务。

**切换状态：** GitHub arXiv 采集器现只产研究底稿，不自动合并；其旧定时入口暂保留，直到原 ChatGPT 任务实际完成一次完整发布后，再通过独立工作流 PR 取消。保留 `workflow_dispatch` 手动采集。不能把本地构建成功当作 ChatGPT 发布验收。

## 本地验证与开发

```bash
python3 scripts/validate_daily.py --all
python3 scripts/check_editorial.py --all
python3 -m unittest discover -s scripts/tests -v
npm ci --prefix site
npm test --prefix site
npm run build --prefix site
npm run dev --prefix site
```

入口为 `http://127.0.0.1:4317/gaussian-splatting-daily/`。构建输出在 `site/out/`，项目路径前缀、尾斜杠、详情静态参数和图片加载已配置；GitHub Pages 应选择 **GitHub Actions**。

## 仓库入口

- `docs/daily/`：规范日报与月份入口
- `data/daily-index.json`：schema v1 日报索引，`source_count` 仍是 arXiv marker 数量
- `data/portal-index.json`：从 Markdown 派生的门户条目与全文搜索索引
- `site/`：静态门户与构建器
- `state/checkpoint.json`：已合并日期与经验证的成功窗口
- `state/publication-observations.json`：手动发布及前三次真实定时运行的实测记录
- `.github/workflows/`：内容校验、受限每日合并、Pages、手动研究底稿采集

感谢 arXiv 和开源项目提供可引用的一手资料。未来功能以独立需求为准，首版不包含交互式 3D Viewer 或问答后端。
