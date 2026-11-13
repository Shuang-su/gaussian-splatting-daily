"use client";

import dynamic from "next/dynamic";
import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { commentCount, DISCUSSIONS, toggleReaction } from "../lib/discussions";
import type { DiscussionComment } from "../lib/discussions";
import { useDiscussionSample } from "./DiscussionProvider";
import type { ReaderPanel, ReaderThread } from "./ReaderProvider";
import Icon from "./Icon";

const GiscusThread = dynamic(() => import("./GiscusThread"), { ssr: false });

function SampleComment({ comment }: { comment: DiscussionComment }) {
  return <li className="discussion-comment">
    <span className="comment-avatar" aria-hidden="true">{comment.avatar}</span>
    <div className="comment-content">
      <div className="comment-byline"><strong>{comment.author}</strong><span>本地样本</span></div>
      <p>{comment.text}</p>
      {!!comment.replies?.length && <details className="comment-replies">
        <summary>展开 {comment.replies.length} 条回复</summary>
        <ol>{comment.replies.map(reply => <SampleComment key={reply.id} comment={reply}/>)}</ol>
      </details>}
    </div>
  </li>;
}

function DiscussionContent({ thread, reportCount }: { thread: ReaderThread; reportCount: (term: string, count: number) => void }) {
  const { thread: sample, update } = useDiscussionSample(thread.term, thread.sampleIndex, !thread.eventId);
  const [draft, setDraft] = useState("");
  const [compose, setCompose] = useState(false);
  const [latest, setLatest] = useState(false);
  const input = useRef<HTMLTextAreaElement>(null);
  useEffect(() => { if (compose) input.current?.focus(); }, [compose]);
  if (!sample) {
    return DISCUSSIONS ? <GiscusThread config={DISCUSSIONS} thread={thread} reportCount={reportCount}/> :
      <p className="discussion-empty">讨论暂未开放。</p>;
  }
  return <div className="discussion">
    <div className="discussion-panel-heading">
      <span className="fixture-label">本地样本</span>
      {commentCount(sample.comments) > 1 && <select aria-label="讨论排序" value={latest ? "latest" : "oldest"} onChange={event => setLatest(event.currentTarget.value === "latest")}>
        <option value="oldest">默认</option><option value="latest">最新</option>
      </select>}
    </div>
    {sample.status === "failure" ? <div role="alert" className="discussion-empty">评论暂时无法加载。
      <button type="button" className="discussion-link" onClick={() => update(current => ({ ...current, status: "ready" }))}>重试</button>
    </div> : <>
      {sample.reactions.length > 0 && <div className="reaction-list">{sample.reactions.map(reaction =>
        <button type="button" className="reaction-chip" aria-pressed={!!reaction.selected} key={reaction.emoji}
          onClick={() => update(current => toggleReaction(current, reaction.emoji))}>{reaction.emoji} {reaction.count}</button>)}</div>}
      {sample.comments.length ? <ol className="discussion-comments">{(latest ? [...sample.comments].reverse() : sample.comments)
        .map(comment => <SampleComment key={comment.id} comment={comment}/>)}</ol> :
        <p className="discussion-empty">暂无评论，来聊聊你的看法。</p>}
      {compose ? <form className="discussion-composer" onSubmit={event => {
        event.preventDefault();
        if (!draft.trim()) return;
        update(current => ({ ...current, comments: [...current.comments, { id: `local-${Date.now()}`, author: "本地试读者", avatar: "我", text: draft.trim() }] }));
        setDraft("");
        setCompose(false);
      }}><label>本地样本评论<textarea ref={input} rows={3} maxLength={2000} value={draft} onChange={event => setDraft(event.currentTarget.value)}/></label>
        <button type="submit" disabled={!draft.trim()}>添加样本评论</button></form> :
        <button type="button" className="discussion-compose-trigger" onClick={() => setCompose(true)}>说点什么…</button>}
    </>}
  </div>;
}

export default function ReaderPanels({ panel, close, reportCount }: {
  panel: ReaderPanel;
  close: () => void;
  reportCount: (term: string, count: number) => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const field = useRef<HTMLInputElement>(null);
  const titleId = useId();
  const [notice, setNotice] = useState("");

  useLayoutEffect(() => {
    const element = dialog.current;
    if (!element) return;
    element.showModal();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      element.close();
      document.body.style.overflow = overflow;
      if (panel.origin?.isConnected) panel.origin.focus({ preventScroll: true });
    };
  }, [panel]);

  const title = panel.kind === "share" ? "分享文章" :
    panel.thread.eventId ? "事件讨论" : panel.thread.article.kind === "daily" ? "本期讨论" : "文章讨论";
  return createPortal(<dialog ref={dialog} className={`reader-dialog reader-dialog-${panel.kind}`} aria-labelledby={titleId}
    onCancel={event => { event.preventDefault(); close(); }}
    onClick={event => { if (event.target === event.currentTarget) close(); }}>
    <div className="reader-dialog-content">
      <header className="reader-dialog-header">
        <h2 id={titleId}>{title}</h2>
        <button type="button" className="reader-dialog-close" aria-label={`关闭${title}`} onClick={close}><Icon name="close"/></button>
      </header>
      {panel.kind === "discussion" ? <div className="reader-dialog-scroll"><DiscussionContent key={panel.thread.term} thread={panel.thread} reportCount={reportCount}/></div> :
        <div className="reader-share-options">
          <input ref={field} aria-label="文章链接" readOnly value={panel.url} onFocus={event => event.currentTarget.select()}/>
          <button type="button" onClick={async () => {
            try {
              await navigator.clipboard.writeText(panel.url);
              setNotice("文章链接已复制");
            } catch {
              field.current?.focus();
              field.current?.select();
              setNotice("已选中文章链接，可手动复制");
            }
          }}>复制链接</button>
          <p role="status">{notice}</p>
        </div>}
    </div>
  </dialog>, document.body);
}
