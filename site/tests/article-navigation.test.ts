import { test } from "node:test";
import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { articleNavigation } from "../lib/article-navigation";
import { buildArchive } from "../lib/content";
import ArticleNavigation from "../components/ArticleNavigation";

test("each historical daily renders thirteen theme links to real coverage and preserves its later increment", async () => {
  const { articles } = await buildArchive();
  for (const article of articles.filter(a => !["2026-10-21","2026-10-22","2026-10-23","2026-10-24"].includes(a.date))) {
    const navigation = articleNavigation(article.toc);
    const core = navigation.filter(item => item.key !== "increment");
    assert.equal(core.length, 13, `${article.date}: missing a theme`);
    assert.equal(new Set(core.map(item => item.id)).size, 13, `${article.date}: themes reuse unrelated coverage`);
    for (const item of navigation) {
      assert.ok(article.toc.some(heading => heading.id === item.id), `${article.date}: invented anchor ${item.id}`);
      assert.ok(article.targets.includes(item.id), `${article.date}: target not rendered ${item.id}`);
      if (item.key !== "highlights") assert.ok(`${article.introductionHtml}${article.bodyHtml}${article.archiveHtml}`.includes(`id="${item.id}"`));
    }
    const html = renderToStaticMarkup(createElement(ArticleNavigation, { toc: article.toc, collapsed: true }));
    assert.equal((html.match(/<a href=/g) || []).length, article.date === "2026-09-18" ? 14 : 13);
    assert.equal(navigation.filter(item => item.key === "increment").length, article.date === "2026-09-18" ? 1 : 0);
  }
  const report = (date: string) => articles.find(article => article.date === date)!;
  const headingFor = (date: string, key: string) => {
    const article = report(date);
    const item = articleNavigation(article.toc).find(item => item.key === key)!;
    return article.toc.find(heading => heading.id === item.id)!.title;
  };
  assert.equal(headingFor("2026-09-19", "open-source"), "21. fVDB / NVIDIA/OpenVDB：v0.6.0 正式发布");
  assert.equal(headingFor("2026-09-25", "papers"), "GaussPDE：把 Gaussian 本身当 PDE 离散域");
  assert.equal(headingFor("2026-09-26", "viewer"), "3. SuperSplat Viewer：v1.35.2 正式发布");
  assert.equal(headingFor("2026-09-26", "papers"), "COSA-GS：今天最值得看的论文+代码压缩路线");
  assert.equal(headingFor("2026-09-27", "viewer"), "31. Mobile / XR 补录：SplatKit 值得进入固定监控");
});

test("missing topics do not receive a fabricated or unrelated fallback link", () => {
  const toc = [{ id: "existing", title: "1. 今日最值得看", depth: 2 }, { id: "conclusion", title: "今日结论", depth: 2 }];
  assert.deepEqual(articleNavigation(toc), [{ key: "highlights", id: "existing", title: "1. 今日最值得看" }]);
});
