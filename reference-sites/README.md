# 少数派与 Radiance Fields 本地参考站

两套可编辑、可离线阅读的 React / TypeScript / Vite 前端。采集主体冻结于 2026-10-02，菜单和补充研究采集于 2026-10-03。保留原站品牌、语言、内容与样式，用于后续高斯日报设计研究。

高斯日报的 Next.js 工程和 13 期 Markdown 没有修改，基线为 `d0b4ebba2e792150b72f5ef9b9a66b648c783a5b`。本工程独立安装、独立构建，没有进入现有生产工作流。

## 运行

要求 Node.js 22.12+（本次使用 Node.js 26）。首次安装：

```sh
cd /Volumes/Prism/gaussian-splatting-daily-preview-20260930T172319Z/project/reference-sites
npm ci
```

分别在两个终端运行，端口冲突时会直接退出：

```sh
npm run dev:sspai
```

```sh
npm run dev:radiance
```

| 页面 | 本地入口 | 原站 |
|---|---|---|
| 少数派首页 | http://127.0.0.1:4340/ | https://sspai.com/ |
| 派早报列表 | http://127.0.0.1:4340/tag/派早报 | https://sspai.com/tag/派早报 |
| 指定日报 | http://127.0.0.1:4340/post/115197 | https://sspai.com/post/115197 |
| Radiance Fields 首页 | http://127.0.0.1:4341/ | https://radiancefields.com/ |
| Spirula 新闻 | http://127.0.0.1:4341/spirula-studio-v2026.9.30-trains-large-scenes-in-parts-and-merges-them | https://radiancefields.com/spirula-studio-v2026.9.30-trains-large-scenes-in-parts-and-merges-them |
| 论文 | http://127.0.0.1:4341/papers | https://radiancefields.com/papers |
| 工具 | http://127.0.0.1:4341/platforms | https://radiancefields.com/platforms |

[原站与本地截图对照](http://127.0.0.1:4340/__reference-review/)支持七页、六种视口与同步滚动。截图服务仅在开发服务器中启用，读取仓库 `.codex-work/references/`；复制源码到别处时，需同时保留该证据目录才能显示对照图。

## 编辑位置

| 内容 | 文件 |
|---|---|
| 入口与页面载入 | `src/main.tsx` |
| 页面内容与组件结构 | `public/pages/<page-id>/{desktop,tablet,mobile}.html` |
| 各页原站样式 | `public/styles/<page-id>.css` |
| 少数派菜单、目录、外观、列表 | `src/sspai.ts` |
| 原站图片预览、焦点与滚动恢复 | `src/gallery.ts` |
| 原站轮播 | `src/swiper.ts` |
| RF 桌面导航 | `src/navigation.ts` |
| RF 菜单、论文和工具筛选 | `src/radiance.ts` |
| 本地搜索 | `src/search.ts` |
| 少量交互补充样式 | `src/runtime.css` |
| 页面与来源元数据 | `public/data/pages.json` |
| 真实列表样本与展开菜单 | `public/data/extra.json`、`fragments.json` |
| 本地搜索条目 | `public/data/catalog.json` |
| 图片、字体、CSS 等资源来源与校验值 | `public/data/assets.json` |

采用原站 DOM 的可编辑 HTML 模板以保存 Vue / Framer 的作用域类名、复杂 SVG 和响应式结构，React 管理页面生命周期，TypeScript 管理阅读交互。两个站点有独立的内容模板与 CSS，构建入口通过 Vite mode 分开。

普通开发和构建不会重写模板。`npm run prepare:sources` 会从本地采集资料重新生成模板、CSS、固定数据和资源映射，只在明确要重新导入时运行。该操作无需访问原站，但会覆盖手动编辑过的生成文件；先保存自己的修改。

## 数据与本地资源

- 7 页，21 个可编辑视口模板；768 / 810 / 1200 的模板切换与原站 CSS 共同控制响应式布局。
- 820 个本地资源，记录原始 URL、文件、字节数、原始及本地 SHA-256、图片尺寸（适用时）和采集文件时间。
- 固定样本：派早报 48 条、论文 48 条、工具 72 条、RF Recent Continued 新闻 8 条；综合搜索索引 261 条。
- 日报列表每次增加 12 条；论文每次增加 24 条；工具滚动加载每批 24 条。搜索与筛选只在本地样本中进行。
- 首轮范围内链接在本地打开；范围外链接指向原站。登录、评论提交、支付、订阅、广告和视频嵌入没有连接原站后台。未模拟这些服务的成功结果。
- 少数派账户菜单与个人头像从应用模板中移除，头像位置改为原站外观图标。浅色、暗色、系统外观保存在本地。RF 未观察到主题切换入口，没有新增暗色模式。
- 首页轮播可点选和滑动，停留在固定首帧，便于重复对照；没有启动自动轮播。

## 构建与验证

```sh
npm run build
npm test
npm run verify
node scripts/summarize-evidence.mjs
```

`dist/sspai/` 与 `dist/radiance/` 是两套独立静态产物，每个详情路径包含真实的 `index.html`。不依赖后台或 Vite 的历史回退。可用任意静态文件服务器分别托管两个目录，不能使用 `file://` 直接打开。

`verify` 校验本地资源哈希、模板资源引用、账户清理与静态路由；`summarize-evidence` 汇总已经通过浏览器采集的证据，不代替浏览器操作。截图和网络核验记录位于 `../.codex-work/references/qa/`。

阅读 [对照与设计研究](docs/reference-study.md)、[验证记录](docs/validation.md) 和 [素材说明](NOTICE.md)。真实手机双指手势没有测试，不应将浏览器鼠标测试作为设备验收。
