# 高斯日报 RSS 与本地预览

正文仍来自 `docs/daily/YYYY/MM/YYYY-MM-DD.md`。`site/lib/feeds.ts` 生成每日 RSS 与自然周汇总；`site/scripts/build-content.ts` 在 Next.js 静态构建前写入 `site/public/feeds/`。产物与页面一起进入 `site/out/` 和已有 Pages artifact。没有新增运行时服务或 AI API。

## 订阅路径

| 路径 | 内容 |
|---|---|
| `/subscribe/` | 每日 / 每周链接、复制、打开 XML、近期周汇总 |
| `/feeds/daily.xml` | 最近 60 期；标题、完整短摘要、网页中的“今日最值得看”、全文入口 |
| `/feeds/weekly.xml` | 最近 26 个已结束自然周 |
| `/weekly/YYYY/WW/` | ISO 周年份 / 周编号；实际覆盖日期、期数、逐日报告与去重事件 |

以上路径在正式站点统一位于 `https://shuang-su.github.io/gaussian-splatting-daily`。HTML 注册两个订阅源；本地“打开 RSS”指向当前预览，复制得到正式地址。正式订阅仍需 Pages 实际部署后验证。

周一至周日按北京时间的报告日期分组，兼容原 `Asia/Tokyo` frontmatter。最新已发布或已纠正日报所在周保持开放；首期跨入下一周时，上一周生成汇总。中途缺期或归档开始较晚时显示实际已有日期与数量，不补造日报。事件按日期逆序，以现有稳定 ID 去重，保留较新的介绍。

周汇总页与 RSS 使用相同 `WeeklyDigest`。日报 GUID 为正式日报 URL，周汇总 GUID 为正式周页 URL；纠错改变摘要或正文入口内容，不生成新 GUID。RSS 的日期按北京时间报告日期的 00:00 转换为 RFC 822 时间；周条目使用周结束后首期完整日报的日期。这是日期排序口径，不是对真实 08:00 执行或发布时间的证明。规范 Markdown、schema v1、论文 marker 与 `source_count` 口径未改变。

## 构建、检查与预览

在仓库根目录执行：

```sh
npm run build --prefix site
python3 scripts/verify_export.py
python3 scripts/preview_site.py --port 4337
```

预览地址：`http://127.0.0.1:4337/gaussian-splatting-daily/`。详情页、XML 和周汇总可直接打开及刷新。服务器仅监听本机；关闭后按同一命令重启。

```sh
python3 scripts/validate_daily.py --all
python3 scripts/check_editorial.py --all
python3 -m unittest discover -s scripts/tests
npm run typecheck --prefix site
npm test --prefix site
```

导出检查同时解析 HTML、两个 RSS XML、HTML 摘要中的链接、GUID 和事件锚点，并对照规范 Markdown 哈希。浏览器交互与设备手势需要另行检查。

生成的 XML 不入 Git，由已锁定依赖的构建重建；两个订阅源与页面一起发布。没有新增 GitHub 定时入口、邮件服务、PR 或部署操作。
