import { dailyUrl, entryUrl } from "./catalog";
import type { PortalIndex, SourceImage } from "./types";

export type HomeFeedKey = "recommended" | "daily" | "article" | "feature" | "paper" | "app" | "tool";
export type HomeItem = {
  id: string;
  kind: "daily" | "paper" | "tool" | "article";
  title: string;
  date: string;
  url: string;
  sourceLabel: string;
  image?: SourceImage;
};
export type HomeSlide = HomeItem & { contentHash: string };
export type HomeFeeds = Record<HomeFeedKey, HomeItem[]>;

export const HOME_SECTIONS = [
  { key: "recommended", label: "推荐", icon: "home", route: "/daily/" },
  { key: "daily", label: "日报", icon: "paper", route: "/daily/" },
  { key: "article", label: "文章", icon: "paper", route: "/articles/" },
  { key: "feature", label: "专题", icon: "layers", route: "/features/" },
  { key: "app", label: "应用", icon: "tool", route: "/apps/" },
  { key: "paper", label: "研究", icon: "layers", route: "/papers/" },
  { key: "tool", label: "工具", icon: "tool", route: "/tools/" },
] as const;

export function calendarDate(date: string) {
  return {
    weekday: ["周日", "周一", "周二", "周三", "周四", "周五", "周六"][
      new Date(`${date}T12:00:00+08:00`).getUTCDay()
    ],
    day: String(Number(date.slice(8, 10))),
  };
}

function sourceLabel(source: string) {
  try {
    const host = new URL(source).hostname.replace(/^www\./, "");
    if (host === "arxiv.org") return "arXiv";
    if (host === "github.com") return "GitHub";
    return host;
  } catch {
    return "来源原文";
  }
}

export function buildHome(index: PortalIndex) {
  const daily: HomeSlide[] = index.daily.map((d) => ({
    id: d.id, kind: "daily", title: d.headline, date: d.date,
    url: dailyUrl(d.date), sourceLabel: "Metaflow", image: d.image,
    contentHash: d.contentHash,
  }));
  const entries = index.entries.flatMap((e): HomeItem[] =>
    e.kind === "paper" || e.kind === "tool"
      ? [{ id: e.id, kind: e.kind, title: e.title, date: e.date,
          url: entryUrl(e), sourceLabel: sourceLabel(e.source), image: e.image }]
      : [],
  );
  // Recommend reports and illustrated entries. Avoid repeating a report's cover
  // as a second recommendation for the same day's lead event.
  const covers = new Set(daily.map((d) => `${d.date}:${d.image?.url}`));
  const illustrated = entries.filter((e) => e.image && !covers.has(`${e.date}:${e.image.url}`));
  const longform: HomeItem[] = (index.articles || []).map(a=>({id:a.id,kind:"article",title:a.title,date:a.date,url:a.url,sourceLabel:a.genre === "app" ? "应用介绍" : a.genre === "topic" ? "专题" : "文章"}));
  const recommended = [...daily, ...longform, ...illustrated].sort((a, b) => b.date.localeCompare(a.date));
  const seen = new Set<string>();
  const feeds: HomeFeeds = {
    recommended: recommended.filter((item) => {
      if (seen.has(item.id)) return false;
      seen.add(item.id); return true;
    }),
    daily,
    article: longform,
    feature: longform.filter(a=>index.articles?.some(b=>b.id===a.id&&b.genre==="topic")),
    app: longform.filter(a=>index.articles?.some(b=>b.id===a.id&&b.genre==="app")),
    paper: entries.filter((e) => e.kind === "paper"),
    tool: entries.filter((e) => e.kind === "tool"),
  };
  const related = index.daily[0]?.highlights.slice(0, 4).map((e) => ({
    id: e.id, title: e.title, url: entryUrl(e), date: e.date,
    sourceLabel: e.kind === "paper" ? "论文" : e.kind === "tool" ? "工具更新" : "项目动态",
  })) || [];
  return { slides: daily.slice(0, 5), feeds, related };
}
