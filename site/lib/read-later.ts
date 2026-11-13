import type { ReaderIdentity } from "./reader";

export type ReadLaterArticle = ReaderIdentity & { cover?: string; summary?: string };

export const READ_LATER_KEY = "gsd:read-later:v1";
const LEGACY_PREFIX = "gsd:reading-bookmark:v1:";

export function readSavedArticles(storage: Storage, catalogue: readonly ReadLaterArticle[]) {
  const known = new Set(catalogue.map(article => article.id));
  let stored: { ids?: unknown; migrated?: unknown } | null = null;
  try { stored = JSON.parse(storage.getItem(READ_LATER_KEY) || "null"); } catch {}
  const ids = Array.isArray(stored?.ids) ? stored.ids.filter((id): id is string => typeof id === "string" && known.has(id)) : [];
  if (stored?.migrated === true) return [...new Set(ids)];
  const imported = catalogue.filter(article => storage.getItem(LEGACY_PREFIX + article.id) === "1");
  const merged = [...new Set([...ids, ...imported.map(article => article.id)])];
  try { writeSavedArticles(storage, merged); } catch {}
  return merged;
}

export function writeSavedArticles(storage: Storage, ids: readonly string[]) {
  // The list and migration guard must survive or fail together.
  storage.setItem(READ_LATER_KEY, JSON.stringify({ migrated: true, ids }));
}
