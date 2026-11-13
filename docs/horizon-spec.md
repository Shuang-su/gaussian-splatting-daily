# metaflow horizon v1

用户批准范围与交流：codex://threads/01a1d41b-a66c-7fe2-bfa0-9450ba431b60 。Horizon #129；主站路由 MF-163。

## 产品与接口

正式入口 https://metaflow.shuang-su.com/horizon/；品牌 metaflow horizon；仓库 Shuang-su/metaflow-horizon。保留日报原身份与 URL 内部日期段；导航为日报、文章、专题、研究、应用。内容适用于高斯及相邻三维生态，无需逐篇关联工程流程。

原稿保持原始字节。reading v2 新增可选 supplements: [{path,sha256}]；限定 docs/supplements 下日期命名 Markdown，元数据必须匹配 report，带 addedAt。sourceRefs 可引用“补充路径#AST块key”；绑定及来源均硬校验。旧 v1/v2 继续读取。

文章 genre 支持 paper/tool/topic/app/tutorial/case。app 必须具备 platforms、pricing、checkedAt、experience（researched/tested）及 limitations。站点搜索按现有 paper/tool/news 类别兼容，新栏目据 genre 分类。

新研究稿声明 editorial_policy: horizon-v1，必须具备配套阅读稿和来源记录，不再用固定 13 栏替代覆盖验收。schema v1 同时接受 Asia/Shanghai 和历史 Asia/Tokyo，逻辑日期统一北京时间。source_count 仍只计原有 arXiv markers，不改写历史含义。

来源注册表的六类每日必检来源以及 7 天重叠窗口详见 data/source-registry.json。每条检查状态为 checked-no-new/candidates/unavailable/unchecked；失败必须记录 gap。定时版不允许 unchecked。候选 included/merged 必须映射到可见阅读事件；important 不允许静默延后。

## 发布与回退

Horizon 静态站点独立部署到主站同一 Netlify 团队，产物位于 /horizon。主站代理规则放在 SPA 通配前，完整保留主站生产文件清单。仅一次路由部署；以后日报发布不重建主站。未知 Horizon 路径返回 Horizon 404。

RSS 使用旧站条目 URL 作为不变 GUID（isPermaLink=false），link 与 canonical 指向新正式域名。部署身份包含源提交、研究与阅读哈希。发布状态逐阶段区分 collected/archived/deployed/read-back，失败不推进成功窗口；重试复用日期身份与 Issue/PR。

## 验收

全历史日期有审核或缺口记录，旧版可访问；重要候选均有去向。通过 Python、网站单元测试、类型检查、构建、链接/哈希校验；检查桌面/手机栏目、搜索、文章与应用。先一次手动完整发布，再观察三次真实北京时间08:00任务。三次观察之前标记“已上线，定时运行观察中”。
