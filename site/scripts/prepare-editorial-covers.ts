import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import matter from "gray-matter";
import sharp from "sharp";
import { COVER_PREFIX, COVER_WIDTHS, coverHash, coverUrl, loadEditorialCovers } from "../lib/editorial-covers";
import type { CoverRecord } from "../lib/editorial-covers";

type Brief = { alt: string; eventId?: string };
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const [staging = path.join(root, ".codex-work/editorial-covers"), ...requested] = process.argv.slice(2);
const briefs: Record<string, Brief> = JSON.parse(await fs.readFile(path.join(staging, "briefs.json"), "utf8"));
const dates = (requested.length ? requested : Object.keys(briefs)).sort();
if (!dates.length || new Set(dates).size !== dates.length) throw Error("Supply unique cover dates");
const folder = path.join(root, "site/public", COVER_PREFIX);
const covers = loadEditorialCovers(root);
const generatedOn = new Intl.DateTimeFormat("sv-SE", {
  timeZone: "Asia/Shanghai", year: "numeric", month: "2-digit", day: "2-digit",
}).format(new Date());
const prepared: { date: string; cover: CoverRecord; edition: string; file: string; variants: Buffer[] }[] = [];

for (const date of dates) {
  const brief = briefs[date];
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !brief?.alt?.trim()) throw Error(`Missing or invalid brief for ${date}`);
  const file = path.join(root, "docs/reading", `${date}.md`);
  const edition = await fs.readFile(file, "utf8");
  const { data } = matter(edition);
  const event = brief.eventId ? data.events.find((item: { id: string }) => item.id === brief.eventId) : data.events[0];
  if (data.report !== `gsd-${date}` || !event?.id || !/^https:\/\//.test(event.source) || data.image)
    throw Error(`Cannot bind the cover to a reading event for ${date}`);
  const bytes = await fs.readFile(path.join(staging, `${date}.png`));
  const metadata = await sharp(bytes).metadata();
  if (!metadata.width || !metadata.height || metadata.width < 480 || metadata.height < 270 || metadata.format !== "png")
    throw Error(`Cover needs a PNG of at least 480 × 270 for ${date}`);
  const variants: Buffer[] = [];
  for (const width of COVER_WIDTHS) {
    const { data, info } = await sharp(bytes).rotate().resize(width, width * 9 / 16, { fit: "cover" })
      .webp({ quality: 82, effort: 5 }).toBuffer({ resolveWithObject: true });
    if (info.width !== width || info.height !== width * 9 / 16 || data.length > 400_000)
      throw Error(`Unexpected cover dimensions or payload size for ${date}`);
    variants.push(data);
  }
  const cover: CoverRecord = {
    date, eventId: event.id, generator: "OpenAI ImageGen", generatedOn, inputSha256: coverHash(bytes),
    image: { kind: "editorial-illustration", url: coverUrl(date, 960), source: event.source, credit: "编辑插画", alt: brief.alt,
      width: 960, height: 540, variants: COVER_WIDTHS.map(width => ({ url: coverUrl(date, width), width })) },
    files: COVER_WIDTHS.map((width, index) => ({ url: coverUrl(date, width), width, height: width * 9 / 16, sha256: coverHash(variants[index]) })),
  };
  prepared.push({ date, cover, edition, file, variants });
}
await fs.mkdir(folder, { recursive: true });
for (const { date, cover, edition, file, variants } of prepared) {
  for (const [index, variant] of cover.files.entries()) {
    await fs.writeFile(path.join(folder, path.basename(variant.url)), variants[index]);
  }
  covers[date] = cover;
  if (!/^editorialCover: /m.test(edition))
    await fs.writeFile(file, edition.replace(/^sourceHash: [^\n]+\n/m, line => `${line}editorialCover: "${date}"\n`));
}
const sorted = Object.fromEntries(Object.entries(covers).sort(([a], [b]) => a.localeCompare(b)));
await fs.writeFile(path.join(folder, "manifest.json"), JSON.stringify({ schemaVersion: 1, covers: sorted }, null, 2) + "\n");
loadEditorialCovers(root);
console.log(`Prepared ${prepared.length} editorial covers with ${COVER_WIDTHS.length} variants each.`);
