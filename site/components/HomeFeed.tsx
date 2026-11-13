"use client";

import Link from "./ArticleLink";
import { createPortal } from "react-dom";
import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { restoredUI, UI_CAPTURE, type PageUI } from "../lib/card-navigation";
import { HOME_SECTIONS, type HomeFeedKey, type HomeFeeds } from "../lib/home";
import BrandMark from "./BrandMark";
import Icon from "./Icon";
import SourceImage from "./SourceImage";

type ReadingState = { feed: HomeFeedKey; limits: Record<HomeFeedKey, number>; scroll: number };
const initialLimits: ReadingState["limits"] = { recommended: 6, daily: 6, article: 6, feature: 6, app: 6, paper: 6, tool: 6 };

export default function HomeFeed({ feeds, sidebar }: { feeds: HomeFeeds; sidebar: ReactNode }) {
  const [feed, setFeed] = useState<HomeFeedKey>("recommended");
  const [limits, setLimits] = useState(initialLimits);
  const [host, setHost] = useState<HTMLElement | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const buttons = useRef<Partial<Record<HomeFeedKey, HTMLButtonElement | null>>>({});
  const menuButtons = useRef<Partial<Record<HomeFeedKey, HTMLButtonElement | null>>>({});
  const menu = useRef<HTMLDivElement>(null);
  const menuTrigger = useRef<HTMLButtonElement>(null);
  const ready = useRef(false);
  const reading = useRef<ReadingState>({ feed, limits, scroll: 0 });
  const restore = useRef<ReadingState | null>(null);
  reading.current = { feed, limits, scroll: reading.current.scroll };

  useLayoutEffect(() => {
    ready.current = false;
    setHost(document.getElementById("home-feed-control"));
    try {
      const restored = restoredUI("homeFeed");
      let saved = restored;
      if (!saved) try { saved = JSON.parse(sessionStorage.getItem("gsd-home-v1") || "null"); } catch {}
      const state = saved as ReadingState | null;
      if (state && HOME_SECTIONS.some(({ key }) => key === state.feed)) {
        const limits = Object.fromEntries(HOME_SECTIONS.map(({ key }) => [key,
          Number.isInteger(state.limits?.[key]) && state.limits[key] >= 6
            ? Math.min(state.limits[key], Math.max(6, feeds[key].length)) : 6,
        ])) as ReadingState["limits"];
        const scroll = Number.isFinite(state.scroll) && state.scroll >= 0 ? state.scroll : 0;
        restore.current = restored ? null : { feed: state.feed, limits, scroll };
        // Keep cleanup/pagehide safe even if development Strict Mode reruns
        // mount effects before the restored React state has rendered.
        reading.current = { feed: state.feed, limits, scroll };
        setFeed(state.feed); setLimits(limits);
      }
    } catch {}
    ready.current = true;
    const scroll = () => { reading.current.scroll = window.scrollY; };
    const save = () => { try { sessionStorage.setItem("gsd-home-v1", JSON.stringify(reading.current)); } catch {} };
    const capture = (event: Event) => { (event as CustomEvent<{ ui: PageUI }>).detail.ui.homeFeed = { ...reading.current, scroll: window.scrollY }; };
    window.addEventListener(UI_CAPTURE, capture);
    window.addEventListener("scroll", scroll, { passive: true });
    window.addEventListener("pagehide", save);
    return () => { save(); window.removeEventListener(UI_CAPTURE, capture); window.removeEventListener("scroll", scroll); window.removeEventListener("pagehide", save); };
  }, [feeds]);

  useEffect(() => {
    const saved = restore.current;
    let frame = 0;
    if (saved && saved.feed === feed && HOME_SECTIONS.every(({ key }) => saved.limits[key] === limits[key])) {
      restore.current = null;
      frame = requestAnimationFrame(() => { window.scrollTo({ top: saved.scroll, behavior: "instant" }); });
    }
    if (ready.current && !restore.current) try { sessionStorage.setItem("gsd-home-v1", JSON.stringify(reading.current)); } catch {}
    return () => cancelAnimationFrame(frame);
  }, [feed, limits]);

  useEffect(() => {
    if (!menuOpen) return;
    const outside = (event: PointerEvent) => {
      if (!menu.current?.contains(event.target as Node)) setMenuOpen(false);
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") { setMenuOpen(false); menuTrigger.current?.focus({ preventScroll: true }); }
    };
    const focus = (event: FocusEvent) => {
      if (!menu.current?.contains(event.target as Node)) setMenuOpen(false);
    };
    const width = window.matchMedia("(min-width: 768px)");
    const resize = () => { if (width.matches) setMenuOpen(false); };
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", escape);
    document.addEventListener("focusin", focus);
    width.addEventListener("change", resize);
    return () => {
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("keydown", escape);
      document.removeEventListener("focusin", focus);
      width.removeEventListener("change", resize);
    };
  }, [menuOpen]);

  const section = HOME_SECTIONS.find(({ key }) => key === feed)!;
  const items = feeds[feed].slice(0, limits[feed]);
  const mobileMenu = <div className="home-feed-menu" ref={menu}>
    <button ref={menuTrigger} className="home-feed-select" aria-label={`内容栏目：${section.label}`}
      aria-expanded={menuOpen} aria-controls="home-feed-menu" aria-haspopup="menu"
      onClick={() => setMenuOpen((current) => !current)} onKeyDown={(e) => {
        if (e.key === "ArrowDown" || e.key === "ArrowUp") {
          e.preventDefault(); setMenuOpen(true);
          const key = e.key === "ArrowUp" ? HOME_SECTIONS[HOME_SECTIONS.length - 1].key : feed;
          requestAnimationFrame(() => menuButtons.current[key]?.focus());
        }
      }}>{section.label}<Icon name="chevron" /></button>
    <div id="home-feed-menu" className="home-feed-dropdown" role="menu" aria-label="选择内容栏目" hidden={!menuOpen}>
      {HOME_SECTIONS.map(({ key, label, icon }, i) => <button key={key} role="menuitemradio"
        ref={(el) => { menuButtons.current[key] = el; }} aria-checked={feed === key} tabIndex={feed === key ? 0 : -1}
        onClick={() => { setFeed(key); setMenuOpen(false); menuTrigger.current?.focus({ preventScroll: true }); }}
        onKeyDown={(e) => {
          const next = e.key === "ArrowDown" ? (i + 1) % HOME_SECTIONS.length
            : e.key === "ArrowUp" ? (i + HOME_SECTIONS.length - 1) % HOME_SECTIONS.length
              : e.key === "Home" ? 0 : e.key === "End" ? HOME_SECTIONS.length - 1 : -1;
          if (next >= 0) { e.preventDefault(); menuButtons.current[HOME_SECTIONS[next].key]?.focus(); }
        }}><Icon name={icon} /><span>{label}</span>{feed === key && <Icon name="check" />}</button>)}
    </div>
  </div>;

  return <div className={`home-content${host ? " has-header-selector" : ""}`}>
    {host && createPortal(mobileMenu, host)}
    <nav className="home-feed-nav" aria-label="首页内容栏目">
      <div className="home-feed-tabs" role="tablist" aria-label="内容类型" aria-orientation="vertical">
        {HOME_SECTIONS.map(({ key, label, icon }, i) => <button key={key} id={`feed-${key}`}
          ref={(el) => { buttons.current[key] = el; }} role="tab" aria-selected={feed === key}
          aria-controls="home-feed-panel" tabIndex={feed === key ? 0 : -1} onClick={() => setFeed(key)}
          onKeyDown={(e) => {
            const next = e.key === "ArrowDown" || e.key === "ArrowRight" ? (i + 1) % HOME_SECTIONS.length
              : e.key === "ArrowUp" || e.key === "ArrowLeft" ? (i + HOME_SECTIONS.length - 1) % HOME_SECTIONS.length
                : e.key === "Home" ? 0 : e.key === "End" ? HOME_SECTIONS.length - 1 : -1;
            if (next >= 0) { e.preventDefault(); setFeed(HOME_SECTIONS[next].key); buttons.current[HOME_SECTIONS[next].key]?.focus(); }
          }}><Icon name={icon} /><span>{label}</span></button>)}
      </div>
    </nav>
    <section className="home-feed" aria-label={`${section.label}内容`}>
      <div id="home-feed-panel" role="tabpanel" aria-label={`${section.label}内容`} tabIndex={0} data-feed={feed}>
        {items.map((item) => <article data-article-origin={`home:${feed}:${item.id}`} className="feed-row" key={item.id} data-entry-id={item.id}>
          <div className="feed-row-copy"><h2><Link href={item.url}>{item.title}</Link></h2>
            <div className="feed-meta"><span className="feed-source">{item.kind === "daily" && <BrandMark />}{item.sourceLabel}</span>
              <time dateTime={item.date}>{item.date.slice(5).replace("-", "/")}</time>
              <span className="feed-kind"><Icon name={item.kind === "daily" ? "paper" : item.kind === "paper" ? "layers" : "tool"} />
                {item.kind === "daily" ? "高斯日报" : item.kind === "paper" ? "研究" : item.kind === "article" ? item.sourceLabel : "工具"}</span>
            </div>
          </div>
          {item.image && <div className="feed-row-image"><SourceImage image={{ ...item.image, fit: "cover" }}
            href={item.url} label={`阅读 ${item.title}`} sizes="(max-width: 767px) 32vw, (max-width: 1023px) 25vw, 166px" /></div>}
        </article>)}
        {!items.length && <p className="feed-empty">暂无{section.label}内容。</p>}
      </div>
      <div className="feed-footer">
        {limits[feed] < feeds[feed].length && <button className="load-more"
          onClick={() => setLimits((current) => ({ ...current, [feed]: current[feed] + 6 }))}>加载更多</button>}
        <Link href={section.route}>查看全部{section.key === "recommended" ? "日报" : section.label}<Icon name="arrow" /></Link>
        <span className="sr-only" role="status">已显示 {items.length} 条{section.label}内容</span>
      </div>
    </section>
    {sidebar}
  </div>;
}
