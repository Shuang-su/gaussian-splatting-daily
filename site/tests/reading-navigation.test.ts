import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { buildArchive, ROOT } from "../lib/content";
import { readingNavigation, flattenReadingLinks } from "../lib/reading-navigation";
import { weekPicks } from "../lib/week-picks";
import ArticleEvents from "../components/ArticleEvents";
import ReadingGuide from "../components/ReadingGuide";
import ArticleFooter from "../components/ArticleFooter";
import Discussion from "../components/Discussion";
const archive = buildArchive();
test("all 16 covers are local, have intrinsic dimensions and accessible originals", async () => {
  const { articles } = await archive;
  assert.equal(articles.length, 16);
  for (const a of articles) {
    assert.ok(a.image, `${a.date}: missing cover`);
    assert.ok(a.image.url.startsWith("/media/"));
    assert.ok(a.image.width! > 0 && a.image.height! > 0);
    assert.ok(a.image.variants?.every(v => v.width <= a.image!.width!));
    for (const file of [a.image.url, a.image.originalUrl!, ...a.image.variants!.map(v => v.url)]) assert.ok(fs.existsSync(`${ROOT}/site/public${file}`), file);
    assert.ok(a.image.source.startsWith("https://"));
  }
  assert.match(articles.find(a => a.date === "2026-09-30")!.image!.source, /radiancefields.com\/spirula-studio-v2026.9.30/);
});
test("floating navigation follows reading order and every nested target exists in rendered content", async () => {
  const { articles } = await archive;
  for (const a of articles) {
    const hasWeek = weekPicks(a, articles).length > 0;
    const items = readingNavigation(a, hasWeek), flat = flattenReadingLinks(items);
    assert.equal(new Set(flat.map(i => i.id)).size, flat.length, `${a.date}: duplicate destinations`);
    const html = renderToStaticMarkup(createElement(ReadingGuide, { article: a, hasWeek })) + renderToStaticMarkup(createElement(ArticleEvents, { article: a })) + renderToStaticMarkup(createElement(ArticleFooter, { article: a })) + (hasWeek ? '<section id="this-week"/>' : '');
    for (const item of flat) assert.ok(html.includes(`id="${item.id}"`), `${a.date}: ${item.id} has no destination`);
    assert.deepEqual(items.slice(1, 1 + a.events!.filter(e => e.group === "main").length).map(i => i.id), a.events!.filter(e => e.group === "main").map(e => e.anchor));
  }
});
test("unconfigured discussions leave no inert action while archival sources remain reachable", async () => {
  assert.equal(renderToStaticMarkup(createElement(Discussion, { dailyId: "test", date: "2026-09-30", heading: true })), "");
  const a = (await archive).articles[0];
  const html = renderToStaticMarkup(createElement(ArticleFooter, { article: a }));
  assert.ok(html.includes(a.image!.source));
  assert.ok(html.includes('id="sources"'));
  assert.ok(html.includes("原始研究记录"));
  assert.ok(!html.includes("全部日报"));
});
