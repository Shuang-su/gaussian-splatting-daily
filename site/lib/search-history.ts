const KEY = "gsd-search-history-v1";
const LIMIT = 10;

export function searchTerm(value: string) {
  return value.trim().slice(0, 160);
}

export function readSearchHistory(): string[] {
  try {
    const values: unknown = JSON.parse(localStorage.getItem(KEY) || "[]");
    if (!Array.isArray(values)) return [];
    const seen = new Set<string>();
    return values.flatMap((value): string[] => {
      if (typeof value !== "string") return [];
      const term = searchTerm(value), key = term.toLocaleLowerCase();
      if (!term || seen.has(key)) return [];
      seen.add(key);
      return [term];
    }).slice(0, LIMIT);
  } catch { return []; }
}

export function rememberSearch(value: string) {
  const term = searchTerm(value), previous = readSearchHistory();
  if (!term) return previous;
  const next = [term, ...previous.filter((item) => item.toLocaleLowerCase() !== term.toLocaleLowerCase())].slice(0, LIMIT);
  try { localStorage.setItem(KEY, JSON.stringify(next)); } catch {}
  return next;
}

export function clearSearchHistory() {
  try { localStorage.removeItem(KEY); } catch {}
}
