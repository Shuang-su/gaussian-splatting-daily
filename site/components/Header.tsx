"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { BASE, TOPICS } from "../lib/catalog";
import BrandMark from "./BrandMark";
import Icon, { type IconName } from "./Icon";

type Panel = "mobile" | "topics" | "theme" | null;
const themes = [["system", "跟随系统"], ["light", "浅色"], ["dark", "暗色"]] as const;
const routes: { href: string; label: string; icon: IconName }[] = [
  { href: "/daily/", label: "日报", icon: "paper" },
  { href: "/papers/", label: "论文", icon: "layers" },
  { href: "/tools/", label: "工具", icon: "tool" },
];

export default function Header() {
  const [panel, setPanel] = useState<Panel>(null);
  const [theme, setTheme] = useState("system");
  const [mobileLayout, setMobileLayout] = useState(false);
  const pathname = usePathname();
  const home = pathname === "/";
  const header = useRef<HTMLElement>(null);
  const navigation = useRef<HTMLElement>(null);
  const trigger = useRef<HTMLButtonElement | null>(null);
  const currentPanel = useRef(panel);
  const readingDestination = useRef<number | null>(null);
  currentPanel.current = panel;

  useEffect(() => { setPanel(null); readingDestination.current = null; header.current?.classList.remove("header-hidden"); }, [pathname]);
  useEffect(() => {
    const width = window.matchMedia(`(max-width: ${home ? 1023 : 767}px)`);
    const sync = () => {
      setMobileLayout(width.matches);
      if (!width.matches) setPanel((current) => current === "mobile" ? null : current);
    };
    sync(); width.addEventListener("change", sync);
    return () => width.removeEventListener("change", sync);
  }, [home]);
  useEffect(() => {
    try { const saved = localStorage.getItem("gsd-theme"); if (saved && ["system", "light", "dark"].includes(saved)) setTheme(saved); } catch {}
    let last = window.scrollY, frame = 0;
    const scroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        const y = window.scrollY, delta = y - last;
        if (readingDestination.current !== null) {
          header.current?.classList.remove("header-hidden");
          if (Math.abs(y - readingDestination.current) <= 1) readingDestination.current = null;
        } else {
          if (!currentPanel.current && Math.abs(delta) > 5) header.current?.classList.toggle("header-hidden", delta > 0 && y > 56);
          if (y <= 56 || currentPanel.current) header.current?.classList.remove("header-hidden");
        }
        last = y; frame = 0;
      });
    };
    const cancelReadingScroll = () => { readingDestination.current = null; };
    const readingJump = (event: Event) => {
      const top = (event as CustomEvent<{ top: number }>).detail.top;
      if (!Number.isFinite(top)) return;
      readingDestination.current = Math.abs(window.scrollY - top) > 1 ? top : null; last = window.scrollY;
      header.current?.classList.remove("header-hidden");
    };
    const escape = (event: KeyboardEvent) => {
      if (["ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End", " "].includes(event.key)) cancelReadingScroll();
      if (event.key === "Escape" && currentPanel.current) { setPanel(null); trigger.current?.focus({ preventScroll: true }); }
    };
    const outside = (event: PointerEvent) => { cancelReadingScroll(); if (!header.current?.contains(event.target as Node)) setPanel(null); };
    window.addEventListener("scroll", scroll, { passive: true });
    window.addEventListener("reading-navigation-jump", readingJump);
    window.addEventListener("wheel", cancelReadingScroll, { passive: true });
    window.addEventListener("touchstart", cancelReadingScroll, { passive: true });
    window.addEventListener("resize", cancelReadingScroll);
    document.addEventListener("keydown", escape); document.addEventListener("pointerdown", outside);
    return () => {
      cancelAnimationFrame(frame); window.removeEventListener("scroll", scroll);
      window.removeEventListener("reading-navigation-jump", readingJump);
      window.removeEventListener("wheel", cancelReadingScroll); window.removeEventListener("touchstart", cancelReadingScroll);
      window.removeEventListener("resize", cancelReadingScroll);
      document.removeEventListener("keydown", escape); document.removeEventListener("pointerdown", outside);
    };
  }, []);

  useEffect(() => {
    if (panel !== "mobile") return;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const outside = Array.from(document.querySelectorAll<HTMLElement>("main, .site-footer"));
    const inert = outside.map((el) => el.inert);
    outside.forEach((el) => { el.inert = true; });
    const frame = requestAnimationFrame(() => navigation.current?.querySelector<HTMLInputElement>("input")?.focus());
    const trap = (event: KeyboardEvent) => {
      if (event.key !== "Tab") return;
      const controls = Array.from(header.current?.querySelectorAll<HTMLElement>("a, button, input, select") || [])
        .filter((el) => el.getClientRects().length && (el === trigger.current || navigation.current?.contains(el)));
      if (!controls.length) return;
      const first = controls[0], last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", trap);
    return () => {
      cancelAnimationFrame(frame); document.body.style.overflow = overflow;
      outside.forEach((el, i) => { el.inert = inert[i]; });
      document.removeEventListener("keydown", trap);
    };
  }, [panel, home]);

  function toggle(next: Exclude<Panel, null>, button: HTMLButtonElement) {
    trigger.current = button; header.current?.classList.remove("header-hidden"); setPanel(panel === next ? null : next);
  }
  function changeTheme(value: string) {
    setTheme(value); document.documentElement.dataset.theme = value;
    try { localStorage.setItem("gsd-theme", value); } catch {}
  }
  return <header ref={header} className={`site-header${home ? " home-header" : ""}`} data-menu-open={Boolean(panel)} data-mobile-open={panel === "mobile"} data-mobile-layout={mobileLayout}>
    <div className="header-inner">
      <div className="header-brand-group" inert={mobileLayout && panel === "mobile"}><Link href="/" className="brand" aria-label="高斯日报首页" onClick={() => setPanel(null)}><BrandMark /><span>高斯日报</span></Link>
        {home && <div id="home-feed-control" aria-hidden={panel === "mobile" || undefined} />}</div>
      <nav ref={navigation} className={panel === "mobile" ? "is-open" : ""} aria-label="主导航" id="main-nav" inert={mobileLayout && panel !== "mobile"} aria-hidden={mobileLayout && panel !== "mobile" || undefined}>
        <form className="mobile-nav-search" action={`${BASE}/search/`} method="get" role="search"><Icon name="search" /><input name="q" type="search" placeholder="搜索高斯日报…" aria-label="搜索高斯日报" /><button type="submit" aria-label="提交搜索"><Icon name="arrow" /></button></form>
        {routes.map(({ href, label, icon }) => <Link key={href} href={href} aria-current={pathname.startsWith(href.slice(0,-1)) ? "page" : undefined} onClick={() => setPanel(null)}><span className="mobile-route-icon"><Icon name={icon} /></span>{label}<span className="mobile-route-chevron"><Icon name="chevron" /></span></Link>)}
        <div className="topic-navigation">
          <button aria-expanded={panel === "topics"} aria-controls="header-topics" onClick={(e) => toggle("topics", e.currentTarget)}>主题 <Icon name="chevron" /></button>
          <div className="header-popover topic-popover" id="header-topics" hidden={panel !== "topics"}>{TOPICS.map((t) => <Link key={t.slug} href={`/topics/${t.slug}/`} onClick={() => setPanel(null)}>{t.label}</Link>)}<Link href="/topics/" onClick={() => setPanel(null)}>全部主题</Link></div>
        </div>
        <div className="mobile-nav-extra"><Link href="/topics/" onClick={() => setPanel(null)}><Icon name="layers" />主题<Icon name="chevron" /></Link><Link href="/subscribe/" onClick={() => setPanel(null)}><Icon name="external" />订阅高斯日报<Icon name="chevron" /></Link>
          <div className="mobile-theme-control"><span id="mobile-theme-label">外观</span><div className="mobile-theme-options" role="group" aria-labelledby="mobile-theme-label">{themes.map(([value, label]) => <button key={value} aria-pressed={theme === value} onClick={() => changeTheme(value)}>{label}</button>)}</div></div>
        </div>
      </nav>
      <div className="header-actions">
        <Link href="/search/" className="search-link" aria-label="搜索" onClick={() => setPanel(null)} inert={mobileLayout && panel === "mobile"}><Icon name="search" /></Link>
        <div className="appearance-navigation desktop-action" inert={mobileLayout && panel === "mobile"} aria-hidden={mobileLayout && panel === "mobile" || undefined}><button className="appearance-toggle" aria-label="外观" aria-expanded={panel === "theme"} aria-controls="header-appearance" onClick={(e) => toggle("theme", e.currentTarget)}><Icon name="theme" /></button>
          <div className="header-popover appearance-popover" id="header-appearance" hidden={panel !== "theme"} aria-label="显示主题">{[["light", "浅色"], ["dark", "暗色"], ["system", "跟随系统"]].map(([value, label]) => <button key={value} aria-pressed={theme === value} onClick={() => { changeTheme(value); setPanel(null); trigger.current?.focus({ preventScroll: true }); }}>{label}{theme === value && <Icon name="check" />}</button>)}</div>
        </div>
        <Link className="subscribe-link desktop-action" href="/subscribe/" onClick={() => setPanel(null)} inert={mobileLayout && panel === "mobile"}>订阅</Link>
        <button className="menu-toggle" aria-label={panel === "mobile" ? "关闭导航" : "打开导航"} aria-expanded={panel === "mobile"} aria-controls="main-nav" onClick={(e) => toggle("mobile", e.currentTarget)}><Icon name={panel === "mobile" ? "close" : "grid"} /></button>
      </div>
    </div>
  </header>;
}
