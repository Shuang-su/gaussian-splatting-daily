import { test } from "node:test";
import assert from "node:assert/strict";
import { buildArchive } from "../lib/content";
import { searchItems } from "../lib/search";

test("October reports extend the archive without re-owning earlier papers or losing corrections", async () => {
  const { articles, index } = await buildArchive();
  assert.equal(index.updatedThrough, "2026-10-03");
  assert.deepEqual(articles.map(a => a.date), Array.from({ length: 16 }, (_, i) => new Date(Date.UTC(2026, 9, 3 - i)).toISOString().slice(0, 10)));
  const october = articles.filter(a => a.date >= "2026-10-01");
  assert.deepEqual(october.map(a => a.sourceCount), [10, 0, 0]);
  assert.deepEqual(october.map(a => a.events!.filter(e => e.group === "main").length), [7, 6, 4]);
  for (const a of october) {
    assert.ok(a.issue);
    assert.ok(a.prs.length >= 2);
    assert.ok(a.headline.length > 15);
    assert.ok(a.summary.endsWith("。"));
    assert.equal(a.image!.originalUrl, a.events!.flatMap(e => e.images || []).find(i => i.originalUrl === a.image!.originalUrl)?.originalUrl);
  }
  const corrected = october[0];
  assert.equal(corrected.status, "corrected");
  assert.ok(corrected.prs.includes(44));
  assert.ok(corrected.bodyHtml.includes("setCamera(camera)"));
  assert.ok(corrected.bodyHtml.includes("autoAdvanceStochasticSample"));
  assert.ok(corrected.bodyHtml.includes("间隔"));
  assert.ok(!corrected.bodyHtml.includes("update(camera)"));
  assert.equal(Object.keys(corrected.paperSummaries).length, 10);
  assert.equal(index.entries.find(e => e.id === "arxiv:2610.01744")!.title, "3DROID: A Dataset for 3D Reconstruction in Robotics");
  assert.equal(searchItems(index.search, "3DROID", "paper", "").length, 1);
  assert.equal(index.entries.find(e => e.id === "arxiv:2609.36693")!.date, "2026-09-30");
  for (const query of ["ARKit", "LuluSplat", "3DROID"]) assert.ok(searchItems(index.search, query, "", "").some(item => item.date >= "2026-10-01"));
});
