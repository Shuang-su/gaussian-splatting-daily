import test from "node:test";
import assert from "node:assert/strict";
import { BASE } from "../lib/catalog";
import { articlePath, carouselState, HISTORY_KEY, markerFrom, mergeMarker, NavigationStore, ordinaryClick, returnDistance, sameDocument, sitePath, STORAGE_KEY, type PageSnapshot } from "../lib/card-navigation";

const home: PageSnapshot = { marker: { session: "tab-a", id: "home-1", index: 2 }, url: `${BASE}/?kind=daily`, scroll: 1300, width: 430,
  originKey: "home:daily:2026-09-30", focusIndex: 1, originTop: 100,
  ui: { homeFeed: { feed: "daily", limits: { recommended: 6, daily: 12, paper: 6, tool: 6 }, scroll: 1300 }, carousel: { id: "2026-09-30", paused: true, elapsed: 3400 } } };

test("card navigation only accepts site-local article destinations, preserving chapters and queries", () => {
  const chapter = `${BASE}/daily/2026/09/30/?from=search#event-1`;
  assert.equal(sitePath(chapter), chapter);
  assert.equal(articlePath(chapter), true);
  assert.equal(articlePath(`${BASE}/daily/`), false);
  for (const invalid of ["https://elsewhere.test", "//elsewhere.test", "/outside/", `${BASE}/../outside/`, `${BASE}/%2e%2e/outside/`, `${BASE}evil/`, "/\\example.test/"]) assert.equal(sitePath(invalid), null, invalid);
  assert.equal(sameDocument(chapter, `${BASE}/daily/2026/09/30/?from=search#event-2`), true);
  assert.equal(sameDocument(chapter, `${BASE}/daily/2026/09/30/`), false);
});

test("explicit return skips several chapter entries but never guesses across another tab or a missing origin", () => {
  const current = { session: "tab-a", id: "chapter-3", index: 6, sourceId: home.marker.id };
  assert.equal(returnDistance(current, home), -4);
  assert.equal(returnDistance({ ...current, session: "tab-b" }, home), null);
  assert.equal(returnDistance({ ...current, sourceId: "missing" }, home), null);
  assert.equal(returnDistance({ ...current, index: 1 }, home), null);
});

test("history metadata preserves the router tree and the original source through chapter updates", () => {
  const state = { __NA: true, __PRIVATE_NEXTJS_INTERNALS_TREE: { route: "article" }, scroll: 100 };
  const entered = mergeMarker(state, { session: "tab-a", id: "article-1", index: 3, sourceId: home.marker.id, sourceKey: home.originKey });
  const chapter = mergeMarker(entered, { ...markerFrom(entered)!, id: "chapter-1", index: 4 });
  assert.deepEqual(chapter.__PRIVATE_NEXTJS_INTERNALS_TREE, state.__PRIVATE_NEXTJS_INTERNALS_TREE);
  assert.equal(chapter.__NA, true);
  assert.equal(markerFrom(chapter)?.sourceKey, home.originKey);
  assert.equal(markerFrom(chapter)?.sourceId, home.marker.id);
  assert.equal(markerFrom({ [HISTORY_KEY]: { id: "bad", session: "a", index: NaN } }), null);
});

test("session snapshots restore distinct instances, load-more, filters, scroll, focus and carousel state", () => {
  const values = new Map<string, string>();
  const storage = { getItem: (key: string) => values.get(key) || null, setItem: (key: string, value: string) => { values.set(key, value); } };
  const store = new NavigationStore(storage); store.save(home);
  const other = { ...home, marker: { ...home.marker, id: "home-2", index: 9 }, originKey: "carousel:2026-09-30", scroll: 0 };
  store.save(other);
  const reloaded = new NavigationStore(storage);
  assert.deepEqual(reloaded.get(home.marker.id), home);
  assert.equal(reloaded.get("home-2")?.originKey, "carousel:2026-09-30");
  assert.equal(reloaded.get("absent"), undefined);
});

test("blocked and corrupt session storage degrade to an in-memory return chain", () => {
  const blocked = new NavigationStore({ getItem: () => { throw Error("blocked"); }, setItem: () => { throw Error("quota"); } });
  blocked.save(home); assert.deepEqual(blocked.get(home.marker.id), home);
  const corrupt = new NavigationStore({ getItem: () => "{invalid", setItem: () => {} });
  corrupt.save(home); assert.equal(corrupt.get(home.marker.id)?.scroll, 1300);
  const hostile = new NavigationStore({ getItem: key => key === STORAGE_KEY ? JSON.stringify({ version: 1, entries: [{ ...home, url: "https://outside.test" }] }) : null, setItem: () => {} });
  assert.equal(hostile.get(home.marker.id), undefined);
});

test("carousel restoration handles a non-first paused slide and stale or malformed values", () => {
  const ids = ["2026-10-03", "2026-10-02", "2026-09-30"];
  assert.deepEqual(carouselState(home.ui.carousel, ids), { active: 2, paused: true, elapsed: 3400 });
  assert.deepEqual(carouselState({ id: "missing", paused: true, elapsed: 3000 }, ids), { active: 0, paused: false, elapsed: 0 });
  assert.deepEqual(carouselState({ id: ids[1], paused: true, elapsed: Infinity }, ids), { active: 1, paused: true, elapsed: 0 });
  assert.equal(carouselState({ id: ids[0], elapsed: 90000 }, ids).elapsed, 8000);
});

test("middle click, modified click, downloads, prevented swipes and new windows retain native links", () => {
  const event = { button: 0, metaKey: false, ctrlKey: false, shiftKey: false, altKey: false, defaultPrevented: false };
  assert.equal(ordinaryClick(event), true);
  for (const modifier of ["metaKey", "ctrlKey", "shiftKey", "altKey", "defaultPrevented"]) assert.equal(ordinaryClick({ ...event, [modifier]: true }), false);
  assert.equal(ordinaryClick({ ...event, button: 1 }), false);
  assert.equal(ordinaryClick(event, "_blank"), false);
  assert.equal(ordinaryClick(event, "_self", true), false);
});
