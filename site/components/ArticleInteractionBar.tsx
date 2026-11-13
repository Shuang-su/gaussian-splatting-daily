"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { DISCUSSIONS, commentCount } from "../lib/discussions";
import { readerThreadTerm } from "../lib/reader";
import { useDiscussionSample } from "./DiscussionProvider";
import { useReader } from "./ReaderProvider";
import Icon from "./Icon";
import { useCardNavigation } from "./CardNavigation";

export default function ArticleInteractionBar({ dailyId }: { dailyId?: string }) {
  const reader = useReader();
  const navigation = useCardNavigation();
  const article = reader?.article;
  const term = article ? readerThreadTerm(article) : "";
  const { thread } = useDiscussionSample(term, 0, true);
  const [saved, setSaved] = useState(false);
  const [notice, setNotice] = useState("");
  const key = `gsd:reading-bookmark:v1:${article?.id || dailyId || ""}`;

  useEffect(() => {
    try { setSaved(localStorage.getItem(key) === "1"); } catch { setSaved(false); }
  }, [key]);
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(""), 3500);
    return () => clearTimeout(timer);
  }, [notice]);

  function bookmark() {
    try {
      if (saved) localStorage.removeItem(key);
      else localStorage.setItem(key, "1");
      setSaved(!saved);
      setNotice(saved ? "已取消本机收藏" : "已收藏到本机");
    } catch { setNotice("浏览器暂时无法保存收藏"); }
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
      <button type="button" aria-label={saved ? "取消本机收藏" : "收藏到本机"} aria-pressed={saved} onClick={bookmark}><Icon name="bookmark"/></button>
      <button type="button" aria-label="分享文章" onClick={event => reader?.share(event.currentTarget)}><Icon name="share"/></button>
    </div>
    <p className="article-action-notice" role="status">{notice}</p>
  </div>, document.body);
}
