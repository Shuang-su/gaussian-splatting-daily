import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import type { Article, EditorialArticle } from "./types";
import { TOPICS } from "./catalog";
import { isoWeek } from "./feeds";

type Parser = (markdown: string, file: string) => Promise<Article>;
const files = (root: string, directory: string) => fs.existsSync(path.join(root, directory))
  ? fs.readdirSync(path.join(root, directory)).filter(file => /^[a-zA-Z0-9-]+\.md$/.test(file)).sort().map(file => `${directory}/${file}`) : [];
const text = (value: unknown) => typeof value === "string" && Boolean(value.trim());
const https = (value: unknown) => typeof value === "string" && /^https:\/\//.test(value);

export async function loadLongform(root: string, reports: Article[], parse: Parser): Promise<EditorialArticle[]> {
  return Promise.all(files(root, "docs/articles").map(async file => {
    const { data, content } = matter(fs.readFileSync(path.join(root, file), "utf8"));
    if (!text(data.title) || !text(data.summary) || !text(data.author) || !text(data.disclosure) || !/^\d{4}-\d{2}-\d{2}$/.test(data.date) || !["paper", "tool", "topic"].includes(data.genre)) throw Error(`${file}: incomplete article metadata`);
    const slug = path.basename(file, ".md"), id = `article:${slug}`;
    if (!Array.isArray(data.topics) || data.topics.some((topic: string) => !TOPICS.some(known => known.slug === topic))) throw Error(`${file}: unknown topic`);
    if (!data.sources?.length || data.sources.some((source: { title: string; url: string }) => !text(source.title) || !https(source.url))) throw Error(`${file}: missing article sources`);
    if (!data.related?.length || data.related.some((link: { date: string; event: string }) => !reports.find(report => report.date === link.date)?.events?.some(event => event.id === link.event))) throw Error(`${file}: missing related event`);
    const prose = await parse(matter.stringify(content, { id, date: data.date, title: data.title, status: "published", source_count: 0, portal: { headline: data.title, summary: data.summary } }), file);
    return { id, slug, genre: data.genre, title: data.title, summary: data.summary, date: data.date, author: data.author, topics: data.topics, sources: data.sources, related: data.related, disclosure: data.disclosure, url: `/articles/${slug}/`, html: prose.html, text: prose.text, toc: prose.toc, images: prose.images, readingMinutes: prose.readingMinutes };
  }));
}

export interface WeeklyEditorial {
  id: string;
  year: number;
  week: number;
  headline: string;
  summary: string;
  releaseDate: string;
  html: string;
  disclosure: string;
}
export async function loadWeeklyEditorial(root: string, reports: Article[], parse: Parser): Promise<WeeklyEditorial[]> {
  return Promise.all(files(root, "docs/weekly").map(async file => {
    const { data, content } = matter(fs.readFileSync(path.join(root, file), "utf8"));
    const matches = reports.filter(report => { const w = isoWeek(report.date); return w.year === data.year && w.week === data.week; });
    if (!matches.length || !text(data.headline) || !text(data.summary) || !text(data.disclosure) || !Array.isArray(data.reports) || matches.length !== data.reports.length || new Set(data.reports.map((r: {date:string})=>r.date)).size !== matches.length) throw Error(`${file}: incomplete weekly edition`);
    for (const report of matches) if (!data.reports.some((r: { date: string; sourceHash: string }) => r.date === report.date && r.sourceHash === report.contentHash)) throw Error(`${file}: stale weekly report mapping`);
    const week = isoWeek(matches[0].date);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(data.releaseDate) || data.releaseDate <= week.endDate) throw Error(`${file}: week has not closed at release date`);
    const id = `gsd-weekly-${data.year}-${String(data.week).padStart(2, "0")}`;
    const prose = await parse(matter.stringify(content, { id, date: data.releaseDate, title: data.headline, status: "published", source_count: 0 }), file);
    return { id, year: data.year, week: data.week, headline: data.headline, summary: data.summary, releaseDate: data.releaseDate, html: prose.html, disclosure: data.disclosure };
  }));
}
