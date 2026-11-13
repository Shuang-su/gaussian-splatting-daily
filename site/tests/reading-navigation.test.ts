import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { createHash } from "node:crypto";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { buildArchive, ROOT } from "../lib/content";
import { loadEditorialCovers } from "../lib/editorial-covers";
import { readingNavigation, flattenReadingLinks } from "../lib/reading-navigation";
import { weekPicks } from "../lib/week-picks";
import ArticleEvents from "../components/ArticleEvents";
import ReadingGuide from "../components/ReadingGuide";
import ArticleFooter from "../components/ArticleFooter";
import Discussion from "../components/Discussion";
const archive = buildArchive();
test("archived covers are local, have intrinsic dimensions and accessible originals", async () => {
  const { articles } = await archive;
  const historical = articles.filter(a => a.date <= "2026-10-18");
  assert.equal(historical.length, 31);
  for (const a of historical) assert.ok(a.image, `${a.date}: missing historical cover`);
  for (const a of articles.filter(a => a.image && a.image.kind !== "editorial-illustration")) {
    assert.ok(a.image!.url.startsWith("/media/") || a.date > "2026-10-18" && a.image!.url.startsWith("/daily-media/"));
    assert.ok(a.image);
    assert.ok(a.image.width! > 0 && a.image.height! > 0);
    assert.ok(a.image.variants?.every(v => v.width <= a.image!.width!));
    for (const file of [a.image.url, a.image.originalUrl!, ...a.image.variants!.map(v => v.url)]) assert.ok(fs.existsSync(`${ROOT}/site/public${file}`), file);
    assert.ok(a.image.source.startsWith("https://"));
  }
  assert.match(articles.find(a => a.date === "2026-09-30")!.image!.source, /radiancefields.com\/spirula-studio-v2026.9.30/);
});
test("new reading editions use 22 distinct dated editorial covers", async () => {
  const { articles } = await archive;
  const manifest = loadEditorialCovers(ROOT);
  const illustrated = articles.filter(article => article.image?.kind === "editorial-illustration");
  assert.equal(illustrated.length, 22);
  assert.deepEqual(illustrated.map(article => article.date).sort(),
    articles.filter(article => article.date > "2026-10-18").map(article => article.date).sort());
  assert.equal(new Set(Object.values(manifest).map(cover => cover.inputSha256)).size, 22);
  for (const article of illustrated) {
    const { date, image } = article;
    const cover = manifest[date];
    assert.deepEqual(image, cover.image);
    assert.equal(image?.originalUrl, undefined);
    assert.equal(image?.url, `/media/editorial-covers/${date}-960.webp`);
    assert.equal(image?.width, 960);
    assert.equal(image?.height, 540);
    assert.deepEqual(image?.variants?.map(variant => variant.width), [480, 960, 1440]);
    for (const variant of cover.files) {
      const bytes = fs.readFileSync(`${ROOT}/site/public${variant.url}`);
      assert.equal(createHash("sha256").update(bytes).digest("hex"), variant.sha256, variant.url);
    }
  }
});
test("floating navigation follows reading order and every nested target exists in rendered content", async () => {
  const { articles } = await archive;
  for (const a of articles) {
    const hasWeek = weekPicks(a, articles).length > 0;
    const items = readingNavigation(a, hasWeek), flat = flattenReadingLinks(items);
    assert.equal(new Set(flat.map(i => i.id)).size, flat.length, `${a.date}: duplicate destinations`);
    const html = renderToStaticMarkup(createElement(ReadingGuide, { article: a, hasWeek })) + renderToStaticMarkup(createElement(ArticleEvents, { article: a })) + renderToStaticMarkup(createElement(ArticleFooter, { article: a })) + (hasWeek ? '<section id="this-week"/>' : '') + renderToStaticMarkup(createElement(Discussion, { dailyId: a.id, date: a.date, heading: true }));
    for (const item of flat) assert.ok(html.includes(`id="${item.id}"`), `${a.date}: ${item.id} has no destination`);
    assert.deepEqual(items.slice(1, 1 + a.events!.filter(e => e.group === "main").length).map(i => i.id), a.events!.filter(e => e.group === "main").map(e => e.anchor));
  }
});
test("discussion entry renders before opening without invented comments or a submit form", async () => {
  const discussion = renderToStaticMarkup(createElement(Discussion, { dailyId: "test", date: "2026-09-30", heading: true }));
  assert.ok(discussion.includes('id="discussion"'));
  assert.ok(discussion.includes("查看本期讨论"));
  assert.ok(discussion.includes('aria-haspopup="dialog"'));
  assert.ok(!discussion.includes("<iframe"));
  assert.ok(!discussion.includes("一级评论"));
  assert.ok(!discussion.includes("暂无评论"));
  assert.ok(!discussion.includes("本地样本"));
  assert.ok(!discussion.includes("<form"));
  assert.ok(!discussion.includes("<iframe"));
  const a = (await archive).articles.find(a => a.date === "2026-10-18")!;
  const html = renderToStaticMarkup(createElement(ArticleFooter, { article: a }));
  assert.ok(html.includes(a.image!.source));
  assert.ok(html.includes('id="sources"'));
  assert.ok(html.includes("原始研究记录"));
  assert.ok(!html.includes("全部日报"));
});
