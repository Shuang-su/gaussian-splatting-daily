import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { createHash } from "node:crypto";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { buildArchive, parseArticle, ROOT } from "../lib/content";
import { searchItems } from "../lib/search";
import ReadingGuide from "../components/ReadingGuide";
test("archive owns papers once and every catalogue entry reaches a rendered target", async () => {
  const { articles, index } = await buildArchive();
  assert.equal(
    new Set(index.entries.map((e) => e.id)).size,
    index.entries.length,
  );
  for (const e of index.entries) {
    const a = articles.find((a) => a.date === e.date);
    assert.ok(a);
    assert.ok(
      a.targets.includes(e.anchor),
      `${e.id}: broken anchor`,
    );
    assert.match(e.source, /^https:\/\//);
    assert.ok(e.title);
    assert.ok(!/值得|这条|本轮|今天最|监控/.test(e.title), `${e.id}: catalogue title is an editorial instruction`);
    assert.ok(e.summary);
    if (e.kind === "paper") {
      assert.equal(e.summary, a.paperSummaries[e.id.slice("arxiv:".length)]);
      assert.match(e.summary, /。$/);
      assert.ok(!/[\n\r→↓]/.test(e.summary), `${e.id}: summary contains a raw diagram or line break`);
    } else if (e.kind === "tool") {
      assert.match(e.summary, /。$/);
    }
  }
  assert.equal(index.entries.filter(e => e.kind === "paper").length, 116);
  const baseline = JSON.parse(fs.readFileSync(`${ROOT}/docs/changes/20261019-editorial-reading-system/baseline-identity.json`, "utf8"));
  for (const entry of baseline.catalogue) { const current = index.entries.find(e => e.id === entry.id)!; assert.ok(current); assert.equal(current.date, entry.date); assert.equal(current.anchor, entry.anchor); }
  assert.equal(index.daily.length, 31);
  assert.ok(index.daily.every(d => !("paperSummaries" in d)));
  const thermal = index.entries.find(e => e.id === "arxiv:2609.24531")!;
  const thermalArticle = articles.find(a => a.date === thermal.date)!;
  assert.equal(thermal.title, "Dynamic Thermal Gaussians: Multimodal 4D Gaussian Splatting");
  assert.ok(thermalArticle.archiveHtml.includes(thermal.title));
  assert.ok((thermalArticle.bodyHtml + thermalArticle.archiveHtml).includes(`id="${thermal.anchor}"`));
  assert.ok(thermalArticle.toc.some(t => t.id === thermal.anchor && t.title === "Dynamic Thermal Gaussians：本轮最值得看的 4DGS 项目"));
  assert.equal(index.entries.find(e => e.id === "arxiv:2609.30245")?.title, "COSA-GS");
  for (const a of articles) {
    assert.equal(
      a.sourceCount,
      index.entries.filter((e) => e.kind === "paper" && e.date === a.date)
        .length,
    );
    assert.match(a.html, /<table(?:\s|>)/);
  }
  assert.ok(
    articles.find((a) => a.date === "2026-09-18")?.archiveHtml.includes("增量版"),
  );
  const latest=articles.find(a=>a.date==='2026-09-30')!;
  assert.equal(latest.readingGuide?.rows.length,0);
  const guideHtml = renderToStaticMarkup(createElement(ReadingGuide, { article: latest }));
  for (const event of latest.events!.filter(e => e.group === 'main')) {
    assert.ok(guideHtml.includes(`href="#${event.anchor}"`));
    assert.ok(guideHtml.includes(event.judgment));
  }
  assert.ok(!guideHtml.includes('完整目录'));
  assert.ok(!latest.readingGuide!.bodyHtml.includes('overview-table'));
  assert.equal(latest.readingGuide!.leadingHtml, '');
  assert.equal(latest.introductionHtml, '');
  assert.ok(latest.archiveHtml.includes('观察截至'));
  assert.ok(latest.archiveHtml.includes('原自动化已于今日上午'));
  assert.ok(!latest.introductionHtml.includes('原自动化已于今日上午'));
  assert.ok(!latest.bodyHtml.includes('以下保留 PR #30 原始 canonical'));
  assert.ok(!latest.bodyHtml.includes('记录与校验口径'));
  assert.ok(!latest.bodyHtml.includes('source_count: 12'));
  assert.ok(latest.archiveHtml.includes('论文指标均为作者报告，未做独立复现'));
  assert.ok(latest.bodyHtml.includes('本期为 9 月 28 日论文的补充收录'));
  assert.ok(latest.archiveHtml.includes('以下保留 PR #30 原始 canonical'));
  assert.ok(latest.archiveHtml.includes('source_count: 12'));
  const archiveHeading=latest.toc.find(t=>t.title==='记录与校验口径')!;
  assert.ok(latest.archiveHtml.includes(`id="${archiveHeading.id}"`));
  assert.equal(latest.images.length,11);
  const spirula=latest.highlights.find(e=>e.id.includes('spirula-studio'))!;
  const mobile=latest.highlights.find(e=>e.id.includes('Mobile-4DGS'))!;
  assert.notEqual(spirula.anchor,mobile.anchor);
  assert.ok(latest.bodyHtml.indexOf(`id="${spirula.anchor}"`)<latest.bodyHtml.indexOf('Spirula Studio v2026.9.30'));
  assert.ok(latest.events!.find(e => e.anchor === mobile.anchor)!.sourceText.includes('CUDA 12.6'));
  for (const id of ["arxiv:2609.36969", "arxiv:2609.35619"]) {
    const entry = index.entries.find(e => e.id === id)!;
    assert.equal(entry.image, undefined, `${id}: a camera or benchmark plot must not become a listing image`);
    assert.ok(latest.images.some(image => image.source === entry.source), `${id}: original figure must remain in the article gallery`);
  }
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
  assert.ok(searchItems(index.search, "Spirula", "tool", "3dgs").length > 0);
  assert.ok(searchItems(index.search, "动态高斯", "paper", "4dgs").length > 0);
  assert.ok(searchItems(index.search, "CollisionSplatting", "paper", "slam").length > 0);
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

test("paper summary metadata uses canonical unversioned IDs and old documents remain compatible", async () => {
  const legacy = '---\nid: gsd-2026-10-01\ndate: "2026-10-01"\ntitle: Test\nstatus: published\nsource_count: 0\n---\n# 今日概览\n## 论文\n旧格式正文。';
  assert.deepEqual((await parseArticle(legacy, "docs/daily/2026/10/2026-10-01.md", {})).paperSummaries, {});
  const invalid = legacy.replace('source_count: 0\n', 'source_count: 0\nportal:\n  paperSummaries:\n    "2609.12345v1": "完整摘要。"\n');
  await assert.rejects(parseArticle(invalid, "docs/daily/2026/10/2026-10-01.md", {}), /invalid paper summary 2609\.12345v1/);
});

const eventMarkdown = `---
id: gsd-2026-10-01
date: "2026-10-01"
title: 示例
status: published
source_count: 0
portal:
  highlights:
    - {id: "github.com/example/spirula/releases/tag/v1", kind: tool, title: "Spirula 分区训练", summary: "发布分区训练", source: "https://github.com/example/spirula/releases/tag/v1", section: "3. 开源项目", topics: []}
    - {id: "github.com/example/mobile/commit/abcdef", kind: tool, title: "Mobile 动态训练", summary: "公开动态训练代码", source: "https://github.com/example/mobile", section: "3. 开源项目", anchor: "event-mobile", topics: []}
    - {id: "github.com/example/format/releases/tag/v1", kind: tool, title: "格式兼容", summary: "格式更新", source: "https://github.com/example/format", section: "3. 开源项目", anchor: "section-4-格式", topics: []}
---
> 历史回填：原始来源链接保留。

# 深度情报日报

**观察截至 2026-10-01 08:00 北京时间。** 原自动化已于今日上午保存论文；此版在同一日期正文里补充项目发布。当前发布包含分区训练与动态渲染。

## 1. 今日最值得看

| 优先级 | 事件 | 可运行程度 | 实际影响 |
| --- | --- | --- | --- |
| P1+ | [Spirula v1](https://github.com/example/spirula/releases/tag/v1) | 只在概览出现的条件 A | 分区训练独有的影响 A |
| P1 | [Mobile](https://github.com/example/mobile) | 只在概览出现的条件 B | 动态渲染独有的影响 B |

窗口内未见新的规范版本。

## 3. 开源项目

**Spirula** 的 [发布说明](https://github.com/example/spirula/releases/tag/v1) 包含分区训练。原段落 A 完整保留。

**Mobile** 的 [源码](https://github.com/example/mobile) 包含动态训练。原段落 B 完整保留。

![重建结果](https://example.org/original.png)

## 4. 格式

[原始项目](https://github.com/example/format) 发布格式更新。
`;

test("event targets distinguish paragraphs in one column and explicit anchors override legacy sections", async () => {
  const article = await parseArticle(eventMarkdown, "docs/daily/2026/10/2026-10-01.md", {});
  const [spirula, mobile, format] = article.highlights;
  assert.match(spirula.anchor, /^event-/);
  assert.equal(mobile.anchor, "event-mobile");
  assert.equal(format.anchor, "section-4-格式");
  assert.notEqual(spirula.anchor, mobile.anchor);
  assert.ok(article.toc.some(t => t.id === "section-3-开源项目"));
  assert.ok(article.targets.includes(spirula.anchor));
  assert.ok(article.bodyHtml.includes(`id="${spirula.anchor}"`));
  assert.ok(article.bodyHtml.includes('id="event-mobile"'));
  assert.ok(article.bodyHtml.indexOf(`id="${spirula.anchor}"`) < article.bodyHtml.indexOf("<strong>Spirula</strong>"));
  assert.ok(article.bodyHtml.indexOf('id="event-mobile"') > article.bodyHtml.indexOf("原段落 A 完整保留"));
  assert.ok(!article.bodyHtml.includes("今日最值得看"));
  assert.ok(!article.bodyHtml.includes("overview-table"));
  for (const fact of ["只在概览出现的条件 A", "分区训练独有的影响 A", "只在概览出现的条件 B", "动态渲染独有的影响 B", "原段落 A 完整保留", "原段落 B 完整保留"])
    assert.ok(article.bodyHtml.includes(fact), `missing fact: ${fact}`);
  assert.ok(article.introductionHtml.includes("观察截至"));
  assert.ok(article.introductionHtml.includes("窗口内未见新的规范版本"));
  assert.ok(!article.introductionHtml.includes("原自动化已于"));
  assert.ok(article.archiveHtml.includes("原自动化已于"));
  assert.ok(article.archiveHtml.includes("历史回填"));
  assert.equal(article.contentHash, createHash("sha256").update(eventMarkdown).digest("hex"));
});

test("Markdown figures use local variants while keeping their original-image gallery identity and source", async () => {
  const media = {
    "https://example.org/original.png": {
      url: "/media/result-680.webp", originalUrl: "/media/result-original.png",
      width: 680, height: 400, source: "https://example.org/project", credit: "项目作者", alt: "官方重建图",
      variants: [{ url: "/media/result-340.webp", width: 340 }, { url: "/media/result-680.webp", width: 680 }],
    },
  };
  const article = await parseArticle(eventMarkdown, "docs/daily/2026/10/2026-10-01.md", media);
  const image = article.images[0];
  assert.equal(image.originalUrl, "/media/result-original.png");
  assert.equal(image.alt, "官方重建图");
  assert.equal(image.source, "https://example.org/project");
  assert.match(article.bodyHtml, /src="\/gaussian-splatting-daily\/media\/result-680.webp"/);
  assert.match(article.bodyHtml, /data-preview-key="\/gaussian-splatting-daily\/media\/result-original.png"/);
  assert.match(article.bodyHtml, /srcset="[^\"]*result-340.webp 340w/);
  assert.match(article.bodyHtml, /width="680" height="400"/);
  assert.match(article.bodyHtml, /data-image-source="https:\/\/example.org\/project"/);
  assert.match(article.bodyHtml, /alt="官方重建图"/);
  assert.match(article.bodyHtml, /data-original-alt="重建结果"/);
});
