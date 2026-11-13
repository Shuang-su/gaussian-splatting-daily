import test from "node:test";
import assert from "node:assert/strict";
import { buildArchive } from "../lib/content";
import { buildHome, calendarDate } from "../lib/home";
import { dailyUrl, entryUrl } from "../lib/catalog";

test("homepage preserves report identity and latest-report access in both carousel and feed", async () => {
  const { index } = await buildArchive();
  const before = JSON.stringify(index);
  const home = buildHome(index);
  assert.equal(home.slides[0].date, index.updatedThrough);
  assert.equal(home.feeds.daily[0].id, index.daily[0].id);
  assert.equal(home.feeds.recommended[0].id, index.daily[0].id);
  assert.equal(home.feeds.daily.length, index.daily.length);
  for (const slide of home.slides) {
    const canonical = index.daily.find((d) => d.id === slide.id)!;
    assert.equal(slide.url, dailyUrl(canonical.date));
    assert.equal(slide.contentHash, canonical.contentHash);
    assert.equal(slide.image?.originalUrl, canonical.image?.originalUrl);
    assert.equal(slide.sourceLabel, "Metaflow");
  }
  assert.equal(JSON.stringify(index), before, "presentation must not rewrite canonical archive or image fit");
});

test("recommendations use archived illustrations without duplicate lead covers or renamed paper ownership", async () => {
  const { index } = await buildArchive();
  const { feeds, related } = buildHome(index);
  assert.equal(new Set(feeds.recommended.map((item) => item.id)).size, feeds.recommended.length);
  for (let i = 0; i < feeds.recommended.length; i++) {
    const item = feeds.recommended[i];
    if (item.kind === "daily" && item.date > "2026-10-18") {
      const canonical = index.daily.find(report => report.id === item.id)!;
      assert.equal(item.image?.url, canonical.image?.url);
      assert.equal(item.url, dailyUrl(canonical.date));
    } else if (item.kind !== "article") {
      assert.ok(item.image, `${item.id} should have an archived illustration`);
    }
    if (i) assert.ok(feeds.recommended[i - 1].date >= item.date);
    if (item.kind !== "daily" && item.kind !== "article") assert.ok(!index.daily.some((d) => d.date === item.date && d.image?.url === item.image?.url));
  }
  for (const kind of ["paper", "tool"] as const) {
    assert.equal(feeds[kind].length, index.entries.filter((e) => e.kind === kind).length);
    for (const item of feeds[kind]) {
      const source = index.entries.find((e) => e.id === item.id)!;
      assert.equal(item.url, entryUrl(source));
      assert.equal(item.date, source.date);
    }
  }
  for (const item of related) assert.ok(index.daily[0].highlights.some((e) => item.id === e.id && item.url === entryUrl(e)));
});

test("calendar badge uses report date in Beijing rather than viewer timezone", () => {
  assert.deepEqual(calendarDate("2026-10-03"), { weekday: "周六", day: "3" });
  assert.deepEqual(calendarDate("2026-09-30"), { weekday: "周三", day: "30" });
  assert.deepEqual(calendarDate("2026-10-01"), { weekday: "周四", day: "1" });
});
