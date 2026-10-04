import type { Article } from "./types";

export interface ReadingLink { id: string; title: string; children?: ReadingLink[] }
const groups = { brief: "简讯", paper: "论文", analysis: "分析与实践" } as const;
export function readingGroupLabel(article: Article, group: keyof typeof groups) {
  return article.readingEdition && group === "paper" ? "研究简讯" : groups[group];
}
/** Navigation follows the actual reading order and stable event identities. */
export function readingNavigation(article: Article, hasWeek: boolean): ReadingLink[] {
  const items: ReadingLink[] = [{ id: article.readingGuide?.id || "reading-guide", title: "日报速览" }];
  if (article.events) {
    items.push(...article.events.filter(e => e.group === "main").map(e => ({ id: e.anchor, title: e.title, children: e.sections })));
    for (const group of ["brief", "paper", "analysis"] as const) {
      const events = article.events.filter(e => e.group === group);
      if (!events.length) continue;
      items.push({ id: `group-${group}`, title: readingGroupLabel(article, group), children: events.length === 1 && (events[0].sections.length > 1 || events[0].title === groups[group]) ? events[0].sections : events.map(e => ({ id: e.anchor, title: e.title, children: e.sections })) });
    }
  } else {
    items.push(...article.toc.filter(t => t.depth === 2 && t.id !== article.readingGuide?.id).map(t => ({ id: t.id, title: t.title.replace(/^\d+\.\s*/, "") })));
  }
  if (hasWeek) items.push({ id: "this-week", title: "本周重要内容" });
  items.push({ id: "sources", title: "来源与纠错" }, { id: "discussion", title: "本期讨论" });
  return items;
}
export function flattenReadingLinks(items: ReadingLink[]): ReadingLink[] {
  return items.flatMap(item => [item, ...flattenReadingLinks(item.children || [])]);
}
