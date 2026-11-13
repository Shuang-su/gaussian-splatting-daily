import fs from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";
import { pathToFileURL } from "node:url";
import sharp, { type OverlayOptions } from "sharp";
import { buildArchive, ROOT } from "../lib/content";
import type { PortalIndex } from "../lib/types";

const WIDTH = 1200;
const HEIGHT = 630;
const PUBLIC = path.join(ROOT, "site/public");
const OUTPUT = path.join(PUBLIC, "share");
const FONT_DIRECTORY = path.join(ROOT, "site/assets/fonts");
const DEFAULT_FONT = path.join(FONT_DIRECTORY, "NotoSansSC-Variable.ttf");
const LAYOUT_VERSION = 1;

function escapeMarkup(value: string) {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
}

function sha256(bytes: Buffer) {
  return createHash("sha256").update(bytes).digest("hex");
}

function localImagePath(url: string) {
  if (!url.startsWith("/media/")) {
    throw new Error(`Share images require an archived local cover: ${url}`);
  }
  const file = path.resolve(PUBLIC, `.${url}`);
  if (!file.startsWith(path.join(PUBLIC, "media") + path.sep)) {
    throw new Error(`Invalid share cover path: ${url}`);
  }
  return file;
}

function chineseDate(date: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error(`Invalid report date: ${date}`);
  const [year, month, day] = date.split("-").map(Number);
  return `${year} 年 ${month} 月 ${day} 日`;
}

async function configureFont() {
  const font = process.env.SHARE_FONT_PATH ? path.resolve(process.env.SHARE_FONT_PATH) : DEFAULT_FONT;
  const fontBytes = await fs.readFile(font);
  const sources = JSON.parse(await fs.readFile(path.join(FONT_DIRECTORY, "sources.json"), "utf8"));
  const expectedHash = sources.files.find((file: { file: string }) => file.file === path.basename(DEFAULT_FONT))?.sha256;
  if (font === DEFAULT_FONT && sha256(fontBytes) !== expectedHash) {
    throw new Error("The bundled Noto Sans SC font does not match its source SHA-256.");
  }

  // libvips can ship without a system Fontconfig configuration on macOS.
  // Register the bundled font and keep its cache inside this checkout on every OS.
  const cache = path.join(ROOT, ".codex-work/cache/share-fontconfig");
  const temporary = path.join(ROOT, ".codex-work/tmp");
  await fs.mkdir(cache, { recursive: true });
  await fs.mkdir(temporary, { recursive: true });
  const config = path.join(temporary, "share-fonts.conf");
  await fs.writeFile(config,
    `<?xml version="1.0"?>\n<!DOCTYPE fontconfig SYSTEM "urn:fontconfig:fonts.dtd">\n<fontconfig><dir>${escapeMarkup(path.dirname(font))}</dir><cachedir>${escapeMarkup(cache)}</cachedir></fontconfig>\n`,
  );
  process.env.FONTCONFIG_FILE = config;
  return { path: font, hash: sha256(fontBytes), family: process.env.SHARE_FONT_FAMILY || "Noto Sans SC", source: font === DEFAULT_FONT ? sources.repository : undefined };
}

type TextSettings = { size: number; width: number; maxHeight?: number; color?: string; weight?: string; spacing?: number };

async function textLayer(text: string, font: Awaited<ReturnType<typeof configureFont>>, settings: TextSettings) {
  for (let size = settings.size; size >= Math.min(28, settings.size); size -= 2) {
    const { data, info } = await sharp({
      text: {
        text: `<span foreground="${settings.color || "#151515"}" weight="${settings.weight || "normal"}">${escapeMarkup(text)}</span>`,
        font: `${font.family} ${size}`,
        fontfile: font.path,
        width: settings.width,
        wrap: "word-char",
        spacing: settings.spacing ?? 12,
        rgba: true,
      },
    }).png().toBuffer({ resolveWithObject: true });
    if (!settings.maxHeight || info.height <= settings.maxHeight) return { data, info };
  }
  throw new Error(`Share title is too long to fit: ${text}`);
}

export async function buildShareImages(index: PortalIndex) {
  if (!index.daily.length) throw new Error("At least one published report is required for the default share image.");
  await fs.mkdir(OUTPUT, { recursive: true });
  const font = await configureFont();
  const logo = await fs.readFile(path.join(PUBLIC, "metaflow-logo.svg"));
  const logoMetadata = await sharp(logo).metadata();
  if (!logoMetadata.width || !logoMetadata.height) throw new Error("Metaflow logo has no intrinsic dimensions.");
  const markWidth = 45;
  const markHeight = Math.round(markWidth * logoMetadata.height / logoMetadata.width);
  // Only the colour changes for the light background; all original SVG paths remain intact.
  const blackLogo = Buffer.from(logo.toString("utf8").replaceAll('fill="white"', 'fill="#151515"'));
  const mark = await sharp(blackLogo).resize({ width: markWidth, height: markHeight, fit: "inside" }).png().toBuffer();
  const brand = await textLayer("高斯日报", font, { size: 32, width: 250, weight: "semibold" });
  const canvas = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}"><rect width="${WIDTH}" height="${HEIGHT}" fill="#fff"/><path d="M52 144H1148" stroke="#dedede"/><path d="M52 583H92" stroke="#d72626" stroke-width="3"/></svg>`);
  const reports: Record<string, {
    date: string; url: string; title: string; contentHash: string; inputHash: string; sha256: string;
    bytes: number; cover?: { url: string; source: string; credit: string; sha256: string; kind?: "editorial-illustration" };
  }> = {};

  for (const daily of [...index.daily].sort((a, b) => a.date.localeCompare(b.date))) {
    const dateText = await textLayer(chineseDate(daily.date), font, { size: 28, width: 600, color: "#666666" });
    const title = await textLayer(daily.headline.replaceAll("，", "，\n"), font, {
      size: daily.image ? 40 : 56, width: daily.image ? 522 : 1070,
      maxHeight: daily.image ? 296 : 274, weight: "bold", spacing: 14,
    });
    const layers: OverlayOptions[] = [
      { input: mark, left: 52, top: 54 },
      { input: brand.data, left: 116, top: 55 },
      { input: title.data, left: 52, top: Math.round((daily.image ? 362 : 356) - title.info.height / 2) },
      { input: dateText.data, left: 52, top: 532 },
    ];
    let cover: (typeof reports)[string]["cover"];
    if (daily.image) {
      const coverBytes = await fs.readFile(localImagePath(daily.image.originalUrl || daily.image.url));
      const renderedCover = await sharp(coverBytes).rotate().resize({
        width: 520, height: 336, fit: "contain", withoutEnlargement: true,
        background: "#f6f6f6",
      }).flatten({ background: "#f6f6f6" }).png().toBuffer();
      layers.push({ input: renderedCover, left: 628, top: 184 });
      const credit = await textLayer(daily.image.credit, font, { size: 18, width: 520, maxHeight: 52, color: "#757575", spacing: 4 });
      layers.push({ input: credit.data, left: 628, top: 538 });
      cover = { url: daily.image.originalUrl || daily.image.url, source: daily.image.source, credit: daily.image.credit, sha256: sha256(coverBytes), ...(daily.image.kind ? { kind: daily.image.kind } : {}) };
    }
    const png = await sharp(canvas).composite(layers).png({ compressionLevel: 9 }).toBuffer();
    const url = `/share/${daily.date}.png`;
    await fs.writeFile(path.join(OUTPUT, `${daily.date}.png`), png);
    const inputHash = sha256(Buffer.from(JSON.stringify({
      layoutVersion: LAYOUT_VERSION, date: daily.date, title: daily.headline,
      contentHash: daily.contentHash, cover, logoHash: sha256(logo), fontHash: font.hash,
    })));
    reports[daily.date] = { date: daily.date, url, title: daily.headline, contentHash: daily.contentHash, inputHash, sha256: sha256(png), bytes: png.length, ...(cover ? { cover } : {}) };
  }
  const latest = [...index.daily].sort((a, b) => b.date.localeCompare(a.date))[0];
  const latestImage = await fs.readFile(path.join(OUTPUT, `${latest.date}.png`));
  await fs.writeFile(path.join(OUTPUT, "default.png"), latestImage);
  await fs.writeFile(path.join(OUTPUT, "manifest.json"), JSON.stringify({
    schemaVersion: 1, width: WIDTH, height: HEIGHT, layoutVersion: LAYOUT_VERSION,
    font: { family: font.family, sha256: font.hash, source: font.source },
    logo: { source: "/metaflow-logo.svg", sha256: sha256(logo), intrinsicWidth: logoMetadata.width, intrinsicHeight: logoMetadata.height, renderedWidth: markWidth, renderedHeight: markHeight },
    default: { url: "/share/default.png", date: latest.date, sha256: sha256(latestImage) }, reports,
  }, null, 2) + "\n");
  console.log(`Generated ${index.daily.length + 1} share images at ${WIDTH} × ${HEIGHT}.`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const { index } = await buildArchive();
  await buildShareImages(index);
}
