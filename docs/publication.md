# 每日发布运行手册

## 调度与成功定义

复用原 ChatGPT 任务「3DGS / 4DGS 每日深度情报」，每天北京时间 08:00，保留完整中文日报和原 13 栏检索。Dot 仅作需要时的协调入口，不进入每日链路。报告日期按北京时间判断；兼容 schema v1 Asia/Tokyo 字段，手动补跑必须显式指定 report date。

研究完成、正文合并、网站部署是三个状态。仅当完整日报已在最新 main、Pages 成功、公开 deployment.json 的 commit 与对应 main 一致、首页及当日详情读回一致，才能称发布完成并推进成功窗口。

## 一次执行

1. 读取最新 main、checkpoint、当日文件和原 Issue / PR；源巡检窗口从 last_successful_window_end 起。首次采用正文已声明的观察窗口，不能凭空创造已成功时间。
2. 检索原有 13 类论文、工具、开源项目、厂商、标准及海外 / 中文社区。记录新增、优先级、证据、代码 / Release / 本地运行状态；失败源说明缺口。真实无新增栏目短述实际检查。
3. 保留已有日报及人工分析，更新同日期文件、portal 元数据、月份 / 总入口与索引；论文 marker 首次归档不含版本，工具 ID 用 Release / PR / commit。封面按主线选择并注明归属。
4. 使用 automation/daily/YYYY-MM-DD 分支，复用 daily-key Issue 与开放 PR。标题包含当天具体事件。日常正文不能修改工作流、schema 或产品代码。标签 daily-publish 在触发 PR 校验前添加；标签较晚添加时重新运行校验。
5. 本地检查与 PR 当前提交的 Validate Daily Content 成功后，受限 workflow 自动 squash merge。任务也可核对当前 head 的成功运行后 SHA 锁定 squash merge；不能依赖旧提交的绿勾。
6. 合并后重新读取 main，等待 Deploy Pages；受限自动合并会显式 dispatch Pages，因为 GITHUB_TOKEN 创建的 push 不自动触发其他工作流。避免将 dispatch 当完成。
7. 读取公开首页、详情和 deployment.json；三者的报告身份 / 源文件 SHA256 必须与 main 的 canonical Markdown 对应，读回后再次确认 main 未变化。验证后运行 record_publication.py，记录模式 manual / scheduled、日期、main SHA、实际时间和成功窗口，再经内容 PR 归档观察记录。
8. 在原聊天交付完整正文和文件 / Issue / PR / 门户链接，分别报告研究、归档、部署状态。失败时保留成果并给出具体缺口。

```bash
python3 scripts/validate_daily.py --all
python3 scripts/check_editorial.py --all
python3 -m unittest discover -s scripts/tests -v
python3 scripts/build_index.py
npm ci --prefix site
npm test --prefix site
npm run build --prefix site
python3 scripts/verify_export.py
# 仅在实际线上读回成功之后：
python3 scripts/record_publication.py --date YYYY-MM-DD --mode manual --window-end ISO8601_WITH_TIMEZONE
```

## 失败、重试与验证边界

| 情况 | 必须行为 | 现有验证 |
|---|---|---|
| 同日重复执行 | 复用文件、Issue、分支及 PR；观察 key 幂等 | 记录函数幂等测试；现有身份复用逻辑 |
| 已有底稿 | 保留条目并补完整编辑，不把底稿自动合并 | schema / status 及占位 gate |
| 栏目真实无新增 | 明确项目、窗口、结论，可短述 | 编辑 gate 无新增用例 |
| 来源不可访问 | 明确检索失败和缺口，保留已完成部分 | 编辑 gate 失败源用例 |
| 栏目 / 占位 / 索引错误 | CI 失败，不合并，不推进窗口 | 校验、衍生索引 diff、锚点测试 |
| 部署失败 / 线上 SHA 落后 | 保留合并正文和 Issue，修复或重部署；窗口不推进 | publication 状态转换测试 |
| 原任务工具权限拒绝 | 记录拒绝，修复所需已有工具权限；不能用 Dot 绕过 | 需原任务实际运行确认 |

这些单元与本地浏览器结果不等于全部故障已在生产注入验证。手动端到端与真实 08:00 运行另记录在 state/publication-observations.json；其 mode 必须区分，不用人工运行冒充定时运行。

## 采集器切换

原 GitHub arXiv 采集器目前只生成研究底稿 PR，不自动合并。**先实测原 ChatGPT 任务完整发布一次，再在独立工作流 PR 移除 daily-ingest 的 schedule，保留 workflow_dispatch。**没有新增 OpenAI API Key 要求。旧可选 API 编辑代码不在日常 workflow 中注入凭据。

如果 GITHUB_TOKEN 不能创建 PR 或无法触发 PR 校验，使用已经授权的 ChatGPT GitHub 工具或既有 GSD_BOT_TOKEN；不新增高权限令牌作为默认修复。任务说明和真实权限状态分别核验。

## Pages 与回退

仓库 Pages 使用 GitHub Actions；main 合并触发构建部署，也可以手动运行 Deploy Pages。项目 URL 为 https://shuang-su.github.io/gaussian-splatting-daily/，详情带尾斜杠、项目路径前缀。deployment.json 标明构建 SHA。

失败可在上一成功版本上手动执行 pages.yml，保留当前内容提交；新运行的构建 SHA 和旧成功版本对应关系需记录，不能把旧站称最新内容已部署。内容纠错通过新的 PR / commit 与 corrections.md 记录，不改写历史。

## 前三次定时观察

核验下一次真实北京时间 08:00，再观察前三次 scheduled 运行：任务是否实际触发、来源 / 正文 / Issue / PR、当前提交校验、merge、Pages、公开读回及窗口。只有实际证据写入 runs；尚未到期的运行保持待验收。重复失败仍保留成果，下次重试原身份。
