import assert from "node:assert/strict";
import { test } from "node:test";
import { editorialBackHref, hierarchyParent, isHierarchyLink } from "../lib/reading-hierarchy";

test("the immediate parent uses a real catalogue route and the source used to enter editorial reading", () => {
  assert.equal(hierarchyParent("/gaussian-splatting-daily/topics/webgpu"), "/topics/");
  assert.equal(hierarchyParent("/articles/a", "/topics/webgpu/"), "/topics/webgpu/");
  assert.equal(hierarchyParent("/articles/a", "/papers/"), "/papers/");
  assert.equal(hierarchyParent("/articles/a"), null);
  assert.equal(isHierarchyLink("/topics/", "/gaussian-splatting-daily/topics/webgpu/"), true);
  assert.equal(isHierarchyLink("/topics/webgpu/", "/articles/a/#source"), true);
});

test("a card destination or a link leaving editorial reading never introduces another hierarchy level", () => {
  assert.equal(hierarchyParent("/daily/2026/11/12", "/topics/webgpu/"), null);
  assert.equal(isHierarchyLink("/topics/webgpu/", "/daily/2026/11/12/#source"), false);
  assert.equal(isHierarchyLink("/articles/a/", "/articles/b/"), false);
  assert.equal(isHierarchyLink("/topics/", "/topics/not-a-topic/"), false);
});

test("editorial back targets the recorded parent without hijacking direct or card routes", () => {
  assert.equal(editorialBackHref("/articles/a/", "/topics/webgpu/"), "/topics/webgpu/");
  assert.equal(editorialBackHref("/articles/a/", "/tools/"), "/tools/");
  assert.equal(editorialBackHref("/articles/a/"), null);
  assert.equal(editorialBackHref("/daily/2026/11/12/", "/topics/webgpu/"), null);
});
