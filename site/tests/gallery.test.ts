import test from "node:test";
import assert from "node:assert/strict";
import { clampOffset, fitImage, normalizeRotation, panLimits, swipeDirection, zoomAt } from "../lib/gallery";

test("wide and portrait originals fit the stage after quarter-turn rotations", () => {
  const stage = { width: 600, height: 400 };
  assert.deepEqual(fitImage({ width: 1200, height: 800 }, stage, 0), stage);
  const rotated = fitImage({ width: 1200, height: 800 }, stage, 90);
  assert.ok(Math.abs(rotated.width - 400) < 1e-8);
  assert.ok(Math.abs(rotated.height - 800 / 3) < 1e-8);
  const portrait = fitImage({ width: 400, height: 1600 }, stage, 270);
  assert.ok(Math.abs(portrait.width - 150) < 1e-8);
  assert.ok(Math.abs(portrait.height - 600) < 1e-8);
  assert.equal(normalizeRotation(-90), 270);
  assert.deepEqual(fitImage({ width: 100, height: 60 }, stage, 0), { width: 100, height: 60 });
});

test("pan limits let every zoomed edge reach the stage and prevent empty overscroll", () => {
  const image = { width: 600, height: 400 };
  const stage = { width: 600, height: 400 };
  assert.deepEqual(panLimits(image, stage, 2, 0), { x: 300, y: 200 });
  assert.deepEqual(clampOffset({ x: 1000, y: -1000 }, image, stage, 2, 0), { x: 300, y: -200 });
  assert.deepEqual(clampOffset({ x: 100, y: 100 }, image, stage, 1, 0), { x: 0, y: 0 });
  const rotated = panLimits(image, stage, 2, 90);
  assert.ok(Math.abs(rotated.x - 100) < 1e-8);
  assert.ok(Math.abs(rotated.y - 400) < 1e-8);
});

test("pinch zoom keeps its original point under the moving two-finger midpoint", () => {
  const view = { scale: 1, rotation: 90, offset: { x: 10, y: -20 } };
  const result = zoomAt(view, 2, { x: 100, y: 50 }, { x: 120, y: 80 });
  assert.deepEqual(result, { scale: 2, rotation: 90, offset: { x: -60, y: -60 } });
  assert.equal(zoomAt(view, 20, { x: 0, y: 0 }).scale, 4);
  assert.equal(zoomAt(view, 0.1, { x: 0, y: 0 }).scale, 1);
  const maximum = { scale: 4, rotation: 0, offset: { x: -60, y: 20 } };
  assert.deepEqual(zoomAt(maximum, 8, { x: 100, y: 50 }, { x: 140, y: 30 }).offset, { x: -20, y: 0 });
});

test("all four sides remain reachable after fitting a wide or tall original to a phone", () => {
  const stage = { width: 343, height: 550 };
  for (const source of [{ width: 3200, height: 900 }, { width: 700, height: 4800 }]) {
    for (const rotation of [0, 90, 180, 270]) {
      const image = fitImage(source, stage, rotation);
      const limits = panLimits(image, stage, 4, rotation);
      const rotatedWidth = (rotation % 180 === 0 ? image.width : image.height) * 4;
      const rotatedHeight = (rotation % 180 === 0 ? image.height : image.width) * 4;
      for (const sign of [-1, 1]) {
        const corner = clampOffset({ x: sign * 1e6, y: sign * 1e6 }, image, stage, 4, rotation);
        assert.ok(Math.abs(corner.x - sign * limits.x) < 1e-8);
        assert.ok(Math.abs(corner.y - sign * limits.y) < 1e-8);
        if (limits.x > 0) assert.ok(Math.abs(sign * rotatedWidth / 2 - corner.x - sign * stage.width / 2) < 1e-8);
        if (limits.y > 0) assert.ok(Math.abs(sign * rotatedHeight / 2 - corner.y - sign * stage.height / 2) < 1e-8);
      }
    }
  }
});

test("swipes reject vertical scrolling and short movements", () => {
  assert.equal(swipeDirection({ x: -100, y: 20 }), 1);
  assert.equal(swipeDirection({ x: 100, y: -20 }), -1);
  assert.equal(swipeDirection({ x: 70, y: 70 }), 0);
  assert.equal(swipeDirection({ x: 100, y: 85 }), 0);
  assert.equal(swipeDirection({ x: 59, y: 0 }), 0);
});
