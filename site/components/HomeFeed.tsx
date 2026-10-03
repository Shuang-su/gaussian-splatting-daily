"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { SourceImage as ImageData } from "../lib/types";
import SourceImage from "./SourceImage";

type Feed = "daily" | "paper" | "tool";
type Item = { id: string; title: string; summary: string; date: string; url: string; image?: ImageData };
const tabs: [Feed, string][] = [["daily", "日报"], ["paper", "论文"], ["tool", "工具"]];
const routes = { daily: "/daily/", paper: "/papers/", tool: "/tools/" };
export default function HomeFeed({ feeds }: { feeds: Record<Feed, Item[]> }) {
  const [feed, setFeed] = useState<Feed>("daily");
  const [limits, setLimits] = useState<Record<Feed, number>>({ daily: 6, paper: 6, tool: 6 });
  const buttons = useRef<Partial<Record<Feed, HTMLButtonElement | null>>>({});
  const ready = useRef(false);
  useEffect(() => {
    try {
      const saved = JSON.parse(sessionStorage.getItem("gsd-home-v1") || "null");
      if (saved && tabs.some(([key]) => key === saved.feed)) setFeed(saved.feed);
      if (saved?.limits) setLimits(Object.fromEntries(tabs.map(([key]) => [key, Number.isInteger(saved.limits[key]) && saved.limits[key] >= 6 ? Math.min(saved.limits[key], Math.max(6, feeds[key].length)) : 6])) as Record<Feed, number>);
    } catch {}
    ready.current = true;
  }, [feeds]);
  useEffect(() => { if (ready.current) try { sessionStorage.setItem("gsd-home-v1", JSON.stringify({ feed, limits })); } catch {} }, [feed, limits]);
  const items = feeds[feed].slice(0, limits[feed]);
  return <section className="home-feed" aria-label="内容列表">
    <div className="feed-heading"><div className="feed-tabs" role="tablist" aria-label="内容类型">{tabs.map(([key, label], i) => <button key={key} id={`feed-${key}`} ref={el => { buttons.current[key] = el; }} role="tab" aria-selected={feed === key} aria-controls="home-feed-panel" tabIndex={feed === key ? 0 : -1} onClick={() => setFeed(key)} onKeyDown={e => {
      const next = e.key === "ArrowRight" ? (i + 1) % tabs.length : e.key === "ArrowLeft" ? (i + tabs.length - 1) % tabs.length : e.key === "Home" ? 0 : e.key === "End" ? tabs.length - 1 : -1;
      if (next >= 0) { e.preventDefault(); setFeed(tabs[next][0]); buttons.current[tabs[next][0]]?.focus(); }
    }}>{label}</button>)}</div><Link href={routes[feed]}>全部{tabs.find(([key]) => key === feed)?.[1]} <span aria-hidden="true">→</span></Link></div>
    <div id="home-feed-panel" role="tabpanel" aria-labelledby={`feed-${feed}`} tabIndex={0}>
      {items.map(item => <article className="feed-row" key={item.id}><div className="feed-row-copy"><h2><Link href={item.url}>{item.title}</Link></h2><time dateTime={item.date}>{item.date}</time><p>{item.summary}</p></div>{item.image && <Link className="feed-row-image" href={item.url} aria-label={`阅读 ${item.title}`}><SourceImage image={item.image} sizes="(max-width: 767px) 104px, 200px" /></Link>}</article>)}
      {!items.length && <p className="feed-empty">暂无{tabs.find(([key]) => key === feed)?.[1]}。</p>}
    </div>
    {limits[feed] < feeds[feed].length && <button className="load-more" onClick={() => setLimits(current => ({ ...current, [feed]: current[feed] + 6 }))}>加载更多</button>}
  </section>;
}
