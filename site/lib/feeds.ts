import { dailyUrl, entryUrl, SITE_URL } from "./catalog";
import type { Article, Daily, Entry, EditorialArticleSummary } from "./types";

export const FEEDS = {
  articles: { title: "文章与应用", path: "/feeds/articles.xml", url: `${SITE_URL}/feeds/articles.xml` },
  daily: { title: "每日简报", path: "/feeds/daily.xml", url: `${SITE_URL}/feeds/daily.xml` },
  weekly: { title: "每周汇总", path: "/feeds/weekly.xml", url: `${SITE_URL}/feeds/weekly.xml` },
};
export interface WeeklyDigest {
  id: string;
  year: number;
  week: number;
  startDate: string;
  endDate: string;
  coverageStart: string;
  coverageEnd: string;
  releaseDate: string;
  reports: Daily[];
  highlights: Entry[];
}
const DAY = 86_400_000;
function civilDate(date: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error(`Invalid report date: ${date}`);
  const value = new Date(`${date}T00:00:00Z`);
  if (!Number.isFinite(value.getTime()) || value.toISOString().slice(0,10) !== date) throw new Error(`Invalid report date: ${date}`);
  return value;
}
const isoDate = (time: number) => new Date(time).toISOString().slice(0,10);
function monday(date: string) {
  const value = civilDate(date);
  return value.getTime() - ((value.getUTCDay() + 6) % 7) * DAY;
}
export function isoWeek(date: string) {
  // Inputs are Beijing civil report dates, independent of the legacy timezone field.
  const start = monday(date), year = new Date(start + 3 * DAY).getUTCFullYear();
  return { year, week: Math.round((start - monday(`${year}-01-04`)) / (7 * DAY)) + 1, startDate: isoDate(start), endDate: isoDate(start + 6 * DAY) };
}
export const weeklyUrl = (digest: Pick<WeeklyDigest, "year" | "week">) => `/weekly/${digest.year}/${String(digest.week).padStart(2,"0")}/`;
export const weeklyTitle = (digest: WeeklyDigest) => `${digest.year} 年第 ${digest.week} 周 · 高斯日报周汇总`;
export const coverageLabel = (digest: WeeklyDigest) => `${digest.coverageStart} — ${digest.coverageEnd} · ${digest.reports.length} 期日报`;
type FeedReport = Daily & Partial<Pick<Article, "readingGuide" | "events">>;
const plainText = (html: string) => html.replace(/<[^>]+>/g," ").replaceAll("&amp;","&").replaceAll("&lt;","<").replaceAll("&gt;",">").replaceAll("&quot;",'"').replace(/\s+/g," ").trim();
export function editorialHighlights(report: FeedReport): Entry[] {
  if (!report.events) return report.highlights;
  const entries = report.events.filter(event=>event.group === "main").map(event=>{
    const old = report.highlights.find(entry=>entry.id === event.id);
    const links = [...event.sourceText.matchAll(/https:\/\/[^\s)<>"。]+/g)].map(match=>match[0]);
    return { id:event.id,kind:old?.kind || "news",title:event.title,summary:plainText(event.judgment),date:report.date,source:old?.source || links.find(url=>!url.startsWith("https://chatgpt.com/")) || links[0] || SITE_URL + dailyUrl(report.date),anchor:event.anchor,topics:old?.topics || report.topics,priority:event.priority,image:event.images?.[0] || old?.image } satisfies Entry;
  });
  return [...entries,...report.highlights.filter(old=>!entries.some(entry=>entry.id === old.id))];
}
function published<T extends Daily>(daily: T[]) {
  return daily.filter(d => ["published","corrected"].includes(d.status)).sort((a,b) => b.date.localeCompare(a.date));
}
export function buildWeekly(daily: FeedReport[], asOf?: string): WeeklyDigest[] {
  const reports = published(daily);
  if (!reports.length) return [];
  const latestMonday = monday(asOf && asOf > reports[0].date ? asOf : reports[0].date);
  const groups = new Map<string, FeedReport[]>();
  for (const report of reports) {
    const start = monday(report.date);
    if (start >= latestMonday) continue;
    const key = isoDate(start);
    const group = groups.get(key) || [];
    group.push(report); groups.set(key,group);
  }
  return [...groups.entries()].map(([startDate, reports]) => {
    const week = isoWeek(startDate);
    const seen = new Set<string>();
    const highlights = reports.flatMap(report => editorialHighlights(report)).filter(entry => { if (seen.has(entry.id)) return false; seen.add(entry.id); return true; });
    const releaseDate = published(daily).filter(report => report.date > week.endDate).at(-1)?.date || asOf!;
    return { ...week, id: `gsd-weekly-${week.year}-${String(week.week).padStart(2,"0")}`, coverageStart: reports.at(-1)!.date, coverageEnd: reports[0].date, releaseDate, reports, highlights };
  }).sort((a,b) => b.startDate.localeCompare(a.startDate));
}
export function escapeXml(text: string) {
  return text.replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&apos;");
}
const htmlLink = (url: string, title: string) => `<a href="${escapeXml(url)}">${escapeXml(title)}</a>`;
const reportDate = (date: string) => new Date(`${date}T00:00:00+08:00`).toUTCString();
export function dailyDescription(daily: FeedReport) {
  const events = daily.events?.filter(event=>event.group === "main").map(event=>({ title:event.title,summary:plainText(event.judgment),url:`${dailyUrl(daily.date)}#${event.anchor}` })) || daily.readingGuide?.rows.map(row => ({ title: row.title, summary: "", url: `${dailyUrl(daily.date)}#${row.anchor}` })) || daily.highlights.map(entry => ({ title: entry.title, summary: "", url: entryUrl(entry) }));
  return `<p>${escapeXml(daily.summary)}</p>${events.length ? `<h2>今日最值得看</h2><ol>${events.map(entry => `<li>${htmlLink(SITE_URL + entry.url,entry.title)}${entry.summary ? `<p>${escapeXml(entry.summary)}</p>` : ""}</li>`).join("")}</ol>` : ""}<p>${htmlLink(SITE_URL + dailyUrl(daily.date),"阅读全文")}</p>`;
}
export function weeklyDescription(week: WeeklyDigest) {
  return `<p>${escapeXml(coverageLabel(week))}</p><h2>本周日报</h2>${week.reports.map(report => `<p>${escapeXml(report.date)} · ${htmlLink(SITE_URL + dailyUrl(report.date),report.headline)}</p><p>${escapeXml(report.summary)}</p>`).join("")}${week.highlights.length ? `<h2>本周事件</h2><ul>${week.highlights.map(entry => `<li>${escapeXml(entry.date)} · ${htmlLink(SITE_URL + entryUrl(entry),entry.title)} — ${escapeXml(entry.summary)}</li>`).join("")}</ul>` : ""}<p>${htmlLink(SITE_URL + weeklyUrl(week),"阅读全文")}</p>`;
}
const LEGACY_SITE = "https://shuang-su.github.io/gaussian-splatting-daily";
export function stableFeedGuid(url: string) { return LEGACY_SITE + url.slice(SITE_URL.length); }
type FeedItem = { title: string; url: string; date: string; description: string; guid?: string };
function rss(kind: keyof typeof FEEDS, items: FeedItem[], through?: string) {
  const feed = FEEDS[kind];
  return `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom"><channel><title>metaflow horizon · ${feed.title}</title><link>${SITE_URL}/</link><description>${kind === "daily" ? "扫描、空间 AI、XR、作品、研究与应用的每日报道。" : "周一至周日的高斯日报与重点事件汇总。"}</description><language>zh-CN</language><atom:link href="${feed.url}" rel="self" type="application/rss+xml"/>${through ? `<lastBuildDate>${reportDate(through)}</lastBuildDate>` : ""}${items.map(item => `<item><title>${escapeXml(item.title)}</title><link>${escapeXml(item.url)}</link><guid isPermaLink="false">${escapeXml(item.guid || stableFeedGuid(item.url))}</guid><pubDate>${reportDate(item.date)}</pubDate><description>${escapeXml(item.description)}</description></item>`).join("")}</channel></rss>\n`;
}
export function buildFeeds(daily: FeedReport[], weeks = buildWeekly(daily), articles: EditorialArticleSummary[] = []) {
  const reports = published(daily);
  return {
    articles: rss("articles",articles.map(article=>({title:article.title,url:SITE_URL+article.url,date:article.date,guid:article.id,description:`<p>${escapeXml(article.summary)}</p>${article.app ? `<p>${escapeXml(article.app.platforms.join("、"))} · ${article.app.experience === "tested" ? "实际体验" : "资料介绍"} · 核对于 ${article.app.checkedAt}</p>` : ""}`})),reports[0]?.date),
    daily: rss("daily",reports.slice(0,60).map(report => ({ title: `${report.date} · ${report.headline}`, url: SITE_URL + dailyUrl(report.date), date: report.date, description: dailyDescription(report) })),reports[0]?.date),
    weekly: rss("weekly",weeks.slice(0,26).map(week => ({ title: weeklyTitle(week), url: SITE_URL + weeklyUrl(week), date: week.releaseDate, description: weeklyDescription(week) })),reports[0]?.date),
  };
}
