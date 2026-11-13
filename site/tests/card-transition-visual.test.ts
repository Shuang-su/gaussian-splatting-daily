import assert from "node:assert/strict";
import { test } from "node:test";
import { captureCard, matchingCardImages, type CardVisual } from "../lib/card-transition-visual";

test("a title-only origin captures a morphable visual without fabricating media", () => {
  const style = { backgroundColor: "#fff", borderRadius: "12px", getPropertyValue: () => "" };
  const styleDescriptor = Object.getOwnPropertyDescriptor(globalThis, "getComputedStyle");
  const node = {
    cloneNode() { return { removeAttribute() {}, querySelectorAll: () => [], style: { setProperty() {} } }; },
    getBoundingClientRect: () => ({ x: 16, y: 200, width: 380, height: 70 }),
    querySelectorAll: () => [],
    querySelector(selector: string) { return selector === "h1, h2, h3" ? this : null; },
  };
  Object.defineProperty(globalThis, "getComputedStyle", { value: () => style, configurable: true });
  try {
    const visual = captureCard(node as unknown as HTMLElement);
    assert.ok(visual);
    assert.equal(visual.image, undefined);
    assert.equal(visual.title.rect.width, 380);
    assert.equal(visual.surface?.radius, 12);
    assert.ok(matchingCardImages(visual, {}));
  } finally {
    if (styleDescriptor) Object.defineProperty(globalThis, "getComputedStyle", styleDescriptor);
    else Reflect.deleteProperty(globalThis, "getComputedStyle");
  }
});

test("a shared image requires matching identity and presence at both endpoints", () => {
  const cover = (key: string) => ({ image: { key } as NonNullable<CardVisual["image"]> });
  assert.ok(matchingCardImages(cover("shared"), cover("shared")));
  assert.equal(matchingCardImages(cover("shared"), cover("other")), false);
  assert.equal(matchingCardImages(cover("shared"), {}), false);
});
