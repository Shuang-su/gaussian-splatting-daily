"use client";

import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { readerFontSize, readerShareUrl, readerThreadTerm, restoreReaderScroll, READER_FONT_KEY } from "../lib/reader";
import type { ReaderIdentity } from "../lib/reader";
import { DISCUSSIONS } from "../lib/discussions";
import ReaderPanels from "./ReaderPanels";

export interface ReaderThread {
  article: ReaderIdentity;
  term: string;
  eventId?: string;
  anchor?: string;
  sampleIndex?: number;
}

type ReaderPanel =
  | { kind: "discussion"; thread: ReaderThread; origin: HTMLElement | null }
  | { kind: "share"; url: string; origin: HTMLElement };

interface ReaderState {
  article: ReaderIdentity | null;
  fontSize: number | null;
  setFontSize: (size: number | null) => void;
  share: (origin: HTMLElement) => void;
  openDiscussion: (origin: HTMLElement | null, thread?: Omit<ReaderThread, "term">) => void;
  counts: Record<string, number>;
}

const Reader = createContext<ReaderState | null>(null);
const Register = createContext<(article: ReaderIdentity) => () => void>(() => () => {});

export default function ReaderProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [registered, setRegistered] = useState<ReaderIdentity | null>(null);
  const [fontSize, setFont] = useState<number | null>(null);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [panel, setPanel] = useState<ReaderPanel | null>(null);
  const article = registered && registered.url.replace(/\/$/, "") === pathname.replace(/\/$/, "") ? registered : null;

  const register = useCallback((identity: ReaderIdentity) => {
    setRegistered(identity);
    return () => setRegistered(current => current === identity ? null : current);
  }, []);

  useEffect(() => {
    let size = null;
    try { size = readerFontSize(localStorage.getItem(READER_FONT_KEY)); } catch {}
    setFont(size);
    if (size !== null) document.documentElement.style.setProperty("--reader-font-size", `${size}px`);
  }, []);

  const setFontSize = useCallback((size: number | null) => {
    const main = document.getElementById("main");
    const anchor = document.elementsFromPoint(innerWidth / 2, Math.min(innerHeight / 3, 220))
      .map(element => element.closest(".prose p, .prose li, .prose h2, .prose h3, .event-title"))
      .find(element => element && main?.contains(element)) || Array.from(main?.querySelectorAll(".prose p, .event-title") || [])
      .find(element => {
        const bounds = element.getBoundingClientRect();
        return bounds.height > 0 && bounds.bottom > 85 && bounds.top < innerHeight;
      });
    const before = anchor?.getBoundingClientRect().top;
    if (size === null) document.documentElement.style.removeProperty("--reader-font-size");
    else document.documentElement.style.setProperty("--reader-font-size", `${size}px`);
    if (anchor && before !== undefined) {
      const offset = anchor.getBoundingClientRect().top - before;
      if (offset) window.scrollBy({ top: offset, behavior: "instant" });
    }
    setFont(size);
    try {
      if (size === null) localStorage.removeItem(READER_FONT_KEY);
      else localStorage.setItem(READER_FONT_KEY, String(size));
    } catch {}
  }, []);

  const openDiscussion = useCallback((origin: HTMLElement | null, target?: Omit<ReaderThread, "term">) => {
    const current = target || (article && { article });
    if (!current) return;
    setPanel({ kind: "discussion", thread: { ...current, term: readerThreadTerm(current.article, current.eventId) }, origin });
  }, [article]);

  const share = useCallback(async (origin: HTMLElement) => {
    if (!article) return;
    const current = new URL(location.href);
    const url = readerShareUrl(article, current);
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title: article.title, url });
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
      }
    }
    if (origin.isConnected && location.pathname === current.pathname) setPanel({ kind: "share", url, origin });
  }, [article]);

  const reportCount = useCallback((term: string, count: number) => {
    setCounts(current => current[term] === count ? current : { ...current, [term]: count });
  }, []);

  useEffect(() => { setPanel(null); }, [pathname]);

  useEffect(() => {
    if (!article || !DISCUSSIONS) return;
    try {
      const current = new URL(location.href);
      const session = current.searchParams.get("giscus");
      if (!session) return;
      current.searchParams.delete("giscus");
      history.replaceState(history.state, "", current);
      try { localStorage.setItem("giscus-session", JSON.stringify(session)); } catch {}
      const pending = JSON.parse(sessionStorage.getItem("gsd:giscus-return:v1") || "null");
      sessionStorage.removeItem("gsd:giscus-return:v1");
      if (pending?.id !== article.id || typeof pending.path !== "string") return;
      const path = new URL(pending.path, current);
      if (path.origin !== current.origin || path.pathname !== current.pathname) return;
      history.replaceState(history.state, "", path);
      const candidate = typeof pending.anchor === "string" ? document.getElementById(pending.anchor) : null;
      const eventId = candidate?.getAttribute("data-event-id");
      const thread = { article, ...(eventId ? { eventId, anchor: candidate?.id } : {}) };
      const term = readerThreadTerm(article, eventId || undefined);
      const discussion = Array.from(document.querySelectorAll<HTMLElement>("[data-discussion-term]"))
        .find(element => element.dataset.discussionTerm === term);
      const top = restoreReaderScroll(pending.scrollY, document.documentElement.scrollHeight - innerHeight);
      if (top !== null) window.scrollTo({ top, behavior: "instant" });
      const button = discussion?.querySelector<HTMLButtonElement>("button");
      const bounds = button?.getBoundingClientRect();
      const visible = bounds && bounds.height > 0 && bounds.top >= 0 && bounds.bottom <= innerHeight;
      const target = (visible && button) || document.querySelector<HTMLButtonElement>(".article-comment-entry") ||
        document.querySelector<HTMLElement>("#article-top h1");
      if (target && !target.matches("button, a[href], [tabindex]")) target.tabIndex = -1;
      openDiscussion(target || null, thread);
    } catch {}
  }, [article, openDiscussion]);

  const value = useMemo(() => ({ article, fontSize, setFontSize, share, openDiscussion, counts }), [article, fontSize, setFontSize, share, openDiscussion, counts]);
  return <Register.Provider value={register}><Reader.Provider value={value}>
    {children}
    {panel && <ReaderPanels panel={panel} close={() => setPanel(null)} reportCount={reportCount}/>}
  </Reader.Provider></Register.Provider>;
}

export function ReaderArticle({ article }: { article: ReaderIdentity }) {
  const register = useContext(Register);
  useLayoutEffect(() => register(article), [register, article]);
  return <span hidden data-reader-article/>;
}

export function useReader() { return useContext(Reader); }

export type { ReaderPanel };
