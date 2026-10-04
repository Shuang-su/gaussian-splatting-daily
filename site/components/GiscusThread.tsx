"use client";
import { useEffect, useRef, useState } from "react";
import type { DiscussionConfig } from "../lib/discussions";
import { SITE_URL, dailyUrl } from "../lib/catalog";

export default function GiscusThread({ config, term, date, anchor, eventId }: { config: DiscussionConfig; term: string; date: string; anchor?: string; eventId?: string }) {
  const [status, setStatus] = useState("loading"), [attempt, setAttempt] = useState(0);
  const [src, setSrc] = useState<string>(), [height, setHeight] = useState(260);
  const iframe = useRef<HTMLIFrameElement>(null);
  useEffect(() => {
    
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
  },[config,term,attempt,date,anchor]);
  return <>
    {status === "loading" && <p role="status">正在加载讨论…</p>}
    {status === "failed" && <p role="alert">评论暂时无法加载。<button className="discussion-link" onClick={() => setAttempt(value => value + 1)}>重试</button></p>}
    {src && <iframe key={attempt} ref={iframe} src={src} title={eventId ? "事件讨论" : "本期讨论"} height={height} loading="lazy" allow="clipboard-write" referrerPolicy="strict-origin-when-cross-origin" onError={() => setStatus("failed")} />}
  </>;
}
