"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { DISCUSSIONS, commentCount } from "../lib/discussions";
import { readerThreadTerm } from "../lib/reader";
import { useDiscussionSample } from "./DiscussionProvider";
import { useReader } from "./ReaderProvider";
import Icon from "./Icon";
import { useCardNavigation } from "./CardNavigation";

export default function ArticleInteractionBar() {
  const reader = useReader();
  const navigation = useCardNavigation();
  const article = reader?.article;
  const term = article ? readerThreadTerm(article) : "";
  const { thread } = useDiscussionSample(term, 0, true);
  const saved = !!(article && reader?.readLaterIds.includes(article.id));
  const [notice, setNotice] = useState("");
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(""), 3500);
    return () => clearTimeout(timer);
  }, [notice]);

  function bookmark() {
    if (!article || !reader?.toggleReadLater(article.id)) {
      setNotice("浏览器暂时无法更新稍后阅读");
      return;
    }
    setNotice(saved ? "已从稍后阅读移除" : "已加入稍后阅读");
  }

  const count = thread?.status === "ready" ? commentCount(thread.comments) : reader?.counts[term];
  const title = article?.kind === "daily" ? "本期讨论" : "文章讨论";
  if (!article) return null;
  return createPortal(<div className="article-interaction-wrap" inert={navigation?.busy}>
    <div className="article-interaction-bar" data-glass-surface role="group" aria-label="文章操作">
      <button type="button" className="article-comment-entry" aria-haspopup="dialog" onClick={event => reader?.openDiscussion(event.currentTarget)}>
        <Icon name="edit"/><span>{thread || DISCUSSIONS ? "说点什么…" : title}</span>
      </button>
      <button type="button" className="bar-comment-count" aria-label={count === undefined ? `查看${title}` : `${title}，${count} 条${thread ? "" : "一级"}评论`}
        aria-haspopup="dialog" onClick={event => reader?.openDiscussion(event.currentTarget)}>
        <Icon name="comment"/>{count !== undefined && <span>{count}</span>}
      </button>
      <button type="button" className="bar-directory" aria-label="打开文章目录" onClick={event =>
        window.dispatchEvent(new CustomEvent("open-reading-navigation", { detail: { origin: event.currentTarget } }))}><Icon name="menu"/></button>
      <button type="button" aria-label={saved ? "从稍后阅读移除" : "加入稍后阅读"} aria-pressed={saved} onClick={bookmark}><Icon name="bookmark"/></button>
      <button type="button" aria-label="分享文章" onClick={event => reader?.share(event.currentTarget)}><Icon name="share"/></button>
    </div>
    <p className="article-action-notice" role="status">{notice}</p>
  </div>, document.body);
}
