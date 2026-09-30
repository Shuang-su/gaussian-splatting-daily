import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { buildArchive, parseArticle } from "../lib/content";
import { searchItems } from "../lib/search";
test("archive owns papers once and every catalogue entry reaches a real heading", async () => {
  const { articles, index } = await buildArchive();
  assert.equal(
    new Set(index.entries.map((e) => e.id)).size,
    index.entries.length,
  );
  for (const e of index.entries) {
    const a = articles.find((a) => a.date === e.date);
    assert.ok(a);
    assert.ok(
      a.toc.some((t) => t.id === e.anchor),
      `${e.id}: broken anchor`,
    );
    assert.match(e.source, /^https:\/\//);
    assert.ok(e.title);
    assert.ok(e.summary);
  }
  for (const a of articles) {
    assert.equal(
      a.sourceCount,
      index.entries.filter((e) => e.kind === "paper" && e.date === a.date)
        .length,
    );
    assert.match(a.html, /<table(?:\s|>)/);
  }
  assert.ok(
    articles.find((a) => a.date === "2026-09-18")?.text.includes("增量版"),
  );
  const latest=articles.find(a=>a.date==='2026-09-30')!;
  assert.equal(latest.readingGuide?.rows.length,7);
  for(const row of latest.readingGuide!.rows){assert.ok(latest.toc.some(t=>t.id===row.anchor));assert.equal(row.details.length,2);assert.ok(row.sources.length);}
  assert.ok(!latest.readingGuide!.bodyHtml.includes('overview-table'));
  assert.ok(latest.readingGuide!.leadingHtml.includes('观察截至'));
  assert.equal(latest.images.length,11);
});
test("Markdown is sanitized, tables retained and duplicate headings get distinct anchors", async () => {
  const a = await parseArticle(
    '---\nid: gsd-2026-10-01\ndate: "2026-10-01"\ntitle: Test\nstatus: published\nsource_count: 0\n---\n# 今日概览\n## 同名\n[来源](https://example.org)\n<script>alert(1)</script>\n## 同名\n| A | B |\n|---|---|\n| 1 | 2 |',
    "docs/daily/2026/10/2026-10-01.md",
  );
  assert.ok(!a.html.includes("<script>"));
  assert.match(a.html, /<table(?:\s|>)/);
  assert.notEqual(a.toc[0].id, a.toc[1].id);
});
test("Chinese keywords, project names and topics combine without a network backend", async () => {
  const { index } = await buildArchive();
  assert.ok(searchItems(index.search, "分区训练", "", "").length > 0);
  assert.ok(searchItems(index.search, "splattransform", "", "").length > 0);
  assert.ok(
    searchItems(index.search, "", "paper", "slam").every(
      (e) => e.kind === "paper" && e.topics.includes("slam"),
    ),
  );
  assert.equal(
    searchItems(index.search, "不存在的关键词abcdef", "", "").length,
    0,
  );
});

test("source warnings include named unresolved citations and hash exact canonical bytes", async () => {
  const markdown = '---\nid: gsd-2026-10-01\ndate: "2026-10-01"\ntitle: Test\nstatus: published\nsource_count: 0\n---\n# 今日概览\n[原始聊天工具引用，需补一手链接](https://chatgpt.com/share/example)\n[具名来源（原始引用待复核）](https://chatgpt.com/share/example)\n[已核验来源](https://example.org)';
  const article = await parseArticle(markdown, "docs/daily/2026/10/2026-10-01.md");
  assert.equal(article.unresolvedSources, 2);
  assert.equal(article.contentHash, createHash("sha256").update(markdown).digest("hex"));
});
