"use client";

import { useEffect, useRef, useState } from "react";
import type { DiscussionConfig } from "../lib/discussions";
import type { ReaderThread } from "./ReaderProvider";
import { giscusCount } from "../lib/reader";
import { SITE_URL } from "../lib/catalog";
import { useReader } from "./ReaderProvider";

const GISCUS_ORIGIN = "https://giscus.app";

export default function GiscusThread({ config, thread, reportCount }: {
  config: DiscussionConfig;
  thread: ReaderThread;
  reportCount: (term: string, count: number) => void;
}) {
  const [status, setStatus] = useState("loading");
  const [attempt, setAttempt] = useState(0);
  const [frame, setFrame] = useState<{ src: string; attempt: number }>();
  const [height, setHeight] = useState(260);
  const [discussionUrl, setDiscussionUrl] = useState<string>();
  const iframe = useRef<HTMLIFrameElement>(null);
  const { article, anchor, eventId, term } = thread;
  const currentArticle = useReader()?.article;

  useEffect(() => {
    if (currentArticle?.id !== article.id) return;
    setStatus("loading");
    const system = matchMedia("(prefers-color-scheme: dark)");
    const theme = () => {
      const mode = document.documentElement.dataset.theme;
      return mode === "dark" || mode !== "light" && system.matches ? config.darkTheme : config.lightTheme;
    };
    const current = new URL(location.href);
    current.searchParams.delete("giscus");
    current.searchParams.delete("commentFixture");
    const returnPath = current.pathname + current.search + current.hash;
    if (anchor) current.hash = anchor;
    else if (article.kind === "daily") current.hash = "discussion";
    const backlink = `${SITE_URL}${article.url}${current.hash}`;
    let session = "";
    try { session = JSON.parse(localStorage.getItem("giscus-session") || '""'); } catch {}
    try {
      sessionStorage.setItem("gsd:giscus-return:v1", JSON.stringify({ id: article.id, path: returnPath, anchor, scrollY: window.scrollY }));
    } catch {}
    const params = new URLSearchParams({
      repo: config.repo, repoId: config.repoId, category: config.category, categoryId: config.categoryId,
      term, strict: "1", origin: current.href, backLink: backlink, theme: theme(),
      reactionsEnabled: "1", emitMetadata: "1", inputPosition: "top", session: typeof session === "string" ? session : "",
    });
    const timer = setTimeout(() => setStatus(value => value === "loading" ? "failed" : value), 15000);
    const listener = (message: MessageEvent) => {
      if (message.origin !== GISCUS_ORIGIN || message.source !== iframe.current?.contentWindow || !message.data?.giscus) return;
      const data = message.data.giscus;
      if (Number.isFinite(data.resizeHeight)) {
        setHeight(Math.min(20000, Math.max(150, data.resizeHeight)));
        setStatus(value => value === "loading" ? "ready" : value);
      }
      const metadata = giscusCount(data.discussion, config.repo);
      if (metadata) {
        reportCount(term, metadata.count);
        setDiscussionUrl(metadata.url);
        setStatus("ready");
      }
      const error = typeof data.error === "string" ? data.error : "";
      if (data.signOut === true || session && /Bad credentials|Invalid state value|State has expired/i.test(error)) {
        try { localStorage.removeItem("giscus-session"); } catch {}
        setAttempt(value => value + 1);
      } else if (error.includes("Discussion not found")) setStatus("ready");
      else if (error) setStatus("failed");
    };
    const updateTheme = () => iframe.current?.contentWindow?.postMessage({ giscus: { setConfig: { theme: theme() } } }, GISCUS_ORIGIN);
    const observer = new MutationObserver(updateTheme);
    system.addEventListener("change", updateTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    window.addEventListener("message", listener);
    setFrame({ src: `${GISCUS_ORIGIN}/zh-CN/widget?${params}`, attempt });
    return () => {
      clearTimeout(timer);
      observer.disconnect();
      system.removeEventListener("change", updateTheme);
      window.removeEventListener("message", listener);
    };
  }, [config, term, attempt, article, currentArticle?.id, anchor, reportCount]);

  return <>
    {status === "loading" && <p role="status" className="discussion-empty">正在加载讨论…</p>}
    {status === "failed" && <p role="alert" className="discussion-empty">评论暂时无法加载。
      <button type="button" className="discussion-link" onClick={() => setAttempt(value => value + 1)}>重试</button>
    </p>}
    {frame?.attempt === attempt && <iframe key={attempt} ref={iframe} className="reader-giscus" src={frame.src} title={eventId ? "事件讨论" : "文章讨论"}
      height={height} allow="clipboard-write" referrerPolicy="strict-origin-when-cross-origin" onError={() => setStatus("failed")}/>}
    {discussionUrl && <p><a className="discussion-link" href={discussionUrl} target="_blank" rel="noopener noreferrer">在 GitHub 查看讨论</a></p>}
  </>;
}
