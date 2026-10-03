"use client";
import { useEffect, useId, useRef, useState } from "react";
import { DISCUSSIONS, discussionFixture, discussionTerm } from "../lib/discussions";
import type { DiscussionConfig } from "../lib/discussions";
import { SITE_URL, dailyUrl } from "../lib/catalog";

export default function Discussion({ dailyId, date, eventId, anchor, heading = false, config = DISCUSSIONS }: { dailyId: string; date: string; eventId?: string; anchor?: string; heading?: boolean; config?: DiscussionConfig | null }) {
  const [open,setOpen] = useState(false), [mounted,setMounted] = useState(false);
  const [fixture,setFixture] = useState<string|null>(null), [status,setStatus] = useState("idle"), [attempt,setAttempt] = useState(0);
  const [src,setSrc] = useState<string>(); const [height,setHeight] = useState(260);
  const iframe = useRef<HTMLIFrameElement>(null), trigger = useRef<HTMLButtonElement>(null);
  const panelElement = useRef<HTMLDivElement>(null);
  const panel = useId(), term = discussionTerm(dailyId,eventId);
  useEffect(() => { setFixture(discussionFixture(location.hostname,new URLSearchParams(location.search).get("commentFixture"))); },[]);
  useEffect(() => {
    if (!mounted || !config || fixture) return;
    setStatus("loading");
    const system = matchMedia("(prefers-color-scheme: dark)");
    const dark = () => document.documentElement.dataset.theme === "dark" || document.documentElement.dataset.theme !== "light" && system.matches;
    const theme = () => dark() ? config.darkTheme : config.lightTheme;
    const backlink = `${SITE_URL}${dailyUrl(date)}${anchor ? `#${anchor}` : "#discussion"}`;
    let session = "";
    try {
      const current = new URL(location.href), returned = current.searchParams.get("giscus");
      if (returned) {
        localStorage.setItem("giscus-session",JSON.stringify(returned));
        current.searchParams.delete("giscus");
        history.replaceState(history.state,"",current);
      }
      const stored = JSON.parse(localStorage.getItem("giscus-session") || '""');
      session = typeof stored === "string" ? stored : "";
    } catch { /* Unavailable storage leaves the widget signed out. */ }
    const params = new URLSearchParams({repo:config.repo,repoId:config.repoId,category:config.category,categoryId:config.categoryId,term,strict:"1",origin:location.href.split("#")[0],backLink:backlink,theme:theme(),reactionsEnabled:"0",emitMetadata:"1",inputPosition:"bottom",session});
    setSrc(`https://giscus.app/zh-CN/widget?${params}`);
    const timer = setTimeout(() => setStatus(current => current === "loading" ? "failed" : current),15000);
    const listener = (message: MessageEvent) => {
      if (message.origin !== "https://giscus.app" || message.source !== iframe.current?.contentWindow || !message.data?.giscus) return;
      const data = message.data.giscus;
      if (Number.isFinite(data.resizeHeight)) { setHeight(Math.min(20000,Math.max(150,data.resizeHeight))); setStatus("ready"); }
      if (data.error && !String(data.error).includes("Discussion not found")) setStatus("failed");
      if (data.signOut) { try { localStorage.removeItem("giscus-session"); } catch {} setAttempt(value => value+1); }
    };
    const updateTheme = () => iframe.current?.contentWindow?.postMessage({giscus:{setConfig:{theme:theme()}}},"https://giscus.app");
    const observer = new MutationObserver(updateTheme);
    system.addEventListener("change",updateTheme);
    observer.observe(document.documentElement,{attributes:true,attributeFilter:["data-theme"]});
    window.addEventListener("message",listener);
    return () => {clearTimeout(timer); observer.disconnect(); system.removeEventListener("change",updateTheme); window.removeEventListener("message",listener);};
  },[mounted,config,fixture,term,attempt,date,anchor]);
  const close = () => {setOpen(false);trigger.current?.focus({preventScroll:true});};
  if (!config && !fixture) return null;
  return <div id={heading ? "discussion" : undefined} className={heading ? "issue-discussion discussion" : "discussion"} data-discussion-term={term} onKeyDown={e => {if(e.key === "Escape" && open){e.stopPropagation();close();}}}>
    {heading && <h2>本期讨论</h2>}
    <button ref={trigger} className="discussion-trigger" aria-expanded={open} aria-controls={panel} onClick={() => {setMounted(true);setOpen(!open);}}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M5 4h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-7l-5 3v-3H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z"/><path d="M7 9h10M7 13h7"/></svg>
      {eventId ? "讨论" : "展开本期讨论"}
    </button>
    {mounted && <div ref={panelElement} className="discussion-panel" id={panel} hidden={!open} tabIndex={-1} aria-label={eventId ? "事件讨论" : "本期讨论"}>
      {fixture ? <div><p className="fixture-label">本地验收样本 · {fixture} · 非真实评论</p>{fixture === "populated" ? <div className="sample-comment"><strong>本地测试账号</strong><p>这是一条用于检查排版与展开状态的样本评论。</p></div> : fixture === "empty" ? <p>暂无评论。</p> : <p role="alert">评论暂时无法加载。<button onClick={() => {setFixture("empty"); requestAnimationFrame(()=>panelElement.current?.focus({preventScroll:true}));}}>重试</button></p>}</div> : !config ? <p>评论尚未开放。</p> : <>
        {status === "loading" && <p role="status">正在加载讨论…</p>}
        {status === "failed" && <p role="alert">评论暂时无法加载。<button onClick={() => setAttempt(value => value+1)}>重试</button></p>}
        {src && <iframe key={attempt} ref={iframe} src={src} title={eventId ? "事件讨论" : "本期讨论"} height={height} loading="lazy" allow="clipboard-write" referrerPolicy="strict-origin-when-cross-origin" onError={() => setStatus("failed")} />}
      </>}
      <button className="discussion-return" onClick={close}>收起讨论</button>
    </div>}
  </div>;
}
