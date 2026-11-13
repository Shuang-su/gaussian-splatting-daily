import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { buildArchive, ROOT } from "../lib/content";
import { buildShareImages } from "./build-share";
import { SITE_URL, dailyUrl, TOPICS } from "../lib/catalog";
import { buildFeeds, buildWeekly, weeklyUrl, escapeXml } from "../lib/feeds";

const { articles, index, weeks, editorials } = await buildArchive();
const output = JSON.stringify(index, null, 2) + "\n";
fs.mkdirSync(path.join(ROOT, "site/public"), { recursive: true });
fs.writeFileSync(path.join(ROOT, "data/portal-index.json"), output);
fs.writeFileSync(path.join(ROOT, "site/public/content-index.json"), output);
const feeds = buildFeeds(articles, weeks, editorials);
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
      reports: index.daily.map(({ id, date, contentHash, readingEdition }) => ({ id, date, contentHash, ...(readingEdition ? { readingEdition } : {}) })),
    },
    null,
    2,
  ) + "\n",
);

await buildShareImages(index);

const urls = ["/","/daily/","/articles/","/features/","/papers/","/apps/","/search/","/subscribe/","/topics/","/tools/",...TOPICS.map(t=>`/topics/${t.slug}/`),...articles.map(a=>dailyUrl(a.date)),...editorials.map(a=>a.url),...weeks.map(w=>weeklyUrl(w))];
fs.writeFileSync(path.join(ROOT,"site/public/sitemap.xml"),`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.map(url=>`<url><loc>${escapeXml(SITE_URL+url)}</loc></url>`).join("")}</urlset>`);
fs.writeFileSync(path.join(ROOT,"site/public/robots.txt"),`User-agent: *\nAllow: /horizon/\nSitemap: ${SITE_URL}/sitemap.xml\n`);
