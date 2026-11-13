import { dailyUrl } from "./catalog";
import { loadArchive } from "./content";
import { coverageLabel, weeklyTitle, weeklyUrl } from "./feeds";
import { assetUrl, validImageUrl } from "./images";
import type { ReadLaterArticle } from "./read-later";
import type { SourceImage } from "./types";

function thumbnail(image?: SourceImage) {
  const url = image?.variants?.find(variant => variant.width >= 240)?.url || image?.url;
  // Keep the reading list independent of third-party tracking and remote image availability.
  return url && validImageUrl(url) && url.startsWith("/") ? assetUrl(url) : undefined;
}

export async function loadReadLaterCatalogue(): Promise<ReadLaterArticle[]> {
  const { index, editorials, weeklyEditorials, weeks } = await loadArchive();
  return [
    ...index.daily.map((item): ReadLaterArticle => ({
      id: item.id, kind: "daily", title: item.headline, summary: item.summary, date: item.date, url: dailyUrl(item.date), cover: thumbnail(item.image),
    })),
    ...editorials.map((item): ReadLaterArticle => ({
      id: item.id, kind: "editorial", title: item.title, summary: item.summary, date: item.date, url: item.url, cover: thumbnail(item.cover),
    })),
    ...weeks.map((week): ReadLaterArticle => {
      const editorial = weeklyEditorials.find(item => item.id === week.id);
      return {
        id: week.id, kind: "weekly", title: editorial?.headline || weeklyTitle(week),
        summary: editorial?.summary || coverageLabel(week), date: week.endDate,
        url: weeklyUrl(week), cover: thumbnail(week.reports[0]?.image),
      };
    }),
  ];
}
