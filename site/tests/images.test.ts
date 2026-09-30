import assert from "node:assert/strict";
import test from "node:test";
import { assetUrl, imageKey, imageSrcSet, validImageUrl } from "../lib/images";

test("legacy and archived images share one project path and original-image identity", () => {
  const path = "/gaussian-splatting-daily/media/originals/project.png";
  const image = {
    url: "/media/images/project-960.webp", originalUrl: "/media/originals/project.png",
    alt: "项目场景", credit: "项目", source: "https://example.org/project/",
    variants: [{ url: "/media/images/project-640.webp", width: 640 }],
  };
  assert.equal(imageKey(image), path);
  assert.equal(assetUrl(path), path);
  assert.equal(assetUrl(`https://shuang-su.github.io${path}`), path);
  assert.equal(assetUrl("https://example.org/figure.png"), "https://example.org/figure.png");
  assert.equal(imageSrcSet(image), "/gaussian-splatting-daily/media/images/project-640.webp 640w");
  assert.equal(imageKey({ ...image, originalUrl: undefined }), "/gaussian-splatting-daily/media/images/project-960.webp");
});

test("old HTTPS and site images remain valid while unsafe URL forms are rejected", () => {
  for (const url of ["https://example.org/figure.png", "/covers/legacy.svg", "/media/originals/project.png", "/gaussian-splatting-daily/media/images/project-640.webp"]) {
    assert.equal(validImageUrl(url), true, url);
  }
  for (const url of ["//example.org/image.png", "javascript:alert(1)", "/media/../../outside.png", "file:///image.png"]) {
    assert.equal(validImageUrl(url), false, url);
  }
});
