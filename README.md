# metaflow horizon

面向读者的中文行业媒体：高斯、扫描与摄影测量、NeRF、空间 AI、XR、创作工具、作品及行业应用。**高斯日报**保留为每日栏目，另设文章、专题、研究和应用。

[正式网站](https://metaflow.shuang-su.com/horizon/) · [内容契约](docs/horizon-spec.md) · [编辑与排版规范](docs/editorial-style.md) · [每日任务](docs/chatgpt-horizon-task.md)

Markdown 保存研究原文、阅读版及独立文章，Next.js 静态导出。网站独立部署在与 Metaflow 相同的 Netlify 团队，通过主站 `/horizon/` 代理访问。GitHub 原仓库改名保留提交、Issue、PR 历史；不要创建同名旧仓库，以免破坏重定向。

## 阅读与追溯

- `docs/daily/`：研究稿；原有来源、论文首次归档和锚点保留。
- `docs/reading/`：以读者为中心的正文，以哈希绑定研究稿和补充材料。
- `docs/supplements/`：带事件日期和补收日期的新增证据。
- `docs/articles/`、`docs/weekly/`：独立文章、应用资料与周报。
- `data/source-registry.json`、`data/research/`：来源注册表、每轮检查结果和候选处置。
- `data/portal-index.json`：统一栏目、应用元数据、相关推荐和搜索索引。

本轮审核覆盖 2026-09-18 至 2026-11-13 共 57 个日期，包括注明事后补收的 10 月 21—24 日。来源可访问性和历史缺口详见[审核记录](docs/changes/20261113-metaflow-horizon/history-audit.json)。覆盖范围以来源清单和日期为准，不等于全网穷尽。

## 每日发布

复用原 ChatGPT 任务，每天北京时间 08:00 执行综合检索、编辑、归档与读回。最近 7 天重叠检查；失败保存稿件和 PR，不推进成功窗口。每日 PR 校验通过后受限自动合并，`Deploy Horizon` 工作流独立发布 Netlify，并读回正式站部署身份。运行提示词和阶段恢复要求见[每日任务](docs/chatgpt-horizon-task.md)。

RSS 提供日报、周报、文章与应用；原日报和周报 GUID 与网址分离，改域名或更正正文不会改变条目身份。新网站上线不代表定时流程已观察完成；前三次真实定时成功记录在 `state/publication-observations.json`，人工执行单独计数。

## 本地开发与检查

```sh
python3 scripts/build_index.py
python3 scripts/validate_daily.py --all
python3 scripts/check_editorial.py --all
python3 scripts/validate_coverage.py --all
python3 scripts/validate_media.py
python3 -m unittest discover -s scripts/tests
python3 -m unittest discover -s tests
npm ci --prefix site
npm test --prefix site
npm run typecheck --prefix site
npm run lint:editorial --prefix site
npm run build --prefix site
python3 scripts/verify_export.py
python3 scripts/stage_site.py
npm run dev --prefix site
```

开发入口 `http://127.0.0.1:4317/horizon/`。`site/out/` 是导出内容，部署产物位于 `.codex-work/deploy/horizon-site/horizon/`。`netlify.toml` 保持不存在页面的真实 404；日常发布不构建或替换主站。应用条目必须区分资料核验和实际体验，未试用不称评测。
