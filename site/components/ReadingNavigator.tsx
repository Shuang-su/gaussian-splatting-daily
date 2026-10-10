"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import type { MouseEvent, KeyboardEvent } from "react";
import { flattenReadingLinks, type ReadingLink } from "../lib/reading-navigation";
import Icon from "./Icon";

function headingContentTop(target: Element) {
  const heading = target.matches("h1, h2, h3, h4") ? target : target.querySelector("h1, h2, h3, h4");
  if (!heading) return target.getBoundingClientRect().top;
  const style = getComputedStyle(heading);
  return heading.getBoundingClientRect().top + (parseFloat(style.paddingTop) || 0) + (parseFloat(style.borderTopWidth) || 0);
}

export default function ReadingNavigator({ items }: { items: ReadingLink[] }) {
  const [open, setOpen] = useState(false), [hovered, setHovered] = useState(false);
  const [pinned, setPinned] = useState(false);
  const [compact, setCompact] = useState(false), [active, setActive] = useState(items[0]?.id);
  const panel = useRef<HTMLDivElement>(null), trigger = useRef<HTMLButtonElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const root = useRef<HTMLDivElement>(null), scrollList = useRef<HTMLElement>(null);
  const externalTrigger = useRef<HTMLElement | null>(null);
  useEffect(() => {
    const openFromBar = (event: Event) => { externalTrigger.current = (event as CustomEvent<{ origin: HTMLElement }>).detail.origin; setOpen(true); };
    window.addEventListener("open-reading-navigation", openFromBar);
    return () => window.removeEventListener("open-reading-navigation", openFromBar);
  }, []);
  const readingPosition = useRef<{ node: Element; top: number; width: number } | null>(null);
  const shown = open || (!compact && (hovered || pinned));
  useEffect(() => {
    const media = matchMedia("(max-width: 1279px)");
    const update = () => { setCompact(media.matches); setOpen(false); setHovered(false); };
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
        if (target && target.getClientRects().length && headingContentTop(target) <= 140) current = item.id;
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
    const closeOutside = (event: PointerEvent) => { if (!root.current?.contains(event.target as Node) && (compact || !pinned)) { setOpen(false); setHovered(false); } };
    document.addEventListener("pointerdown", closeOutside);
    const previous = document.body.style.overflow;
    if (compact) { document.body.style.overflow = "hidden"; closeButton.current?.focus({ preventScroll: true }); }
    return () => { document.removeEventListener("pointerdown", closeOutside); if (compact) document.body.style.overflow = previous; };
  }, [open, compact, pinned]);
  function close() {
    setOpen(false); setHovered(false); setPinned(false);
    requestAnimationFrame(() => {
      const origin = externalTrigger.current;
      (origin?.getClientRects().length ? origin : trigger.current)?.focus({ preventScroll: true });
      externalTrigger.current = null;
    });
  }
  function togglePin() { setPinned(value => !value); setOpen(false); }
  useEffect(() => {
    if (!shown) return;
    const escape = (event: globalThis.KeyboardEvent) => { if (event.key === "Escape") { event.preventDefault(); close(); } };
    document.addEventListener("keydown", escape);
    return () => document.removeEventListener("keydown", escape);
  }, [shown]);
  const jump = useCallback((event: MouseEvent<HTMLAnchorElement> | globalThis.MouseEvent, id: string) => {
    const target = document.getElementById(id);
    if (!target || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    let parent = target.parentElement;
    while (parent) { if (parent instanceof HTMLDetailsElement) parent.open = true; parent = parent.parentElement; }
    if (compact) { setOpen(false); setHovered(false); }
    history.pushState(null, "", `#${encodeURIComponent(id)}`);
    const behavior = matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth";
    const padding = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0;
    // The reference title has a 16px inset; section IDs can precede the title by different amounts.
    const destination = id === "article-top" ? 0 : window.scrollY + headingContentTop(target) - padding - 16;
    const top = Math.max(0, Math.min(destination, document.documentElement.scrollHeight - window.innerHeight));
    window.dispatchEvent(new CustomEvent("reading-navigation-jump", { detail: { top } }));
    window.scrollTo({ top, behavior });
    target.setAttribute("tabindex", "-1"); target.focus({ preventScroll: true });
    setActive(id);
  }, [compact]);
  useEffect(() => {
    // The server-rendered overview shares the directory's motion, focus, and title inset.
    const overviewJump = (event: globalThis.MouseEvent) => {
      if (event.button !== 0 || !(event.target instanceof Element)) return;
      const anchor = event.target.closest<HTMLAnchorElement>(".reading-guide a[href^='#']");
      if (!anchor) return;
      let id: string;
      try { id = decodeURIComponent(anchor.hash.slice(1)); } catch { return; }
      jump(event, id);
    };
    document.addEventListener("click", overviewJump);
    return () => document.removeEventListener("click", overviewJump);
  }, [jump]);
  function keys(event: KeyboardEvent) {
    if (event.key === "Escape" && shown) { event.preventDefault(); event.stopPropagation(); close(); }
    if (event.key !== "Tab" || !compact || !open) return;
    const controls = [...(panel.current?.querySelectorAll<HTMLElement>('button, a[href], summary') || [])].filter(control => control.getClientRects().length && getComputedStyle(control).visibility !== "hidden");
    if (!controls?.length) return;
    const first = controls[0], last = controls[controls.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  }
  function list(entries: ReadingLink[], depth = 0) {
    return <ul className={depth ? "reading-nav-children" : undefined}>{entries.map(item => {
      const hasActive = item.id === active || flattenReadingLinks(item.children || []).some(child => child.id === active);
      return <li key={item.id}><a href={`#${item.id}`} aria-current={item.id === active ? "location" : undefined} className={hasActive ? "is-current" : undefined} onClick={event => jump(event, item.id)}><span className="reading-nav-prefix" aria-hidden="true" /><span className="reading-nav-text">{item.title}</span></a>{item.children?.length ? <details className="reading-nav-branch" open={hasActive || undefined}><summary aria-label={`展开${item.title}子目录`}>子目录</summary>{list(item.children, depth + 1)}</details> : null}</li>;
    })}</ul>;
  }
  return <div className={`reading-navigator${shown ? " is-open" : ""}`} ref={root} onKeyDown={keys}>
    <button className={`reading-nav-backdrop${compact && open ? " is-open" : ""}`} tabIndex={-1} inert={!compact || !open} aria-hidden={!compact || !open} aria-label="关闭目录" onClick={close} />
    <aside className={`reading-nav-rail${shown ? " is-open" : ""}${pinned ? " is-pinned" : ""}`} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
      <button className="reading-nav-ticks" aria-label="展开文章目录" aria-expanded={shown} aria-controls="reading-navigation" aria-hidden={shown} inert={shown} onClick={() => setOpen(true)} tabIndex={shown ? -1 : 0} />
      <div className="reading-nav-panel" ref={panel} id="reading-navigation" inert={!shown} aria-hidden={!shown} role={compact ? "dialog" : undefined} aria-modal={compact && open ? true : undefined} aria-label="文章目录">
        <header><h2>文章目录</h2><div className="reading-nav-controls"><button className="reading-nav-pin" aria-label="固定文章目录" aria-pressed={pinned} title={pinned ? "取消固定目录" : "固定目录"} onClick={togglePin}><Icon name="pin" /></button><button className="reading-nav-close" ref={closeButton} aria-label="收起文章目录" onClick={close}><Icon name="close" /></button></div></header>
        <nav aria-label="快捷跳转" ref={scrollList}>{list(items)}</nav>
      </div>
    </aside>
    <div className="reading-actions">
      <button ref={trigger} className={shown ? "is-current" : undefined} aria-expanded={shown} aria-controls="reading-navigation" onClick={() => { if (shown) close(); else { setHovered(false); setOpen(true); } }}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" /></svg><span>目录</span></button>
      <a className="reading-backtop" href="#article-top" aria-label="回到文章开头" onClick={event => jump(event, "article-top")}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 11 7-7 7 7M12 4v16" /></svg></a>
    </div>
  </div>;
}
