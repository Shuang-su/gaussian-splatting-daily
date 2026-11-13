import { test } from "node:test";
import assert from "node:assert/strict";
import matter from "gray-matter";
import { parseArticle } from "../lib/content";
import { parseRevisions } from "../lib/revisions";
import { sourceBlocks } from "../lib/editorial";
import { parseMarkdown } from "../lib/markdown";
import { giscusCount, readerFontSize, readerShareUrl, readerThreadTerm, restoreReaderScroll } from "../lib/reader";
import type { ReaderIdentity } from "../lib/reader";
import { READ_LATER_KEY, readSavedArticles, writeSavedArticles } from "../lib/read-later";

const article: ReaderIdentity = { id: "gsd-2026-10-31", title: "日报", url: "/daily/2026/10/31/", kind: "daily", date: "2026-10-31" };

test("reader preferences and sharing retain safe defaults and local preview destinations", () => {
  for (const input of [null, "", "13", "14.5", "25", "NaN"]) assert.equal(readerFontSize(input), null);
  for (const size of [14, 17, 24]) assert.equal(readerFontSize(String(size)), size);
  assert.equal(readerShareUrl(article, new URL("https://metaflow.shuang-su.com/horizon/daily/2026/10/31?giscus=abc#section")), "https://metaflow.shuang-su.com/horizon/daily/2026/10/31/");
  assert.equal(readerShareUrl(article, new URL("http://127.0.0.1:4388/horizon/daily/2026/10/31/?commentFixture=mixed#section")), "http://127.0.0.1:4388/horizon/daily/2026/10/31/");
  assert.equal(readerThreadTerm(article), "gsd-2026-10-31::daily");
  assert.equal(readerThreadTerm(article, "event-a"), "gsd-2026-10-31::event::event-a");
  assert.equal(readerThreadTerm({ ...article, id: "article:gaussians", kind: "editorial" }), "article:gaussians::article");
});

test("Giscus count uses only validated top-level count and GitHub discussion links", () => {
  const repo = "Shuang-su/metaflow-horizon";
  const url = `https://github.com/${repo}/discussions/42`;
  const valid = { totalCommentCount: 2, totalReplyCount: 5, url, repository: { nameWithOwner: repo } };
  assert.deepEqual(giscusCount(valid, repo), { count: 2, url });
  assert.equal(giscusCount({ ...valid, totalCommentCount: -1 }, repo), null);
  assert.equal(giscusCount({ ...valid, url: "https://elsewhere.example/42" }, repo), null);
  assert.equal(giscusCount({ ...valid, repository: { nameWithOwner: "other/repo" } }, repo), null);
  assert.equal(giscusCount(undefined, repo), null);
});

test("revisions are optional, sanitize Markdown and retain stable date-ordered anchors", async () => {
  assert.equal(await parseRevisions(undefined, article.date, "sample"), undefined);
  const early = { id: "update-1", date: "2026-10-31", title: "修订", body: "**补充**[^source]\n\n[^source]: 参考说明" };
  const late = { id: "update-3", date: "2026-11-01", title: "增补", body: "<script>alert(1)</script>\n\n[链接](javascript:alert)" };
  const revisions = (await parseRevisions([early, late], article.date, "sample"))!;
  assert.deepEqual(revisions.map(entry => entry.id), ["update-3", "update-1"]);
  assert.match(revisions[1].html, /<strong>补充<\/strong>/);
  assert.match(revisions[1].html, /href="#update-1-fn-source"/);
  assert.match(revisions[1].html, /id="update-1-footnote-label"/);
  assert.doesNotMatch(revisions[0].html, /script|javascript/);
  await assert.rejects(parseRevisions([early, early], article.date, "sample"), /invalid revision/);
  await assert.rejects(parseRevisions([{ ...late, date: "2026-11-31" }], article.date, "sample"), /invalid revision/);
  await assert.rejects(parseRevisions([{ ...early, body: "缺少[^source]" }], article.date, "sample"), /undefined footnote/);
});

test("projected daily events keep references and a single separately rendered footnote section", async () => {
  const body = "## 第一条\n\n正文[^source]，再次提及[^source]。\n\n[^source]: 参考说明\n";
  const blocks = sourceBlocks(parseMarkdown(body).children, body);
  const data = {
    id: article.id, date: article.date, title: article.title, status: "published", source_count: 0,
    portal: {
      layout: "events", editorial: {
        version: 1, introduction: [], archive: [], omit: [],
        events: [{ id: "sample", title: "第一条", anchor: "sample", group: "brief", blocks: blocks.map(block => block.key), tags: {
          techniques: ["3dgs"], projects: [], content: ["analysis"], sources: ["official"],
        } }],
      },
    },
  };
  const canonical = await parseArticle(matter.stringify(body, data), "docs/daily/example.md");
  const reading = await parseArticle(matter.stringify(body, data), "docs/reading/example.md");
  assert.match(canonical.events![0].html, /href="#user-content-fn-source"/);
  assert.match(reading.events![0].html, /href="#reader-fn-source"/);
  assert.match(reading.events![0].html, /id="reader-fnref-source-2"/);
  assert.match(reading.footnotesHtml!, /id="reader-fn-source"/);
  assert.match(reading.footnotesHtml!, /id="reader-footnote-label"/);
  assert.match(reading.footnotesHtml!, /href="#reader-fnref-source-2"/);
  assert.doesNotMatch(reading.events![0].html, /data-footnotes/);
  assert.equal(reading.toc.some(item => item.title === "脚注"), false);
  const ids = [...(reading.events![0].html + reading.footnotesHtml + canonical.html).matchAll(/\bid="([^"]+)"/g)].map(match => match[1]).filter(id => /(?:-fn|footnote-label)/.test(id));
  assert.equal(new Set(ids).size, ids.length);
});

test("OAuth reading return accepts only finite offsets and clamps to the current document", () => {
  assert.equal(restoreReaderScroll(635.5, 1000), 635.5);
  assert.equal(restoreReaderScroll(1200, 1000), 1000);
  assert.equal(restoreReaderScroll(-30, 1000), 0);
  assert.equal(restoreReaderScroll(30, -10), 0);
  assert.equal(restoreReaderScroll(Infinity, 1000), null);
  assert.equal(restoreReaderScroll("635", 1000), null);
});

test("read later migrates known bookmarks atomically and does not resurrect removed items", () => {
  const entries = new Map([
    ["gsd:reading-bookmark:v1:" + article.id, "1"],
    ["gsd:reading-bookmark:v1:unknown", "1"],
  ]);
  const storage = {
    getItem: (key: string) => entries.get(key) ?? null,
    setItem: (key: string, value: string) => entries.set(key, value),
  } as unknown as Storage;
  assert.deepEqual(readSavedArticles(storage, [article]), [article.id]);
  assert.deepEqual(JSON.parse(entries.get(READ_LATER_KEY)!), { migrated: true, ids: [article.id] });
  writeSavedArticles(storage, []);
  assert.deepEqual(readSavedArticles(storage, [article]), []);
  assert.equal(entries.get("gsd:reading-bookmark:v1:" + article.id), "1");
});
