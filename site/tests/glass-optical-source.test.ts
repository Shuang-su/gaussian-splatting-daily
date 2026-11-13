import assert from "node:assert/strict";
import { test } from "node:test";
import { intersectsOpticalBox } from "../lib/glass-optical-source";

test("a lens samples only boxes intersecting its padded optical region", () => {
  const strip = { left: 70, top: 0, width: 100, height: 104 };
  assert.equal(intersectsOpticalBox({ left: 12, top: -60, width: 320, height: 130 }, strip), true);
  assert.equal(intersectsOpticalBox({ left: 12, top: 104, width: 320, height: 130 }, strip), false);
  assert.equal(intersectsOpticalBox({ left: 0, top: 20, width: 70, height: 24 }, strip), false);
  assert.equal(intersectsOpticalBox({ left: 90, top: 20, width: 0, height: 24 }, strip), false);
});
