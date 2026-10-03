import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { buildArchive, ROOT } from "../lib/content";
import { buildShareImages } from "./build-share";
import { buildFeeds, buildWeekly } from "../lib/feeds";

const { articles, index } = await buildArchive();
const output = JSON.stringify(index, null, 2) + "\n";
fs.mkdirSync(path.join(ROOT, "site/public"), { recursive: true });
fs.writeFileSync(path.join(ROOT, "data/portal-index.json"), output);
fs.writeFileSync(path.join(ROOT, "site/public/content-index.json"), output);
const weeks = buildWeekly(articles);
const feeds = buildFeeds(articles, weeks);
fs.mkdirSync(path.join(ROOT, "site/public/feeds"), { recursive: true });
for (const [kind, xml] of Object.entries(feeds)) fs.writeFileSync(path.join(ROOT, `site/public/feeds/${kind}.xml`), xml);
console.log(`Built ${index.daily.length} Daily RSS items and ${weeks.length} closed-week summaries.`);
console.log(
  `Indexed ${index.daily.length} published Daily reports and ${index.entries.length} entries.`,
);

const commit =
  process.env.GITHUB_SHA ||
  execFileSync("git", ["rev-parse", "HEAD"], {
    cwd: ROOT,
    encoding: "utf8",
  }).trim();
fs.writeFileSync(
  path.join(ROOT, "site/public/deployment.json"),
  JSON.stringify(
    {
      commit,
      updatedThrough: index.updatedThrough,
      dailyCount: index.daily.length,
      reports: index.daily.map(({ id, date, contentHash }) => ({ id, date, contentHash })),
    },
    null,
    2,
  ) + "\n",
);

await buildShareImages(index);
