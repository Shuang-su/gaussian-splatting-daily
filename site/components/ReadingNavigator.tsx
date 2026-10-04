"use client";
import { useEffect, useRef, useState } from "react";
import type { MouseEvent, KeyboardEvent } from "react";
import { flattenReadingLinks, type ReadingLink } from "../lib/reading-navigation";

export default function ReadingNavigator({ items }: { items: ReadingLink[] }) {
  const [open, setOpen] = useState(false), [hovered, setHovered] = useState(false);
  const [compact, setCompact] = useState(false), [active, setActive] = useState(items[0]?.id);
  const panel = useRef<HTMLDivElement>(null), trigger = useRef<HTMLButtonElement>(null);
  const root = useRef<HTMLDivElement>(null), scrollList = useRef<HTMLElement>(null);
  const externalTrigger = useRef<HTMLElement | null>(null);
  useEffect(() => {
    const openFromBar = (event: Event) => { externalTrigger.current = (event as CustomEvent<{ origin: HTMLElement }>).detail.origin; setOpen(true); };
    window.addEventListener("open-reading-navigation", openFromBar);
    return () => window.removeEventListener("open-reading-navigation", openFromBar);
  }, []);
  const readingPosition = useRef<{ node: Element; top: number; width: number } | null>(null);
  const shown = open || (!compact && hovered);
  useEffect(() => {
    const media = matchMedia("(max-width: 1279px)");
    const update = () => { setCompact(media.matches); setHovered(false); };
    update(); media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      let current = items[0]?.id;
      for (const item of flattenReadingLinks(items)) {
        const target = document.getElementById(item.id);
        if (target && target.getClientRects().length && target.getBoundingClientRect().top <= 140) current = item.id;
      }
      setActive(current);
      // Retain a visible paragraph across width changes without animating normal scroll.
      if (!readingPosition.current || readingPosition.current.width === innerWidth) {
        const blocks = document.querySelectorAll(".article-shell h2, .article-shell h3, .article-shell p, .article-shell figure, .past-daily-card");
        const node = [...blocks].find(element => { const rect = element.getBoundingClientRect(); return rect.height > 0 && rect.bottom > 100 && rect.top < innerHeight; });
        readingPosition.current = node ? { node, top: node.getBoundingClientRect().top, width: innerWidth } : null;
      }
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };
    const observer = new ResizeObserver(schedule);
    const article = document.querySelector(".article-shell");
    if (article) observer.observe(article);
    const resize = () => {
      const previous = readingPosition.current;
      if (previous && previous.width !== innerWidth && previous.node.isConnected) {
        window.scrollBy({ top: previous.node.getBoundingClientRect().top - previous.top, behavior: "instant" });
        previous.width = innerWidth;
      }
      schedule();
    };
    addEventListener("scroll", schedule, { passive: true }); addEventListener("resize", resize); update();
    return () => { cancelAnimationFrame(frame); observer.disconnect(); removeEventListener("scroll", schedule); removeEventListener("resize", resize); };
  }, [items]);
  useEffect(() => {
    if (!shown) return;
    const current = scrollList.current?.querySelector<HTMLElement>('[aria-current="location"]');
    if (current && scrollList.current) {
      const list = scrollList.current, rect = current.getBoundingClientRect(), parent = list.getBoundingClientRect();
      if (rect.top < parent.top || rect.bottom > parent.bottom) list.scrollTop += rect.top - parent.top - list.clientHeight / 3;
    }
  }, [active, shown]);
  useEffect(() => {
    if (!open) return;
    const closeOutside = (event: PointerEvent) => { if (!root.current?.contains(event.target as Node)) { setOpen(false); setHovered(false); } };
    document.addEventListener("pointerdown", closeOutside);
    const previous = document.body.style.overflow;
    if (compact) { document.body.style.overflow = "hidden"; panel.current?.querySelector<HTMLButtonElement>("button")?.focus({ preventScroll: true }); }
    return () => { document.removeEventListener("pointerdown", closeOutside); if (compact) document.body.style.overflow = previous; };
  }, [open, compact]);
  function close() { setOpen(false); setHovered(false); requestAnimationFrame(() => { (externalTrigger.current || trigger.current)?.focus({ preventScroll: true }); externalTrigger.current = null; }); }
  useEffect(() => {
    if (!shown) return;
    const escape = (event: globalThis.KeyboardEvent) => { if (event.key === "Escape") { event.preventDefault(); close(); } };
    document.addEventListener("keydown", escape);
    return () => document.removeEventListener("keydown", escape);
  }, [shown]);
  function jump(event: MouseEvent<HTMLAnchorElement>, id: string) {
    const target = document.getElementById(id);
    if (!target || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    let parent = target.parentElement;
    while (parent) { if (parent instanceof HTMLDetailsElement) parent.open = true; parent = parent.parentElement; }
    if (compact) { setOpen(false); setHovered(false); }
    history.pushState(null, "", `#${encodeURIComponent(id)}`);
    target.scrollIntoView({ block: "start", behavior: "instant" });
    target.setAttribute("tabindex", "-1"); target.focus({ preventScroll: true });
    setActive(id);
  }
  function keys(event: KeyboardEvent) {
    if (event.key === "Escape" && shown) { event.preventDefault(); event.stopPropagation(); close(); }
    if (event.key !== "Tab" || !compact || !open) return;
    const controls = panel.current?.querySelectorAll<HTMLElement>('button, a[href], summary');
    if (!controls?.length) return;
    const first = controls[0], last = controls[controls.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  }
  function list(entries: ReadingLink[], depth = 0) {
    return <ul className={depth ? "reading-nav-children" : undefined}>{entries.map(item => {
      const hasActive = item.id === active || flattenReadingLinks(item.children || []).some(child => child.id === active);
      return <li key={item.id}><a href={`#${item.id}`} aria-current={item.id === active ? "location" : undefined} className={hasActive ? "is-current" : undefined} onClick={event => jump(event, item.id)}>{item.title}</a>{item.children?.length ? <details className="reading-nav-branch" open={hasActive || undefined}><summary aria-label={`展开${item.title}子目录`}>子目录</summary>{list(item.children, depth + 1)}</details> : null}</li>;
    })}</ul>;
  }
  return <div className="reading-navigator" ref={root} onKeyDown={keys}>
    {open && compact && <button className="reading-nav-backdrop" tabIndex={-1} aria-label="关闭目录" onClick={close} />}
    <aside className={`reading-nav-rail${shown ? " is-open" : ""}`} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
      <button className="reading-nav-ticks" aria-label="展开文章目录" aria-expanded={shown} onClick={() => setOpen(true)} tabIndex={shown ? -1 : 0}>
        {items.map(item => <span key={item.id} className={item.id === active || flattenReadingLinks(item.children || []).some(child => child.id === active) ? "is-current" : undefined} />)}
      </button>
      <div className="reading-nav-panel" ref={panel} id="reading-navigation" hidden={!shown} role={compact ? "dialog" : undefined} aria-modal={compact && open ? true : undefined} aria-label="文章目录">
        <header><h2>文章目录</h2><button aria-label="收起文章目录" onClick={close}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M6 18 18 6" /></svg></button></header>
        <nav aria-label="快捷跳转" ref={scrollList}>{list(items)}</nav>
        <a className="reading-nav-top" href="#article-top" onClick={event => jump(event, "article-top")}>回到文章开头</a>
      </div>
    </aside>
    <div className="reading-actions">
      <button ref={trigger} className={open ? "is-current" : undefined} aria-expanded={shown} aria-controls="reading-navigation" onClick={() => { setHovered(false); setOpen(!open); }}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" /></svg><span>目录</span></button>
      <a href="#article-top" aria-label="回到文章开头" onClick={event => jump(event, "article-top")}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 11 7-7 7 7M12 4v16" /></svg></a>
    </div>
  </div>;
}
