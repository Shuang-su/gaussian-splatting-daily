import assert from "node:assert/strict";
import { test } from "node:test";
import { pullGeometry, pullKinematics, shouldDismiss } from "../lib/card-pull-dismiss";

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

test("long pulls and intentional flicks can dismiss, but short pulls and brakes do not", () => {
  assert.equal(shouldDismiss(116, 0), true);
  assert.equal(shouldDismiss(62, .65), true);
  assert.equal(shouldDismiss(42, 1.2), true);
  assert.equal(shouldDismiss(41, 3), false);
  assert.equal(shouldDismiss(115, -.8), false);
  assert.equal(shouldDismiss(62, .65, -.02), false);
});

test("recent samples identify acceleration, braking and a hold before release", () => {
  const times = [0, 20, 40, 60, 80];
  const samples = (positions: number[]) => positions.map((distance, index) => ({ distance, time: times[index] }));
  const flick = pullKinematics(samples([0, 4, 11, 30, 62]), 82);
  assert.ok(flick.velocity > 1 && flick.acceleration > 0);
  assert.ok(shouldDismiss(62, flick.velocity, flick.acceleration));
  const brake = pullKinematics(samples([0, 22, 52, 60, 62]), 82);
  assert.ok(brake.acceleration < 0);
  assert.equal(shouldDismiss(62, brake.velocity, brake.acceleration), false);
  assert.deepEqual(pullKinematics(samples([0, 4, 11, 30, 62]), 140), { velocity: 0, acceleration: 0 });
});
