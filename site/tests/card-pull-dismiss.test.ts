import assert from "node:assert/strict";
import { test } from "node:test";
import { pullGeometry, shouldDismiss } from "../lib/card-pull-dismiss";

test("a pulled article follows the finger while its horizontal center stays anchored", () => {
  const width = 390;
  const height = 844;
  const start = pullGeometry(0, width, height);
  const pull = pullGeometry(130, width, height);
  assert.deepEqual(start.rect, { x: 0, y: 0, width, height });
  assert.equal(pull.rect.y, 130);
  assert.equal(pull.rect.x + pull.rect.width / 2, width / 2);
  assert.ok(pull.scale < 1 && pull.radius > 0);
});

test("dismissal requires a sustained pull or a sufficiently fast intentional flick", () => {
  assert.equal(shouldDismiss(116, 0), true);
  assert.equal(shouldDismiss(56, .65), true);
  assert.equal(shouldDismiss(115, -.8), false);
  assert.equal(shouldDismiss(55, 2), false);
});
