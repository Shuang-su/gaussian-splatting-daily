import { BASE } from "./catalog";

export const HISTORY_KEY = "__gsdNavigation";
export const STORAGE_KEY = "gsd-navigation-v1";
export const UI_CAPTURE = "gsd-capture-page";
export const HISTORY_CHANGE = "gsd-history-change";

export type PageUI = Record<string, unknown>;
export type NavigationMarker = {
  session: string; id: string; index: number; sourceId?: string; sourceKey?: string; contextPath?: string; contextId?: string;
};
export type PageSnapshot = {
  marker: NavigationMarker; url: string; scroll: number; width: number;
  ui: PageUI; originKey?: string; originTop?: number; focusIndex?: number; focusHref?: string;
};
type StorageLike = Pick<Storage, "getItem" | "setItem">;

export function sitePath(value: string): string | null {
  if (!value.startsWith("/") || value.startsWith("//") || /[\\\u0000-\u001f]/.test(value)) return null;
  const path = new URL(value, "https://local.invalid").pathname;
  return path === BASE || path.startsWith(`${BASE}/`) ? value : null;
}

export function articlePath(value: string): boolean {
  return new RegExp(`^${BASE}/daily/\\d{4}/\\d{2}/\\d{2}/?$`).test(value.split(/[?#]/)[0]);
}

export function markerFrom(state: unknown): NavigationMarker | null {
  if (!state || typeof state !== "object") return null;
  const value = (state as Record<string, unknown>)[HISTORY_KEY] as NavigationMarker | undefined;
  if (!value || typeof value.session !== "string" || typeof value.id !== "string" || !Number.isSafeInteger(value.index) || value.index < 0) return null;
  if (value.sourceId !== undefined && typeof value.sourceId !== "string") return null;
  if (value.sourceKey !== undefined && typeof value.sourceKey !== "string") return null;
  if (value.contextId !== undefined && typeof value.contextId !== "string") return null;
  if (value.contextPath !== undefined && typeof value.contextPath !== "string") return null;
  return value;
}

export function mergeMarker(state: unknown, marker: NavigationMarker): Record<string, unknown> & { [HISTORY_KEY]: NavigationMarker } {
  return { ...(state && typeof state === "object" ? state : {}), [HISTORY_KEY]: marker };
}

export function returnDistance(current: NavigationMarker, source: PageSnapshot): number | null {
  return current.session === source.marker.session && current.sourceId === source.marker.id && current.index > source.marker.index
    ? source.marker.index - current.index : null;
}

export function sameDocument(a: string, b: string) { return a.split("#")[0] === b.split("#")[0]; }

export function ordinaryClick(event: { button: number; metaKey: boolean; ctrlKey: boolean; shiftKey: boolean; altKey: boolean; defaultPrevented: boolean }, target?: string | null, download = false) {
  return !event.defaultPrevented && event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey && (!target || target === "_self") && !download;
}

export function carouselState(value: unknown, ids: string[]) {
  const state = value as { id?: string; paused?: boolean; elapsed?: number } | undefined;
  const active = state?.id ? ids.indexOf(state.id) : -1;
  return { active: Math.max(0, active), paused: active >= 0 && state?.paused === true,
    elapsed: active >= 0 && Number.isFinite(state?.elapsed) ? Math.max(0, Math.min(8000, state!.elapsed!)) : 0 };
}

export class NavigationStore {
  private entries = new Map<string, PageSnapshot>();
  restoration: PageSnapshot | null = null;
  constructor(private storage?: StorageLike) {
    try {
      const saved = JSON.parse(storage?.getItem(STORAGE_KEY) || "null");
      if (saved?.version === 1 && Array.isArray(saved.entries)) {
        for (const entry of saved.entries.slice(-40)) {
          if (entry && sitePath(entry.url || "") && markerFrom({ [HISTORY_KEY]: entry.marker }) && Number.isFinite(entry.scroll) && entry.scroll >= 0 && Number.isFinite(entry.width) && entry.ui && typeof entry.ui === "object") this.entries.set(entry.marker.id, entry);
        }
      }
    } catch { /* A blocked or stale session store must not disable navigation. */ }
  }
  get(id?: string) { return id ? this.entries.get(id) : undefined; }
  save(entry: PageSnapshot) {
    this.entries.delete(entry.marker.id); this.entries.set(entry.marker.id, entry);
    while (this.entries.size > 40) this.entries.delete(this.entries.keys().next().value!);
    try { this.storage?.setItem(STORAGE_KEY, JSON.stringify({ version: 1, entries: [...this.entries.values()] })); } catch {}
  }
}

let store: NavigationStore | undefined;
export function navigationStore() {
  if (!store) {
    let storage: StorageLike | undefined;
    try { storage = window.sessionStorage; } catch {}
    store = new NavigationStore(storage);
  }
  return store;
}

export function restoredUI(key: string): unknown {
  if (typeof window === "undefined") return undefined;
  const snapshot = navigationStore().restoration || navigationStore().get(markerFrom(history.state)?.id);
  return snapshot && sameDocument(snapshot.url, location.pathname + location.search + location.hash) ? snapshot.ui[key] : undefined;
}

/** Keep the navigation chain when the existing directory adds an anchor entry. */
export function pushArticleHash(id: string) {
  window.dispatchEvent(new Event(UI_CAPTURE + "-before-history"));
  const marker = markerFrom(history.state);
  const state = marker ? mergeMarker(history.state, { ...marker, id: crypto.randomUUID(), index: marker.index + 1 }) : history.state;
  history.pushState(state, "", `#${encodeURIComponent(id)}`);
  window.dispatchEvent(new Event(HISTORY_CHANGE));
}
