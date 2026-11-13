# Horizon 发布运行手册

完整编辑约定见 [原任务提示词](chatgpt-horizon-task.md)。正式地址 https://metaflow.shuang-su.com/horizon/；`pages.yml` 保留工作流文件名，任务已改为 Deploy Horizon，不再发布 GitHub Pages。

1. 检索：读取上次成功窗口和 7 天重叠区，逐来源保存检查与候选处置。失败来源保留缺口。
2. 编辑：研究原文、阅读版、必要补充及独立文章同批提交；哈希与引用检查失败时不能发布。
3. 归档：每日 Issue + `automation/daily/YYYY-MM-DD` PR。代码变更另行审查；只有当前提交通过 validate 才能自动合并。
4. 部署：合并后触发 Deploy Horizon，GitHub `NETLIFY_AUTH_TOKEN` secret 和 `NETLIFY_SITE_ID` variable 指向独立站点；密钥不进入仓库、日志或任务提示词。
5. 读回：工作流比对正式域名 deployment.json 的 commit、首页、当期正文与阅读版哈希，回执保留在 Actions artifact。没有成功回执时不推进游标。
6. 观察：人工发布记 manual；真实时间触发记 scheduled。原 ChatGPT 任务将已核对观察记录随下一批内容归档，同一日同提交去重。连续三次真实定时成功前保持观察状态。

恢复从失败阶段进行：检索失败保留已采集材料；验证失败修复原 PR；部署失败重跑 pages.yml；读回失败先核对部署 SHA、主站代理和缓存，不能重复创建内容或伪造成功。旧 arXiv 采集在新流程完整运行后移除 cron，保留手动入口。

主站代理仅接入 `/horizon` 与 `/horizon/*`；初次发布复用实际生产文件清单及原始 netlify.toml。Horizon 回退采用其前一部署；主站接入回退使用记录中的原生产部署 ID，二者分别记录。
