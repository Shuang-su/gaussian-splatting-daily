"use client";
import { useEffect, useState } from "react";
import { DISCUSSIONS, commentCount, discussionTerm } from "../lib/discussions";
import { useDiscussionSample } from "./DiscussionProvider";
import Icon from "./Icon";

export default function ArticleInteractionBar({ dailyId }: { dailyId: string }) {
  const { thread } = useDiscussionSample(discussionTerm(dailyId), 0, true);
  const [saved, setSaved] = useState(false), [notice, setNotice] = useState("");
  const key = `gsd:reading-bookmark:v1:${dailyId}`;
  useEffect(() => { try { setSaved(localStorage.getItem(key) === "1"); } catch { /* Storage is optional. */ } }, [key]);
  useEffect(() => { if (!notice) return; const timer = setTimeout(() => setNotice(""), 3500); return () => clearTimeout(timer); }, [notice]);
  function open(origin: HTMLElement, write: boolean) { window.dispatchEvent(new CustomEvent("open-daily-discussion", { detail: { origin, write } })); }
  function bookmark() {
    try { if (saved) localStorage.removeItem(key); else localStorage.setItem(key, "1"); setSaved(!saved); setNotice(saved ? "已取消本机收藏" : "已收藏到本机"); }
    catch { setNotice("浏览器暂时无法保存收藏"); }
  }
  async function copy() {
    try { const url = new URL(location.href); url.search = ""; url.hash = ""; await navigator.clipboard.writeText(url.href); setNotice("文章链接已复制"); }
    catch { setNotice("复制未完成，请从地址栏复制链接"); }
  }
  const count = thread?.status === "ready" ? commentCount(thread.comments) : undefined;
  return <div className="article-interaction-wrap">
    <div className="article-interaction-bar" role="group" aria-label="文章操作">
      <button className="article-comment-entry" onClick={event => open(event.currentTarget, true)}><Icon name="edit"/><span>{thread || DISCUSSIONS ? "说点什么…" : "本期讨论"}</span></button>
      <button className="bar-comment-count" aria-label="查看本期讨论" onClick={event => open(event.currentTarget, false)}><Icon name="comment"/>{count !== undefined && <span>{count}</span>}</button>
      <button className="bar-directory" aria-label="打开文章目录" onClick={event => window.dispatchEvent(new CustomEvent("open-reading-navigation", { detail: { origin: event.currentTarget } }))}><Icon name="menu"/></button>
      <button aria-label={saved ? "取消本机收藏" : "收藏到本机"} title={saved ? "取消本机收藏" : "收藏到本机"} aria-pressed={saved} onClick={bookmark}><Icon name="bookmark"/></button>
      <button aria-label="复制文章链接" title="复制文章链接" onClick={copy}><Icon name="external"/></button>
    </div>
    <p className="article-action-notice" role="status">{notice}</p>
  </div>;
}
