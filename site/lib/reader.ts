import { SITE_URL } from "./catalog";

export interface ReaderIdentity {
  id: string;
  title: string;
  url: string;
  kind: "daily" | "editorial" | "weekly";
  date: string;
}

export const READER_FONT_KEY = "gsd:reader-font:v1";
export const READER_FONT_MIN = 14;
export const READER_FONT_MAX = 24;

export function readerFontSize(value: string | null) {
  if (!value) return null;
  const size = Number(value);
  return Number.isInteger(size) && size >= READER_FONT_MIN && size <= READER_FONT_MAX ? size : null;
}

export function readerShareUrl(article: ReaderIdentity, current: URL) {
  const canonical = new URL(SITE_URL + article.url);
  return current.origin === canonical.origin && current.pathname.replace(/\/$/, "") === canonical.pathname.replace(/\/$/, "") ?
    canonical.href : new URL(current.pathname, current.origin).href;
}

export function readerThreadTerm(article: ReaderIdentity, eventId?: string) {
  if (eventId) return `${article.id}::event::${eventId}`;
  return `${article.id}::${article.kind === "daily" ? "daily" : "article"}`;
}

export function giscusCount(value: unknown, repo: string) {
  if (!value || typeof value !== "object") return null;
  const data = value as { repository?: { nameWithOwner?: unknown }; totalCommentCount?: unknown; url?: unknown };
  const count = data.totalCommentCount;
  if (data.repository?.nameWithOwner !== repo || typeof count !== "number" || !Number.isSafeInteger(count) || count < 0 ||
    typeof data.url !== "string" || !data.url.startsWith(`https://github.com/${repo}/discussions/`) ||
    !/^\d+$/.test(data.url.slice(`https://github.com/${repo}/discussions/`.length))) return null;
  return { count, url: data.url };
}

export function restoreReaderScroll(value: unknown, maximum: number) {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  return Math.min(Math.max(0, maximum), Math.max(0, value));
}
