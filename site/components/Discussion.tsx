"use client";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { DISCUSSIONS, commentCount, discussionTerm, toggleReaction } from "../lib/discussions";
import type { DiscussionComment, DiscussionConfig } from "../lib/discussions";
import { useDiscussionSample } from "./DiscussionProvider";
import Icon from "./Icon";
const GiscusThread = dynamic(() => import("./GiscusThread"));

function Comment({ comment }: { comment: DiscussionComment }) {
  return <li className="discussion-comment">
    <span className="comment-avatar" aria-hidden="true">{comment.avatar}</span>
    <div className="comment-content"><div className="comment-byline"><strong>{comment.author}</strong><span>本地样本</span></div><p>{comment.text}</p>
      {!!comment.replies?.length && <details className="comment-replies"><summary>展开 {comment.replies.length} 条回复</summary><ol>{comment.replies.map(reply => <Comment key={reply.id} comment={reply} />)}</ol></details>}
    </div>
  </li>;
}

export default function Discussion({ dailyId, date, eventId, anchor, heading = false, sampleIndex = 0, config = DISCUSSIONS }: { dailyId: string; date: string; eventId?: string; anchor?: string; heading?: boolean; sampleIndex?: number; config?: DiscussionConfig | null }) {
  const term = discussionTerm(dailyId, eventId), panel = useId(), composerId = useId();
  const { thread, update } = useDiscussionSample(term, sampleIndex, heading);
  const [open, setOpen] = useState(false), [mounted, setMounted] = useState(false), [composer, setComposer] = useState(false);
  const [picker, setPicker] = useState(false), [text, setText] = useState(""), [sort, setSort] = useState("oldest");
  const panelElement = useRef<HTMLDivElement>(null), textarea = useRef<HTMLTextAreaElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null), reactionTrigger = useRef<HTMLButtonElement>(null);
  const shown = heading || open, count = thread?.status === "ready" ? commentCount(thread.comments) : undefined;
  const comments = thread ? (sort === "latest" ? [...thread.comments].reverse() : thread.comments) : [];
  const openThread = useCallback((origin: HTMLElement, write = false) => {
    const canCompose = write && thread?.status === "ready";
    returnFocus.current = origin;
    setMounted(true); setOpen(true); setComposer(canCompose); setPicker(false);
    requestAnimationFrame(() => (canCompose ? textarea.current : panelElement.current)?.focus({ preventScroll: true }));
  }, [thread]);
  function close() {
    setOpen(false); setComposer(false); setPicker(false);
    requestAnimationFrame(() => {
      const target = returnFocus.current;
      target?.focus({ preventScroll: true });
      if (target && (target.getBoundingClientRect().top < 70 || target.getBoundingClientRect().bottom > innerHeight - 84)) target.scrollIntoView({ block: "center", behavior: "instant" });
    });
  }
  useEffect(() => {
    if (!heading) return;
    const requested = (event: Event) => {
      const detail = (event as CustomEvent<{ origin: HTMLElement; write: boolean }>).detail;
      openThread(detail.origin, detail.write);
      document.getElementById("discussion")?.scrollIntoView({ block: "start", behavior: "instant" });
    };
    window.addEventListener("open-daily-discussion", requested);
    return () => window.removeEventListener("open-daily-discussion", requested);
  }, [heading, openThread]);
  useEffect(() => {
    if (!heading || !config) return;
    const observer = new IntersectionObserver(entries => { if (entries.some(entry => entry.isIntersecting)) { setMounted(true); observer.disconnect(); } });
    if (panelElement.current) observer.observe(panelElement.current);
    return () => observer.disconnect();
  }, [heading, config]);
  return <div id={heading ? "discussion" : undefined} className={heading ? "issue-discussion discussion" : "event-discussion discussion"} data-discussion-term={term} data-discussion-state={thread?.status || (config ? "configured" : "unconfigured")} onKeyDown={event => {
    if (event.key !== "Escape") return;
    if (picker) { event.stopPropagation(); setPicker(false); reactionTrigger.current?.focus(); }
    else if (open || composer) { event.stopPropagation(); close(); }
  }}>
    {heading && <header className="discussion-heading"><h2>本期讨论{count !== undefined && <span>{count}</span>}</h2>{thread && <div><span className="fixture-label">本地样本</span>{count !== undefined && count > 1 && <select aria-label="讨论排序" value={sort} onChange={event => setSort(event.target.value)}><option value="oldest">默认</option><option value="latest">最新</option></select>}</div>}</header>}
    {!heading && <>
      {thread && count !== undefined && count > 0 && <div className="comment-preview">
        {thread.comments.slice(0, 2).map(comment => <button key={comment.id} className="comment-preview-row" aria-label={`查看评论：${comment.author}`} aria-expanded={open} aria-controls={panel} onClick={event => openThread(event.currentTarget)}><span className="comment-avatar" aria-hidden="true">{comment.avatar}</span><span>{comment.text}</span></button>)}
        {count > 2 && <button className="discussion-link preview-all" aria-expanded={open} aria-controls={panel} onClick={event => openThread(event.currentTarget)}>全部讨论 {count}</button>}
      </div>}
      <div className="comment-footer">
        <div className="comment-footer-leading">{thread?.reactions.length ? <div className="reaction-list">{thread.reactions.map(reaction => <button key={reaction.emoji} className="reaction-chip" aria-label={`${reaction.emoji} ${reaction.count}`} aria-pressed={!!reaction.selected} onClick={() => update(current => toggleReaction(current, reaction.emoji))}><span>{reaction.emoji}</span>{reaction.count}</button>)}</div> : <button className="comment-write" aria-expanded={open} aria-controls={panel} onClick={event => openThread(event.currentTarget, !!thread && thread.status === "ready")}><Icon name="edit"/>{count === 0 ? "发表首评" : count ? "发表评论" : thread?.status === "failure" ? "查看讨论" : "参与讨论"}</button>}</div>
        <div className="comment-footer-actions">{thread && <span className="fixture-label">本地样本</span>}{thread && thread.status === "ready" && <button ref={reactionTrigger} aria-label="添加表情" aria-expanded={picker} aria-controls={`${panel}-reactions`} onClick={() => setPicker(!picker)}><Icon name="reaction"/></button>}<button aria-label="展开事件讨论" aria-expanded={open} aria-controls={panel} onClick={event => openThread(event.currentTarget)}><Icon name="comment"/></button></div>
      </div>
      {picker && <div className="reaction-picker" id={`${panel}-reactions`} role="group" aria-label="选择表情"><span>本地样本</span>{["👍", "👏", "🤔", "❤️", "😮"].map(emoji => <button key={emoji} aria-label={`选择 ${emoji}`} onClick={() => { update(current => toggleReaction(current, emoji)); setPicker(false); reactionTrigger.current?.focus(); }}>{emoji}</button>)}</div>}
    </>}
    <div ref={panelElement} className="discussion-panel" id={panel} hidden={!shown} tabIndex={-1} role="region" aria-label={heading ? "本期讨论内容" : "事件讨论内容"}>
      {(shown || mounted) && <>
        {thread ? <>
          {!heading && <div className="discussion-panel-heading"><span>{`讨论${count === undefined ? "" : ` ${count}`}`}</span><div><span className="fixture-label">本地样本</span>{count !== undefined && count > 1 && <select aria-label="讨论排序" value={sort} onChange={event => setSort(event.target.value)}><option value="oldest">默认</option><option value="latest">最新</option></select>}</div></div>}
          {thread.status === "failure" ? <div className="discussion-empty" role="alert"><p>评论暂时无法加载。</p><button className="discussion-link" onClick={() => { update(current => ({ ...current, status: "ready" })); panelElement.current?.focus({ preventScroll: true }); }}>重试</button></div> : <>
            {comments.length ? <><ol className="discussion-comments">{comments.map(comment => <Comment key={comment.id} comment={comment}/>)}</ol><p className="discussion-complete">已加载全部</p></> : <p className="discussion-empty">暂无评论，来聊聊你的看法。</p>}
            {!composer && <button className="discussion-compose-trigger" onClick={() => { setComposer(true); requestAnimationFrame(() => textarea.current?.focus({ preventScroll: true })); }}><Icon name="edit"/>说点什么…</button>}
            {composer && <form className="discussion-composer" onSubmit={event => { event.preventDefault(); const value = text.trim(); if (!value) return; update(current => ({ ...current, comments: [...current.comments, { id: `local-${Date.now()}`, author: "本地试读者", avatar: "我", text: value }] })); setText(""); setComposer(false); panelElement.current?.focus({ preventScroll: true }); }}><label htmlFor={composerId}>本地样本评论</label><textarea id={composerId} ref={textarea} rows={3} maxLength={2000} value={text} onChange={event => setText(event.target.value)} placeholder="说点什么…"/><div><span>仅在当前页面演示，不会发送。</span><button type="submit" disabled={!text.trim()}>添加样本评论</button></div></form>}
          </>}
        </> : config ? mounted && <GiscusThread config={config} term={term} date={date} anchor={anchor} eventId={eventId}/> : <p className="discussion-empty">讨论暂未开放。</p>}
        {!heading && <button className="discussion-link discussion-return" onClick={close}>收起讨论，返回阅读</button>}
      </>}
    </div>
  </div>;
}
