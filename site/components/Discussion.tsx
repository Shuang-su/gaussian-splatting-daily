"use client";

import { DISCUSSIONS, commentCount, discussionTerm } from "../lib/discussions";
import type { DiscussionConfig } from "../lib/discussions";
import { dailyUrl } from "../lib/catalog";
import { useDiscussionSample } from "./DiscussionProvider";
import { useReader } from "./ReaderProvider";
import Icon from "./Icon";

export default function Discussion({ dailyId, date, eventId, anchor, heading = false, sampleIndex = 0, config = DISCUSSIONS }: {
  dailyId: string; date: string; eventId?: string; anchor?: string; heading?: boolean; sampleIndex?: number; config?: DiscussionConfig | null;
}) {
  const reader = useReader();
  const term = discussionTerm(dailyId, eventId);
  const { thread } = useDiscussionSample(term, sampleIndex, heading);
  const count = thread?.status === "ready" ? commentCount(thread.comments) : reader?.counts[term];
  const title = heading ? "本期讨论" : "事件讨论";
  const available = !!thread || !!config;
  return <div id={heading ? "discussion" : undefined} className={heading ? "issue-discussion discussion" : "event-discussion discussion"}
    data-discussion-term={term} data-discussion-state={thread?.status || (config ? "configured" : "unconfigured")}>
    {heading && <header className="discussion-heading"><h2>{title}</h2></header>}
    {(available || heading) && <button type="button" className="comment-write" aria-haspopup="dialog"
      aria-label={count === undefined ? title : `${title}，${count} 条${thread ? "" : "一级"}评论`}
      onClick={event => reader?.openDiscussion(event.currentTarget, {
        article: reader.article || { id: dailyId, title, date, kind: "daily", url: dailyUrl(date) }, eventId, anchor, sampleIndex
      })}><Icon name="comment"/>{heading ? "查看本期讨论" : "参与讨论"}{count !== undefined && <span>{count}</span>}
      {thread && <span className="fixture-label">本地样本</span>}
    </button>}
  </div>;
}
