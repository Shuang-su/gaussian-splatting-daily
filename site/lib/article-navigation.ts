import type { Article } from "./types";

export interface ArticleNavigationItem {
  key: string;
  id: string;
  title: string;
}

const COLUMNS: {
  key: string;
  title: string;
  heading: RegExp;
  related?: RegExp[];
}[] = [
  { key: "highlights", title: "今日最值得看", heading: /^今日最值得看$/ },
  { key: "playcanvas", title: "SuperSplat / PlayCanvas", heading: /^SuperSplat\s*\/\s*PlayCanvas(?:\s|：|$)/ },
  {
    key: "open-source", title: "开源项目", heading: /^(?:可实际运行的(?:新)?开源项目|新开源项目)(?:：|$)/,
    related: [/^fVDB\s*\/\s*NVIDIA\/OpenVDB：v0\.6\.0 正式发布$/],
  },
  { key: "dynamic", title: "4D / Dynamic Gaussian", heading: /^4D\s*\/\s*Dynamic Gaussian$/ },
  {
    key: "viewer", title: "Viewer / Editor / Web / Mobile / XR", heading: /^Viewer\s*\/\s*Editor\s*\/\s*Web\s*\/\s*Mobile\s*\/\s*XR$/,
    related: [/^Mobile\s*\/\s*XR 补录：/, /^SuperSplat Viewer：v1\.35\.2 正式发布$/],
  },
  { key: "formats", title: "格式 / LOD / 流式", heading: /^Compression\s*\/\s*Format(?:\s*\/|：)/ },
  { key: "training", title: "Training / SLAM", heading: /^Training\s*\/\s*Reconstruction\s*\/\s*SLAM/ },
  { key: "avatar", title: "Avatar", heading: /^Avatar\s*\/\s*Human\s*\/\s*Generative/ },
  { key: "vendors", title: "厂商", heading: /^软件、硬件(?:和平台厂商|与平台厂商|、商业工具与社区信号)$/ },
  {
    key: "papers", title: "论文", heading: /^(?:研究论文|论文与研究)(?:：|$)/,
    related: [/^GaussPDE：把 Gaussian 本身当 PDE 离散域$/, /^COSA-GS：今天最值得看的论文\+代码压缩路线$/],
  },
  { key: "international", title: "海外社区", heading: /^海外(?:开发者)?社区(?:信号|$)/ },
  { key: "chinese", title: "中文社区", heading: /^中文(?:社区信号|生态：)/ },
  { key: "testing", title: "实际测试", heading: /^(?:今日|今天)最值得实际测试/ },
];

/** Theme navigation points to existing coverage, independently of heading depth. */
export function articleNavigation(toc: Article["toc"]): ArticleNavigationItem[] {
  const incrementIndex = toc.findIndex(t => /^当日后续增量/.test(t.title));
  const primary = incrementIndex < 0 ? toc : toc.slice(0, incrementIndex);
  const titleOf = (heading: Article["toc"][number]) => heading.title.replace(/^\d+\.\s*/, "");
  const items: ArticleNavigationItem[] = [];
  for (const [index, column] of COLUMNS.entries()) {
    // Exact historical aliases represent combined chapters, never a default URL.
    const target = primary.find(t => column.heading.test(titleOf(t))) || column.related
      ?.map(pattern => primary.find(t => pattern.test(titleOf(t))))
      .find(Boolean);
    if (target) items.push({ key: column.key, id: target.id, title: `${index + 1}. ${column.title}` });
  }
  if (incrementIndex >= 0) items.push({ key: "increment", id: toc[incrementIndex].id, title: "当日后续增量" });
  return items;
}
