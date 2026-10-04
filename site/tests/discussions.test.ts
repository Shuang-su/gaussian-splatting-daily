import { test } from "node:test";
import assert from "node:assert/strict";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import { discussionFixture, sampleThread, toggleReaction, commentCount, FIXTURE_MODES } from "../lib/discussions";
import Discussion from "../components/Discussion";
import ReadingGuide from "../components/ReadingGuide";
import { buildArchive } from "../lib/content";

test("every sample mode is restricted to exact loopback hosts", () => {
  for (const mode of FIXTURE_MODES) {
    for (const host of ["example.com", "localhost.example.com", "127.0.0.1.example.com", "shuang-su.github.io"]) assert.equal(discussionFixture(host, mode), null);
    for (const host of ["localhost", "127.0.0.1", "[::1]"]) assert.equal(discussionFixture(host, mode), mode);
  }
  assert.equal(sampleThread(null), null);
  const html = renderToStaticMarkup(createElement(Discussion, { dailyId: "gsd-2026-09-30", date: "2026-09-30", eventId: "stable-event" }));
  assert.ok(html.includes("gsd-2026-09-30::event::stable-event"));
  for (const forbidden of ["示例读者", "发表首评", "暂无评论", "<form", "<iframe", "reaction-chip"]) assert.ok(!html.includes(forbidden), forbidden);
});
test("mixed samples cover no comments, one/two previews, threaded replies and failure without conflating counts", () => {
  const samples = Array.from({ length: 5 }, (_, i) => sampleThread("mixed", i)!);
  assert.deepEqual(samples.map(thread => thread.status), ["ready", "ready", "ready", "ready", "failure"]);
  assert.deepEqual(samples.map(thread => commentCount(thread.comments)), [7, 1, 0, 2, 0]);
  assert.equal(samples[0].comments.length, 2);
  assert.equal(samples[0].comments[1].replies!.length, 5);
  assert.equal(commentCount(sampleThread("mixed", 0, true)!.comments), 1);
});
test("local reaction toggles are reversible and cannot mutate another event's initial sample", () => {
  const first = sampleThread("reactions")!, other = sampleThread("reactions")!;
  const selected = toggleReaction(first, "👍");
  assert.equal(selected.reactions[0].count, 22);
  assert.equal(selected.reactions[0].selected, true);
  assert.equal(first.reactions[0].count, 21);
  assert.equal(other.reactions[0].count, 21);
  assert.equal(toggleReaction(selected, "👍").reactions[0].count, 21);
  const newReaction = toggleReaction(first, "❤️");
  assert.equal(newReaction.reactions.at(-1)!.count, 1);
  assert.deepEqual(toggleReaction(newReaction, "❤️"), first);
});
test("daily overview numbers news and every later module in the same ordered list", async () => {
  const article = (await buildArchive()).articles.find(article => article.date === "2026-09-30")!;
  const html = renderToStaticMarkup(createElement(ReadingGuide, { article, hasWeek: true }));
  assert.ok(html.includes("日报速览"));
  assert.ok(!html.includes(">今日最值得看<"));
  const numbers = [...html.matchAll(/class="guide-number"[^>]*>(\d+)</g)].map(match => Number(match[1]));
  assert.deepEqual(numbers, Array.from({ length: 10 }, (_, i) => i + 1));
  for (const event of article.events!.filter(event => event.group === "main")) assert.ok(html.includes(event.judgment));
  for (const anchor of ["group-brief", "group-paper", "this-week", "sources", "discussion"]) assert.ok(html.includes(`href="#${anchor}"`));
});
