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

test("saved raster originals and variants decode with the declared dimensions and checksums", async()=>{
 const fs=await import('node:fs');const path=await import('node:path');const {createHash}=await import('node:crypto');const {default:sharp}=await import('sharp');
 const publicRoot=path.resolve(import.meta.dirname,'../public');
 const files=[path.join(publicRoot,'media/manifest.json')];
 const dailyRoot=path.join(publicRoot,'daily-media');
 if(fs.existsSync(dailyRoot))for(const day of fs.readdirSync(dailyRoot))files.push(path.join(dailyRoot,day,'manifest.json'));
 for(const file of files){const manifest=JSON.parse(fs.readFileSync(file,'utf8'));for(const asset of manifest.assets){
  const bytes=fs.readFileSync(path.join(publicRoot,asset.original));assert.equal(createHash('sha256').update(bytes).digest('hex'),asset.originalSha256);
  const original=await sharp(bytes,{animated:false}).metadata();const image=manifest.images[asset.remoteUrl];
  assert.ok(original.width && original.height);assert.equal(image.width,original.width);assert.equal(image.height,original.height);
  for(const variant of image.variants){const decoded=await sharp(fs.readFileSync(path.join(publicRoot,variant.url))).raw().toBuffer({resolveWithObject:true});assert.equal(decoded.info.width,variant.width);assert.ok(variant.width<=image.width);}
 }}
});
