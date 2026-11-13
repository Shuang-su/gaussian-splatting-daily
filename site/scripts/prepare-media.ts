import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import type { SourceImage } from "../lib/types";

interface MediaAsset {
  key: string;
  remoteUrl: string;
  original: string;
  originalSha256: string;
  sourceSha256: string;
  frame?: { index?: number; seconds?: number };
  image: Pick<SourceImage, "alt" | "source" | "credit" | "position" | "fit">;
}

interface MediaManifest {
  schemaVersion: 1;
  images: Record<string, SourceImage>;
  assets: MediaAsset[];
}

const siteRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const publicArg = process.argv.indexOf("--public-root");
if (publicArg >= 0 && !process.argv[publicArg + 1]) throw Error("Provide a path after --public-root");
const publicRoot = publicArg < 0 ? path.join(siteRoot, "public") : path.resolve(process.argv[publicArg + 1]);
const dateArg = process.argv.indexOf("--date");
const reportDate = dateArg < 0 ? undefined : process.argv[dateArg + 1];
if (dateArg >= 0 && !/^\d{4}-\d{2}-\d{2}$/.test(reportDate || "")) throw Error("Provide --date YYYY-MM-DD");
const mediaRoot = reportDate ? path.join(publicRoot,"daily-media",reportDate) : path.join(publicRoot, "media");
const prefix = reportDate ? `/daily-media/${reportDate}` : "/media";
const outputRoot = reportDate ? mediaRoot : path.join(mediaRoot,"images");
const manifestFile = path.join(mediaRoot, "manifest.json");
const manifest: MediaManifest = JSON.parse(await fs.readFile(manifestFile, "utf8"));
const images: Record<string, SourceImage> = {};

await fs.mkdir(outputRoot, { recursive: true });

for (const asset of manifest.assets) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(asset.key)) {
    throw new Error(`Invalid media key: ${asset.key}`);
  }
  if (!asset.original.startsWith(reportDate ? `${prefix}/` : "/media/originals/")) {
    throw new Error(`Invalid original path: ${asset.original}`);
  }
  const original = path.resolve(publicRoot, `.${asset.original}`);
  if (!original.startsWith((reportDate ? mediaRoot : path.join(mediaRoot, "originals")) + path.sep)) {
    throw new Error(`Original is outside media/originals: ${asset.key}`);
  }
  const bytes = await fs.readFile(original);
  if (createHash("sha256").update(bytes).digest("hex") !== asset.originalSha256) {
    throw new Error(`Original checksum differs: ${asset.key}`);
  }
  const metadata = await sharp(bytes, { animated: false }).metadata();
  if (!metadata.width || !metadata.height) {
    throw new Error(`Original has no dimensions: ${asset.key}`);
  }
  const swapsAxes = metadata.orientation && metadata.orientation >= 5;
  const width = swapsAxes ? metadata.height : metadata.width;
  const height = swapsAxes ? metadata.width : metadata.height;
  const widths = [...new Set([640, 960, 1600].map((size) => Math.min(size, width)))];
  const variants: NonNullable<SourceImage["variants"]> = [];
  for (const size of widths) {
    const filename = `${asset.key}-${size}.webp`;
    const info = await sharp(bytes, { animated: false })
      .rotate()
      .resize({ width: size, withoutEnlargement: true })
      .webp({ quality: 84, effort: 5 })
      .toFile(path.join(outputRoot, filename));
    variants.push({ url: `${prefix}${reportDate ? "" : "/images"}/${filename}`, width: info.width });
  }
  const defaultImage = variants.find((variant) => variant.width >= 960) ?? variants.at(-1)!;
  if (images[asset.remoteUrl]) {
    throw new Error(`Repeated remote source: ${asset.remoteUrl}`);
  }
  images[asset.remoteUrl] = {
    ...asset.image,
    url: defaultImage.url,
    originalUrl: asset.original,
    width,
    height,
    variants,
  };
}

manifest.images = images;
await fs.writeFile(manifestFile, JSON.stringify(manifest, null, 2) + "\n");
console.log(`Prepared ${manifest.assets.length} local images from saved originals.`);
