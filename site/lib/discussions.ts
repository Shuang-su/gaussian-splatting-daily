export interface DiscussionConfig { repo: string; repoId: string; category: string; categoryId: string; lightTheme: string; darkTheme: string; }
// Verified 2026-11-13: official giscus installation selects only this public repository.
// The Comments category uses announcement format so threads are created by the app.
export const DISCUSSIONS: DiscussionConfig | null = {
  repo: "Shuang-su/gaussian-splatting-daily",
  repoId: "R_kgDOUxdQnw",
  category: "Comments",
  categoryId: "DIC_kwDOUxdQn84DLBLB",
  lightTheme: "light",
  darkTheme: "dark",
};
export const discussionTerm = (dailyId: string, eventId?: string) => eventId ? `${dailyId}::event::${eventId}` : `${dailyId}::daily`;
export const FIXTURE_MODES = ["mixed", "populated", "single", "empty", "reactions", "failure"] as const;
export type FixtureMode = typeof FIXTURE_MODES[number];
export interface DiscussionComment { id: string; author: string; avatar: string; text: string; replies?: DiscussionComment[] }
export interface DiscussionReaction { emoji: string; count: number; selected?: boolean }
export interface DiscussionThread { status: "ready" | "failure"; comments: DiscussionComment[]; reactions: DiscussionReaction[] }
export function discussionFixture(host: string, value: string | null): FixtureMode | null {
  return ["localhost", "127.0.0.1", "[::1]"].includes(host) && FIXTURE_MODES.includes(value as FixtureMode) ? value as FixtureMode : null;
}
export function commentCount(comments: DiscussionComment[]): number {
  return comments.reduce((total, comment) => total + 1 + commentCount(comment.replies || []), 0);
}
/** Synthetic, local-only data. Every rendered sample is explicitly labelled. */
export function sampleThread(mode: FixtureMode | null, index = 0, daily = false): DiscussionThread | null {
  if (!mode) return null;
  const variant = mode === "mixed" ? (daily ? "single" : (["populated", "single", "empty", "reactions", "failure"] as const)[index % 5]) : mode;
  const short: DiscussionComment = { id: "sample-1", author: "示例读者甲", avatar: "甲", text: daily ? "这样的文章顺序更容易阅读，想继续看看其他日期。" : "这条更新的适用条件写清楚了，读起来更容易判断是否需要升级。" };
  const long: DiscussionComment = { id: "sample-2", author: "示例读者乙", avatar: "乙", text: "希望继续保留版本号、来源与适用条件，这些信息能帮助读者区分正式发布与开发分支。这里特意放入一段较长的样本文字，用于检查窄屏截断、全文展开和返回阅读的位置。" };
  if (variant === "failure") return { status: "failure", comments: [], reactions: [] };
  if (variant === "empty") return { status: "ready", comments: [], reactions: [] };
  if (variant === "single") return { status: "ready", comments: [short], reactions: [] };
  if (variant === "reactions") return { status: "ready", comments: [long, short], reactions: [{ emoji: "👍", count: 21 }, { emoji: "🤔", count: 1 }] };
  return { status: "ready", comments: [long, { ...short, replies: Array.from({ length: 5 }, (_, i) => ({ id: `reply-${i}`, author: `示例回复 ${i + 1}`, avatar: "回", text: ["同意，先弄清适用的版本很有帮助。", "补充测试时，也可以注明设备与数据规模。", "这个回复只用于检查二级讨论。", "来源可以直接从正文中的链接查看。", "收起之后应该回到刚才的阅读位置。"][i] })) }], reactions: [{ emoji: "👍", count: 15 }, { emoji: "👏", count: 1 }] };
}
export function toggleReaction(thread: DiscussionThread, emoji: string): DiscussionThread {
  const existing = thread.reactions.find(reaction => reaction.emoji === emoji);
  const reactions = existing ? thread.reactions.map(reaction => reaction.emoji === emoji ? { ...reaction, selected: !reaction.selected, count: reaction.count + (reaction.selected ? -1 : 1) } : reaction).filter(reaction => reaction.count > 0) : [...thread.reactions, { emoji, count: 1, selected: true }];
  return { ...thread, reactions };
}
