export const READER_ROUTE_READY = "gsd:reader-route-ready";

const PROGRESS_KEY = "gsd:reading-progress:v1:";
const BLOCKS = "[data-reader-body] .prose :is(h2,h3,h4,p,li,blockquote,pre,figure,img,table), [data-reader-body] .event-title";
const SECTION = "[data-event-id][id], .prose :is(h2,h3,h4)[id], section[id]";
const EXCLUDED = ".longform-related, .this-week, .article-teasers, .article-revisions, .footnotes, [data-footnotes], .editorial-disclosure, .original-record";

export interface ReadingPosition {
  anchor: string;
  fingerprint: string;
  occurrence: number;
  fraction: number;
}

function fingerprint(text: string) {
  let hash = 2166136261;
  for (const character of text.replace(/\s+/g, " ").trim()) {
    hash = Math.imul(hash ^ (character.codePointAt(0) || 0), 16777619);
  }
  return (hash >>> 0).toString(36);
}

function blocks(article: HTMLElement) {
  let anchor = article.id;
  const occurrences = new Map<string, number>();
  return Array.from(article.querySelectorAll<HTMLElement>(`${SECTION}, ${BLOCKS}`)).flatMap(element => {
    if (element.closest(EXCLUDED) || !element.getClientRects().length) return [];
    if (element.matches(SECTION)) anchor = element.id;
    if (!element.matches(BLOCKS)) return [];
    if (element.matches("li,blockquote") && element.querySelector("p")) return [];
    if (element.matches("img") && element.closest("figure")) return [];
    if (element.matches("p") && !element.textContent?.trim() && element.querySelector("img")) return [];
    const image = element.matches("figure, img") ? (element.matches("img") ? element : element.querySelector("img")) : null;
    const source = image?.getAttribute("src");
    const text = source ? `figure:${source}` : element.textContent?.trim();
    if (!text) return [];
    const hash = fingerprint(text);
    const key = anchor + ":" + hash;
    const occurrence = occurrences.get(key) || 0;
    occurrences.set(key, occurrence + 1);
    return [{ element, anchor, fingerprint: hash, occurrence }];
  });
}

export function readingLine() {
  return Math.min(innerHeight / 4, 150);
}

export function captureReadingPosition(article: HTMLElement): ReadingPosition | null {
  const candidates = blocks(article);
  const first = candidates[0]?.element.getBoundingClientRect();
  const end = article.querySelector("[data-reader-end]")?.getBoundingClientRect() || candidates.at(-1)?.element.getBoundingClientRect();
  const line = readingLine();
  if (!first || !end || scrollY < 120 || first.top > innerHeight * .6 || end.bottom <= line) return null;
  const block = candidates.find(item => item.element.getBoundingClientRect().bottom > line);
  if (!block) return null;
  const { element, ...position } = block;
  const { top, height } = element.getBoundingClientRect();
  return { ...position, fraction: Math.round(Math.max(0, Math.min(1, (line - top) / height)) * 1000) / 1000 };
}

export function resolveReadingPosition(article: HTMLElement, position: ReadingPosition) {
  const candidates = blocks(article);
  const matches = candidates.filter(item => item.fingerprint === position.fingerprint);
  const precise = matches.find(item => item.anchor === position.anchor && item.occurrence === position.occurrence)
    || (matches.length === 1 ? matches[0] : null);
  if (precise) return { element: precise.element, fraction: position.fraction };
  const section = document.getElementById(position.anchor);
  return section && section !== article && article.contains(section) ? { element: section, fraction: 0 } : null;
}

export function readReadingPosition(id: string): ReadingPosition | null {
  try {
    const value = JSON.parse(localStorage.getItem(PROGRESS_KEY + id) || "null") as Partial<ReadingPosition> | null;
    if (value && typeof value.anchor === "string" && typeof value.fingerprint === "string" &&
        typeof value.occurrence === "number" && Number.isSafeInteger(value.occurrence) && value.occurrence >= 0 &&
        typeof value.fraction === "number" && value.fraction >= 0 && value.fraction <= 1) return value as ReadingPosition;
  } catch {}
  return null;
}

export function writeReadingPosition(id: string, position: ReadingPosition | null) {
  try {
    if (position) localStorage.setItem(PROGRESS_KEY + id, JSON.stringify(position));
    else localStorage.removeItem(PROGRESS_KEY + id);
  } catch {}
}

let requestedURL = "";
export function requestReadingResume(url: string) {
  requestedURL = new URL(url, location.origin).pathname.replace(/\/$/, "");
  const samePage = requestedURL === location.pathname.replace(/\/$/, "");
  if (samePage) window.dispatchEvent(new Event(READER_ROUTE_READY));
  return samePage;
}
export function consumeReadingResume() {
  const requested = requestedURL === location.pathname.replace(/\/$/, "");
  requestedURL = "";
  return requested;
}
