import { test } from "node:test";
import assert from "node:assert/strict";
import { buildArchive } from "../lib/content";
import { SITE_URL } from "../lib/catalog";
import { buildFeeds, buildWeekly, escapeXml, isoWeek, weeklyUrl } from "../lib/feeds";
import type { Daily, Entry } from "../lib/types";
const daily = (date: string, overrides: Partial<Daily> = {}): Daily => ({ id: `gsd-${date}`, date, title: "归档", headline: '中文 & <项目> "更新"', summary: "新增内容 & 纠错。", status: "published", contentHash: "hash", path: `docs/${date}.md`, sourceCount: 0, topics: [], highlights: [], prs: [], readingMinutes: 1, unresolvedSources: 0, ...overrides });
const entry = (date: string, summary: string): Entry => ({ id:"github.com/example/releases/tag/v1", kind:"tool", date, title:"项目 v1", summary, source:"https://example.org/release", anchor:"事件-一", topics:[] });

test("ISO week year follows Beijing civil dates across calendar years and leap days", () => {
  assert.deepEqual(isoWeek("2021-01-01"), { year:2020, week:53, startDate:"2020-12-28", endDate:"2021-01-03" });
  assert.deepEqual(isoWeek("2025-12-29"), { year:2026, week:1, startDate:"2025-12-29", endDate:"2026-01-04" });
  assert.equal(isoWeek("2024-02-29").week,9);
  assert.throws(() => isoWeek("2026-02-29"), /Invalid report date/);
});
test("a week closes only when a complete report enters the next week", () => {
  const sunday = daily("2026-09-27"), monday = daily("2026-09-28");
  assert.deepEqual(buildWeekly([sunday]),[]);
  assert.equal(buildWeekly([sunday,monday])[0].week,39);
  assert.equal(buildWeekly([sunday,monday])[0].releaseDate,"2026-09-28");
  assert.equal(buildWeekly([sunday,daily("2026-10-01")])[0].releaseDate,"2026-10-01");
  assert.deepEqual(buildWeekly([sunday,daily(monday.date,{status:"draft"})]),[]);
});
test("partial and missing-date weeks expose actual coverage and keep the newest stable event", () => {
  const reports = [daily("2026-09-28"), daily("2026-09-27", {highlights:[entry("2026-09-27","新增修复。")]}), daily("2026-09-23"), daily("2026-09-21", {highlights:[entry("2026-09-21","原始发布。")]}), daily("2026-09-18")];
  const before = JSON.stringify(reports), [week,partial] = buildWeekly(reports);
  assert.equal(JSON.stringify(reports),before);
  assert.deepEqual(week.reports.map(r=>r.date),["2026-09-27","2026-09-23","2026-09-21"]);
  assert.equal(week.coverageStart,"2026-09-21");assert.equal(week.coverageEnd,"2026-09-27");
  assert.equal(week.highlights.length,1);assert.equal(week.highlights[0].summary,"新增修复。");
  assert.equal(partial.reports.length,1);assert.equal(partial.coverageStart,"2026-09-18");
});
test("RSS escapes XML and embedded HTML, uses canonical project links, and has stable correction GUIDs", () => {
  assert.equal(escapeXml('中文 & < > " \' ]]>'),"中文 &amp; &lt; &gt; &quot; &apos; ]]&gt;");
  const report = daily("2026-09-30",{highlights:[entry("2026-09-30","发布 & 修复。")]}), first = buildFeeds([report]);
  assert.match(first.daily,/中文 &amp; &lt;项目&gt; &quot;更新&quot;/);
  assert.ok(first.daily.includes("新增内容 &amp;amp; 纠错。"));
  assert.ok(first.daily.includes(`${SITE_URL}/daily/2026/09/30/#事件-一`));
  const corrected = buildFeeds([{...report,status:"corrected",summary:"已纠正内容。",contentHash:"changed"}]);
  assert.equal(first.daily.match(/<guid[^>]*>(.*?)<\/guid>/)?.[1],corrected.daily.match(/<guid[^>]*>(.*?)<\/guid>/)?.[1]);
  assert.ok(corrected.daily.includes("已纠正内容。"));
  assert.deepEqual(buildFeeds([report]),first);
  assert.match(first.daily,/<pubDate>Tue, 29 Sep 2026 16:00:00 GMT<\/pubDate>/);
  const sunday = daily("2026-09-27"), monday = daily("2026-09-28");
  const originalWeek = buildFeeds([sunday,monday]).weekly;
  const correctedWeek = buildFeeds([{...sunday,status:"corrected",summary:"周内日报已纠正。"},monday]).weekly;
  assert.equal(originalWeek.match(/<guid[^>]*>(.*?)<\/guid>/)?.[1],correctedWeek.match(/<guid[^>]*>(.*?)<\/guid>/)?.[1]);
  assert.ok(correctedWeek.includes("周内日报已纠正。"));
});
test("daily and weekly limits bound feeds while preserving the full page model", () => {
  const reports = Array.from({length:220}, (_,i) => daily(new Date(Date.UTC(2026,9,1)-i*86400000).toISOString().slice(0,10)));
  const weeks = buildWeekly(reports), feeds=buildFeeds(reports,weeks);
  assert.equal((feeds.daily.match(/<item>/g)||[]).length,60);
  assert.equal((feeds.weekly.match(/<item>/g)||[]).length,26);
  assert.ok(weeks.length>26);
  assert.ok(feeds.weekly.includes(SITE_URL+weeklyUrl(weeks[0])));
  assert.deepEqual(buildFeeds([]).daily.includes("Invalid Date"),false);
});
test("source-bound weekly editions close five weeks shared by web and RSS", async () => {
  const {articles,index,weeks}=await buildArchive(), feeds=buildFeeds(articles,weeks);
  assert.deepEqual(weeks.map(w=>[w.year,w.week,w.reports.length]),[[2026,42,7],[2026,41,7],[2026,40,7],[2026,39,7],[2026,38,3]]);
  assert.equal((feeds.daily.match(/<item>/g)||[]).length,articles.length);
  assert.equal((feeds.weekly.match(/<item>/g)||[]).length,5);
  for(const week of weeks){assert.ok(feeds.weekly.includes(SITE_URL+weeklyUrl(week)));for(const report of week.reports)assert.ok(feeds.weekly.includes(report.headline));}
  assert.ok(!feeds.weekly.includes('/weekly/2026/43/'));
  for(const row of articles[0].events!.filter(e=>e.group === "main")) assert.ok(feeds.daily.includes(escapeXml(row.title)), `Daily RSS omits a displayed reading-guide event: ${row.title}`);
});
