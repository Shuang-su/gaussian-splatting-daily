import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import type { SourceImage } from "./types";

export const COVER_PREFIX = "/media/editorial-covers";
export const COVER_WIDTHS = [480, 960, 1440];
export const coverHash = (bytes: Buffer) => createHash("sha256").update(bytes).digest("hex");
export const coverUrl = (date: string, width: number) => `${COVER_PREFIX}/${date}-${width}.webp`;
export type CoverRecord = {
  date: string;
  eventId: string;
  generator: "OpenAI ImageGen";
  generatedOn: string;
  inputSha256: string;
  image: SourceImage;
  files: { url: string; width: number; height: number; sha256: string }[];
};

export function loadEditorialCovers(root: string): Record<string, CoverRecord> {
  const folder = path.join(root, "site/public", COVER_PREFIX);
  const manifest = path.join(folder, "manifest.json");
  if (!fs.existsSync(manifest)) return {};
  const { schemaVersion, covers } = JSON.parse(fs.readFileSync(manifest, "utf8"));
  if (schemaVersion !== 1 || !covers || typeof covers !== "object" || Array.isArray(covers))
    throw Error("Invalid editorial cover manifest");
  const hashes = new Set<string>();
  const expected = new Set(["manifest.json"]);
  for (const [date, cover] of Object.entries(covers as Record<string, CoverRecord>)) {
    const { image, files } = cover;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || cover.date !== date || !cover.eventId ||
        cover.generator !== "OpenAI ImageGen" || !/^\d{4}-\d{2}-\d{2}$/.test(cover.generatedOn) ||
        !/^[a-f0-9]{64}$/.test(cover.inputSha256) ||
        image?.kind !== "editorial-illustration" || image.credit !== "编辑插画" || !image.alt?.trim() ||
        !/^https:\/\//.test(image.source) || image.url !== coverUrl(date, 960) ||
        image.width !== 960 || image.height !== 540 || image.originalUrl ||
        JSON.stringify(image.variants) !== JSON.stringify(COVER_WIDTHS.map(width => ({ url: coverUrl(date, width), width }))) ||
        !Array.isArray(files) || files.length !== COVER_WIDTHS.length)
      throw Error(`Invalid editorial cover metadata for ${date}`);
    for (const [index, { url, width, height, sha256 }] of files.entries()) {
      if (width !== COVER_WIDTHS[index] || height !== width * 9 / 16 || url !== coverUrl(date, width) || hashes.has(sha256))
        throw Error(`Invalid or duplicate editorial cover variant ${url}`);
      const file = path.join(folder, path.basename(url));
      if (!fs.lstatSync(file).isFile()) throw Error(`Invalid editorial cover path ${url}`);
      const bytes = fs.readFileSync(file);
      if (bytes.length > 400_000 || bytes.subarray(0, 4).toString() !== "RIFF" ||
          bytes.subarray(8, 12).toString() !== "WEBP" || coverHash(bytes) !== sha256)
        throw Error(`Invalid editorial cover checksum or payload ${url}`);
      expected.add(path.basename(url));
      hashes.add(sha256);
    }
  }
  if (fs.readdirSync(folder).some(file => !expected.has(file) && file !== ".DS_Store"))
    throw Error("Unlisted editorial cover file");
  return covers;
}
