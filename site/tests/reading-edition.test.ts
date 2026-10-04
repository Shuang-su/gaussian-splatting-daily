import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import matter from "gray-matter";
import { buildArchive, parseArticle, ROOT } from "../lib/content";
import { applyReadingEdition } from "../lib/reading-edition";
import { readingNavigation } from "../lib/reading-navigation";
import { weekPicks } from "../lib/week-picks";
import { searchItems } from "../lib/search";
import ReadingGuide from "../components/ReadingGuide";

const canonicalPath = "docs/daily/2026/10/2026-10-03.md";
const readerPath = "docs/reading/2026-10-03.md";
const original = fs.readFileSync(`${ROOT}/${canonicalPath}`, "utf8");
const reader = fs.readFileSync(`${ROOT}/${readerPath}`, "utf8");
const source = parseArticle(original, canonicalPath);
const archive = buildArchive();

test("reader edition keeps source identity, old links and research while shortening the continuous read", async () => {
  const a = (await archive).articles[0], old = await source;
  assert.equal(a.contentHash, old.contentHash);
  assert.equal(a.html, old.html);
  assert.equal(a.sourceCount, 10);
  assert.equal(a.readingEdition?.path, readerPath);
  assert.equal(a.events?.length, 16);
  assert.ok(a.readingMinutes < old.readingMinutes);
  assert.equal(a.events?.filter(e => e.group === "main").length, 4);
  for (const e of a.events!) {
    assert.deepEqual(e.context, []);
    assert.equal(e.anchor, old.events!.find(o => o.id === e.id)!.anchor);
    if (e.group === "main") assert.ok(e.judgment.length < 60);
  }
  for (const title of ["用途/格式：", "证据等级：", "本窗口未核实", "今天最值得实际测试"])
    assert.ok(!a.text.includes(title));
  assert.ok(a.archiveHtml.includes("今天最值得实际测试"));
  assert.ok(a.archiveHtml.includes('id="analysis"'));
  assert.ok(a.archiveHtml.includes('id="group-analysis"'));
  const ids = [...(a.bodyHtml + a.archiveHtml).matchAll(/\bid="([^"]+)"/g)].map(m => m[1]);
  assert.equal(new Set(ids).size, ids.length, "body and research details must not duplicate anchor IDs");
  assert.ok(readingNavigation(a, false).some(item => item.title === "研究简讯"));
  assert.ok(!readingNavigation(a, false).some(item => item.title === "分析与实践"));
});

test("reader editions preserve research identity and anchors; unedited dates stay unchanged", async () => {
  const { articles, index } = await archive;
  assert.deepEqual(articles.filter(a => a.readingEdition).map(a => a.date), ["2026-10-03", "2026-10-02", "2026-10-01", "2026-09-30"]);
  for (const a of articles) {
    const baseline = await parseArticle(fs.readFileSync(`${ROOT}/${a.path}`, "utf8"), a.path);
    if (!a.readingEdition) {
      assert.deepEqual(a, baseline);
      continue;
    }
    assert.equal(a.contentHash, baseline.contentHash, `${a.date}: canonical research hash`);
    assert.equal(a.html, baseline.html, `${a.date}: complete original research`);
    assert.equal(a.sourceCount, baseline.sourceCount, `${a.date}: original paper marker count`);
    assert.ok(a.readingMinutes < baseline.readingMinutes, `${a.date}: continuous reading is shorter`);
    for (const event of a.events!) {
      assert.equal(event.anchor, baseline.events!.find(e => e.id === event.id)!.anchor);
      assert.deepEqual(event.context, []);
    }
    const guide = renderToStaticMarkup(createElement(ReadingGuide, { article: a }));
    const ids = [...(guide + a.bodyHtml + a.archiveHtml).matchAll(/\bid="([^"]+)"/g)].map(m => m[1]);
    assert.equal(new Set(ids).size, ids.length, `${a.date}: no duplicate DOM IDs`);
    for (const target of baseline.targets) assert.ok(ids.includes(target), `${a.date}: retained ${target}`);
  }
  const september = articles.find(a => a.date === "2026-09-30")!;
  assert.equal(september.events!.filter(e => e.id.startsWith("arxiv:")).length, 12);
  for (const date of ["2026-10-01", "2026-10-02"]) {
    const report = articles.find(a => a.date === date)!;
    assert.equal(report.sourceCount, 0, "follow-up reports must not re-own earlier papers");
  }
  assert.equal(articles.find(a => a.date === "2026-10-01")!.events!.find(e => e.id.includes("blender"))!.group, "brief");
  assert.ok(!readingNavigation(articles.find(a => a.date === "2026-10-02")!, false).some(item => item.title === "研究简讯"), "a day without paper news needs no empty research section");
  assert.equal(index.entries.filter(e => e.kind === "paper").length, 52);
});

test("corrected sources retain stable event IDs, search terms and paper ownership", async () => {
  const { articles, index } = await archive;
  const corrected = index.entries.find(e => e.id.includes("9ee3ba9f2f8b334d"))!;
  assert.equal(corrected.source, "https://github.com/yindaheng98/track-4dgs/commit/9ee3ba967a63e864424a74eb5ded6b829f4ae6a2");
  assert.equal(index.entries.find(e => e.id === "arxiv:2610.02207")!.title, "One Basis to Animate Them All: Gaussian Blendshape Distillation for Real-Time Avatars");
  assert.ok(index.entries.find(e => e.id === "arxiv:2610.02207")!.summary.startsWith("GALA 将预训练角色模型"));
  assert.ok(!index.entries.find(e => e.id === "arxiv:2610.02207")!.summary.includes("2659"));
  for (const query of ["GALA", "Gaussian Avatar Lightweight Animation", "手机", "One Basis to Animate Them All"]) {
    assert.ok(searchItems(index.search, query, "paper", "avatar").some(e => e.id === "arxiv:2610.02207"), `corrected paper must remain searchable by ${query}`);
  }
  const picks = weekPicks(articles[0], articles);
  assert.ok(!picks.some(e => e.id.endsWith("splat-transform/pull/340") || e.id.endsWith("supersplat-viewer/pull/322")), "release coverage must not repeat the same PR in week picks");
  assert.deepEqual((await buildArchive()).index, index, "repeated builds must not mutate the research parser cache");
});

test("stale source, repeated event and missing prose are rejected before publication", async () => {
  const old = await source;
  await assert.rejects(applyReadingEdition(old, original, reader.replace(old.contentHash, "0".repeat(64)), readerPath, parseArticle), /does not match/);
  const duplicate = matter(reader);
  duplicate.data.events[1].id = duplicate.data.events[0].id;
  await assert.rejects(applyReadingEdition(old, original, matter.stringify(duplicate.content, duplicate.data), readerPath, parseArticle), /duplicate/);
  const missing = reader.replace(/## Gaussian-Splat-Lite[\s\S]*?(?=## SuperSplat)/, "## Gaussian-Splat-Lite\n\n");
  await assert.rejects(applyReadingEdition(old, original, missing, readerPath, parseArticle), /needs prose/);
});
