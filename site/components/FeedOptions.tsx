"use client";
import { useRef, useState } from "react";
import { BASE } from "../lib/catalog";
import { FEEDS } from "../lib/feeds";
export default function FeedOptions() {
  const [status, setStatus] = useState<Partial<Record<keyof typeof FEEDS, string>>>({});
  const inputs = useRef<Partial<Record<keyof typeof FEEDS, HTMLInputElement | null>>>({});
  async function copy(kind: keyof typeof FEEDS) {
    try { await navigator.clipboard.writeText(FEEDS[kind].url); setStatus(current => ({ ...current, [kind]: "已复制订阅链接" })); }
    catch { inputs.current[kind]?.focus(); inputs.current[kind]?.select(); setStatus(current => ({ ...current, [kind]: "请复制已选中的链接" })); }
  }
  return <div className="feed-options">{(["daily", "weekly"] as const).map(kind => <section key={kind} className="feed-option"><p className="eyebrow">RSS</p><h2>{FEEDS[kind].title}</h2><p>{kind === "daily" ? "每期日报的摘要、今日最值得看与全文入口。" : "每个已结束自然周的日报与重点事件，按周一至周日汇总。"}</p><label htmlFor={`rss-${kind}`}>订阅链接</label><input ref={element => { inputs.current[kind] = element; }} id={`rss-${kind}`} value={FEEDS[kind].url} readOnly spellCheck={false} /><div className="feed-option-actions"><button onClick={() => copy(kind)}>复制链接</button><a href={`${BASE}${FEEDS[kind].path}`} target="_blank" rel="noopener noreferrer">打开 RSS <span aria-hidden="true">↗</span></a></div><p className="copy-status" role="status">{status[kind] || ""}</p></section>)}</div>;
}
