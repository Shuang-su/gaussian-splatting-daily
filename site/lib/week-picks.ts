import type { Article, Entry } from "./types";
import { isoWeek, editorialHighlights } from "./feeds";
export function weekPicks(article: Article, archive: Article[]): Entry[] {
  const {startDate} = isoWeek(article.date);
  const seen = new Set([...(article.events?.map(e=>e.id) || []),...article.highlights.map(e=>e.id)]);
  // A release story may already explain changes previously reported under PR IDs.
  if (article.readingEdition) for (const match of article.bodyHtml.matchAll(/href="https:\/\/([^"#]+)(?:#[^"]*)?"/g)) seen.add(match[1].replace(/\/$/, ""));
  const score = (priority?:string) => priority?.startsWith('P0') ? 0 : priority==='P1+' ? 1 : priority?.startsWith('P1') ? 2 : 3;
  return archive.filter(a=>a.date>=startDate && a.date<article.date && ['published','corrected'].includes(a.status)).flatMap(a=>editorialHighlights(a)).sort((a,b)=>score(a.priority)-score(b.priority) || b.date.localeCompare(a.date) || a.id.localeCompare(b.id)).filter(entry=>{if(seen.has(entry.id))return false;seen.add(entry.id);return true;}).slice(0,5);
}
