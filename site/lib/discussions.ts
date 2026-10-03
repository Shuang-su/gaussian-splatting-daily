export interface DiscussionConfig { repo: string; repoId: string; category: string; categoryId: string; lightTheme: string; darkTheme: string; }
// Enable only after the repository, category and GitHub App have been verified.
export const DISCUSSIONS: DiscussionConfig | null = null;
export const discussionTerm = (dailyId: string, eventId?: string) => eventId ? `${dailyId}::event::${eventId}` : `${dailyId}::daily`;
export function discussionFixture(host: string, value: string | null) {
  return ["localhost", "127.0.0.1", "[::1]"].includes(host) && ["populated", "empty", "failure"].includes(value || "") ? value : null;
}
