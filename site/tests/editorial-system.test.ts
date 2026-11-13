import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { createHash } from "node:crypto";
import matter from "gray-matter";
import { buildArchive, parseArticle, ROOT } from "../lib/content";
import { applyReadingEdition } from "../lib/reading-edition";
import { parseMarkdown } from "../lib/markdown";
import { editorialWarnings } from "../lib/editorial-lint";
import { searchItems } from "../lib/search";
const archive = buildArchive();
const read = (file:string) => fs.readFileSync(`${ROOT}/${file}`,"utf8");

test("all original records and imported upstream bytes retain their pinned hashes", () => {
  const baseline = JSON.parse(read("docs/changes/20261019-editorial-reading-system/baseline-identity.json"));
  for (const [file,hash] of Object.entries(baseline.originalReports)) assert.equal(createHash("sha256").update(read(file)).digest("hex"),hash,file);
  assert.equal(baseline.imports.length,15);
  for (const item of baseline.imports) assert.equal(createHash("sha256").update(read(item.path)).digest("hex"),item.sha256,item.path);
});

test("v2 renders raw research without portal events and rejects stale provenance", async () => {
  const file="docs/daily/2026/10/2026-10-18.md", raw=read(file), source=await parseArticle(raw,file);
  assert.equal(source.events,undefined);
  const reader=read("docs/reading/2026-10-18.md"), article=await applyReadingEdition(source,raw,reader,"reader.md",parseArticle);
  assert.equal(article.html,source.html);
  assert.ok(article.events!.some(event=>event.html.includes("<details")));
  assert.ok(article.highlights.some(entry=>entry.id==="arxiv:2610.21121"));
  const stale=structuredClone(matter(reader));stale.data.events[0].sourceRefs=["b-not-a-real-block-1"];
  await assert.rejects(applyReadingEdition(source,raw,matter.stringify(stale.content,stale.data),"reader.md",parseArticle),/stale research block/);
  stale.data.events[0].sourceRefs=matter(reader).data.events[0].sourceRefs;stale.data.events[0].source="https://example.org/invented";
  await assert.rejects(applyReadingEdition(source,raw,matter.stringify(stale.content,stale.data),"reader.md",parseArticle),/invalid primary source/);
});

test("v1 reading editions remain supported after the v2 migration", async () => {
  const file="docs/daily/2026/10/2026-10-03.md",raw=read(file),source=await parseArticle(raw,file),reader=matter(read("docs/reading/2026-10-03.md"));reader.data.version=1;
  const article=await applyReadingEdition(source,raw,matter.stringify(reader.content,reader.data),"v1.md",parseArticle);
  assert.equal(article.events!.length,16);assert.equal(article.contentHash,source.contentHash);
});

test("deep reading emits native sanitized disclosures and retains linkable nested headings", async () => {
  const md='---\nid: test\ndate: "2026-10-19"\ntitle: Test\nstatus: published\nsource_count: 0\n---\n## 正文\n\n正文。\n\n:::details[技术细节]\n\n### 参数说明\n\n可复制的 `参数` 与[来源](https://example.org)。\n\n<script>alert(1)</script>\n\n:::\n';
  const a=await parseArticle(md,"test.md");assert.match(a.html,/<details class="deep-reading"><summary>技术细节<\/summary>/);assert.ok(a.targets.includes("section-参数说明"));assert.ok(!a.html.includes("<script"));
  assert.throws(()=>parseMarkdown(':::iframe[伪装]\n\n正文\n\n:::'),/Only/);
  assert.throws(()=>parseMarkdown(':::details[标题]{onclick="evil"}\n\n正文\n\n:::'),/Only/);
});

test("editorial warnings are suggestions, and independent articles link to real event destinations", async () => {
  const warnings=editorialWarnings(parseMarkdown('## 其他内容\n\n'+"较长的说明。".repeat(70)));
  assert.ok(warnings.some(w=>w.code==="long-paragraph"));assert.ok(warnings.some(w=>w.code==="vague-heading"));
  const {editorials,articles,index,weeks,weeklyEditorials}=await archive;
  assert.equal(editorials.length,3);
  assert.deepEqual(weeks.map(week => week.week), [45, 44, 43, 42, 41, 40, 39, 38]);
  assert.deepEqual(weeklyEditorials.map(week => week.week), [38, 39, 40, 41, 42]);
  assert.equal(index.entries.find(entry=>entry.id==="arxiv:2610.21121")!.anchor,
    articles.find(article=>article.date==="2026-10-18")!.events!.find(event=>event.id==="arxiv:2610.21121")!.anchor);
  for (const [query,id] of [["Make It Flow: Image-to-4D Generation", "arxiv:2610.13860"], ["Residual-Sensitive Dual-Stream", "arxiv:2610.21121"]])
    assert.ok(searchItems(index.search,query,"paper","").some(item=>item.id===id),query);
  for(const article of editorials){
    assert.ok(searchItems(index.search,article.title,"","").some(item=>item.id===article.id&&item.format==="article"));
    for(const link of article.related) assert.ok(articles.find(a=>a.date===link.date)!.events!.some(event=>event.id===link.event));
    assert.ok(article.toc.length>=3);assert.ok(article.disclosure.includes("Codex"));
  }
});

test("event figures sit between intact paragraphs, with their provenance and preview identity", async () => {
  const file="docs/daily/2026/10/2026-10-03.md",raw=read(file),source=await parseArticle(raw,file),reader=matter(read("docs/reading/2026-10-03.md"));
  reader.data.events[0].images=[{...source.events![0].images![0],afterParagraph:1}];
  const article=await applyReadingEdition(source,raw,matter.stringify(reader.content,reader.data),"reader.md",parseArticle);
  const html=article.events![0].html, image=html.indexOf("<figure"), first=html.indexOf("</p>"), next=html.indexOf("<p>",image);
  assert.ok(first<image&&next>image);assert.ok(html.includes("data-preview-key="));assert.ok(html.includes("<figcaption>"));
});
