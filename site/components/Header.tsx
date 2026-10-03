"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { TOPICS } from "../lib/catalog";
import BrandMark from "./BrandMark";
import Icon from "./Icon";
type Panel = "mobile" | "topics" | "theme" | null;
export default function Header() {
  const [panel, setPanel] = useState<Panel>(null);
  const [theme, setTheme] = useState("system");
  const pathname = usePathname();
  const header = useRef<HTMLElement>(null);
  const trigger = useRef<HTMLButtonElement | null>(null);
  const currentPanel = useRef(panel);
  currentPanel.current = panel;
  useEffect(() => { setPanel(null); header.current?.classList.remove("header-hidden"); }, [pathname]);
  useEffect(() => {
    try { const saved = localStorage.getItem("gsd-theme"); if (saved && ["system", "light", "dark"].includes(saved)) setTheme(saved); } catch {}
    let last = window.scrollY, frame = 0;
    const scroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        const y = window.scrollY, delta = y - last;
        if (!currentPanel.current && Math.abs(delta) > 5) header.current?.classList.toggle("header-hidden", delta > 0 && y > 56);
        if (y <= 56 || currentPanel.current) header.current?.classList.remove("header-hidden");
        last = y; frame = 0;
      });
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && currentPanel.current) { setPanel(null); trigger.current?.focus({ preventScroll: true }); }
    };
    const outside = (event: PointerEvent) => { if (!header.current?.contains(event.target as Node)) setPanel(null); };
    window.addEventListener("scroll", scroll, { passive: true });
    document.addEventListener("keydown", escape); document.addEventListener("pointerdown", outside);
    return () => { cancelAnimationFrame(frame); window.removeEventListener("scroll", scroll); document.removeEventListener("keydown", escape); document.removeEventListener("pointerdown", outside); };
  }, []);
  function toggle(next: Exclude<Panel, null>, button: HTMLButtonElement) {
    trigger.current = button; header.current?.classList.remove("header-hidden"); setPanel(panel === next ? null : next);
  }
  function changeTheme(value: string) {
    setTheme(value); document.documentElement.dataset.theme = value;
    try { localStorage.setItem("gsd-theme", value); } catch {}
  }
  return <header ref={header} className="site-header" data-menu-open={Boolean(panel)}>
    <div className="header-inner">
      <Link href="/" className="brand" onClick={() => setPanel(null)}><BrandMark />高斯日报</Link>
      <nav className={panel === "mobile" ? "is-open" : ""} aria-label="主导航" id="main-nav">
        {[["/daily/", "日报"], ["/papers/", "论文"], ["/tools/", "工具"]].map(([href, label]) => <Link key={href} href={href} aria-current={pathname.startsWith(href.slice(0,-1)) ? "page" : undefined} onClick={() => setPanel(null)}>{label}</Link>)}
        <div className="topic-navigation">
          <button aria-expanded={panel === "topics"} aria-controls="header-topics" onClick={e => toggle("topics", e.currentTarget)}>主题 <span aria-hidden="true">⌄</span></button>
          <div className="header-popover topic-popover" id="header-topics" hidden={panel !== "topics"}>{TOPICS.map(t => <Link key={t.slug} href={`/topics/${t.slug}/`} onClick={() => setPanel(null)}>{t.label}</Link>)}<Link href="/topics/" onClick={() => setPanel(null)}>全部主题</Link></div>
        </div>
        <div className="mobile-nav-extra"><Link href="/topics/" onClick={() => setPanel(null)}>主题</Link><Link href="/subscribe/" onClick={() => setPanel(null)}>订阅高斯日报</Link><label>外观<select aria-label="手机显示主题" value={theme} onChange={e => changeTheme(e.target.value)}><option value="system">跟随系统</option><option value="light">浅色</option><option value="dark">暗色</option></select></label></div>
      </nav>
      <div className="header-actions">
        <Link href="/search/" className="search-link" aria-label="搜索" onClick={() => setPanel(null)}><Icon name="search" /></Link>
        <div className="appearance-navigation desktop-action"><button className="appearance-toggle" aria-label="外观" aria-expanded={panel === "theme"} aria-controls="header-appearance" onClick={e => toggle("theme", e.currentTarget)}><Icon name="theme" /></button>
          <div className="header-popover appearance-popover" id="header-appearance" hidden={panel !== "theme"} aria-label="显示主题">{[["light", "浅色"], ["dark", "暗色"], ["system", "跟随系统"]].map(([value, label]) => <button key={value} aria-pressed={theme === value} onClick={() => { changeTheme(value); setPanel(null); trigger.current?.focus({ preventScroll: true }); }}>{label}<span aria-hidden="true">{theme === value ? "✓" : ""}</span></button>)}</div>
        </div>
        <Link className="subscribe-link desktop-action" href="/subscribe/" onClick={() => setPanel(null)}>订阅</Link>
        <button className="menu-toggle" aria-label={panel === "mobile" ? "关闭导航" : "打开导航"} aria-expanded={panel === "mobile"} aria-controls="main-nav" onClick={e => toggle("mobile", e.currentTarget)}><Icon name={panel === "mobile" ? "close" : "menu"} /></button>
      </div>
    </div>
  </header>;
}
