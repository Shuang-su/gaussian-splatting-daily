"use client";

import Link from "next/link";
import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import type { CSSProperties, MouseEvent } from "react";
import { createPortal } from "react-dom";
import { closeReaderSheet } from "../lib/reader-sheet";
import { lockDocumentScroll } from "../lib/scroll-lock";
import { BASE } from "../lib/catalog";
import type { ReadLaterArticle } from "../lib/read-later";
import { readReadingPosition, requestReadingResume } from "../lib/reading-progress";
import { useReader } from "./ReaderProvider";
import Icon from "./Icon";

const labels = { daily: "日报", editorial: "专题文章", weekly: "每周汇总" };

export function ReadLaterTrigger({ className, onOpen }: { className?: string; onOpen?: () => void }) {
  const reader = useReader();
  const count = reader?.readLaterIds.length || 0;
  return <button type="button" className={className} aria-haspopup="dialog" aria-label={`稍后阅读，${count} 篇`}
    onClick={event => { reader?.openReadLater(event.currentTarget); onOpen?.(); }}>
    <Icon name="bookmark"/><span>稍后阅读</span><span className="read-later-count" aria-hidden="true">{count}</span>
  </button>;
}

function Cover({ article }: { article: ReadLaterArticle }) {
  const [failed, setFailed] = useState(false);
  return <span className="read-later-cover" aria-hidden="true">
    {article.cover && !failed ? <img src={article.cover} alt="" draggable={false} onError={() => setFailed(true)}/> :
      <span className="read-later-cover-date"><strong>{article.date.slice(5).replace("-", "/")}</strong><span>{labels[article.kind]}</span></span>}
  </span>;
}

export default function ReadLater({ origin, items, close, toggle }: {
  origin: HTMLElement; items: ReadLaterArticle[]; close: () => void; toggle: (id: string) => boolean;
}) {
  const title = useId();
  const dialog = useRef<HTMLDialogElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const selector = useRef<HTMLDivElement>(null);
  const continueHere = useRef<string | null>(null);
  const touch = useRef<{ x: number; y: number } | null>(null);
  const lastWheel = useRef(0);
  const [activeId, setActiveId] = useState(items[0]?.id);
  const [all, setAll] = useState(false);
  const [reduced, setReduced] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [removed, setRemoved] = useState<ReadLaterArticle | null>(null);
  const [error, setError] = useState("");
  const activeIndex = Math.max(0, items.findIndex(item => item.id === activeId));
  const active = items[activeIndex];
  const list = all || reduced;

  useLayoutEffect(() => {
    const element = dialog.current;
    if (!element) return;
    element.showModal();
    closeButton.current?.focus();
    const unlock = lockDocumentScroll();
    let frame = requestAnimationFrame(() => { frame = requestAnimationFrame(() => setExpanded(true)); });
    return () => {
      cancelAnimationFrame(frame);
      element.close();
      unlock();
      if (continueHere.current) { requestReadingResume(continueHere.current); return; }
      const available = (element: HTMLElement) => element.getClientRects().length > 0 &&
        !element.closest("[inert], [aria-hidden=true]") && getComputedStyle(element).visibility !== "hidden";
      const target = [origin, ...document.querySelectorAll<HTMLElement>(".home-read-later-trigger, [data-reader-more-trigger]")]
        .find(element => element.isConnected && available(element));
      target?.focus({ preventScroll: true });
    };
  }, [origin]);

  useEffect(() => {
    const preference = matchMedia("(prefers-reduced-motion: reduce)");
    const change = () => setReduced(preference.matches);
    change();
    preference.addEventListener("change", change);
    return () => preference.removeEventListener("change", change);
  }, []);

  const move = (step: number) => {
    const item = items[Math.max(0, Math.min(items.length - 1, activeIndex + step))];
    if (item) setActiveId(item.id);
  };

  const remove = (item: ReadLaterArticle) => {
    if (!toggle(item.id)) { setError("浏览器暂时无法更新稍后阅读。"); return; }
    setError("");
    setRemoved(item);
    if (item.id === active?.id) setActiveId((items[activeIndex + 1] || items[activeIndex - 1])?.id);
    if (list) requestAnimationFrame(() => {
      const links = dialog.current?.querySelectorAll<HTMLElement>(".read-later-row a");
      const index = Math.min(items.indexOf(item), (links?.length || 0) - 1);
      (links?.[index] || closeButton.current)?.focus({ preventScroll: true });
    });
    else if (items.length === 1) closeButton.current?.focus();
  };

  function continueReading(event: MouseEvent<HTMLAnchorElement>, item: ReadLaterArticle) {
    if (event.button !== 0 || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
    const url = BASE + item.url;
    if (url.replace(/\/$/, "") === location.pathname.replace(/\/$/, "")) {
      event.preventDefault();
      continueHere.current = url;
      dismiss();
      return;
    }
    requestReadingResume(url);
    close();
  }

  function actions(item: ReadLaterArticle) {
    return <div className="read-later-actions">
      <Link href={item.url} onClick={event => continueReading(event, item)}>{readReadingPosition(item.id) ? "继续阅读" : "阅读文章"}</Link>
      <button type="button" aria-label={`移除《${item.title}》`} onClick={() => remove(item)}><Icon name="trash"/><span>移除</span></button>
    </div>;
  }

  const dismiss = () => closeReaderSheet(dialog.current, close);

  return createPortal(<dialog ref={dialog} className="reader-dialog read-later-dialog" data-sheet-drag aria-labelledby={title}
    onCancel={event => { event.preventDefault(); dismiss(); }}
    onClick={event => { if (event.target === event.currentTarget) dismiss(); }}>
    <div className="reader-dialog-content read-later-content">
      <div className="read-later-handle" data-sheet-handle aria-hidden="true"/>
      <header className="reader-dialog-header">
        <h2 id={title}>稍后阅读 <span className="read-later-count">{items.length}</span></h2>
        <button ref={closeButton} type="button" className="reader-dialog-close" aria-label="关闭稍后阅读" data-sheet-close onClick={dismiss}><Icon name="close"/></button>
      </header>
      {!active ? <p className="read-later-empty">收藏文章后，就能在这里继续阅读。</p> : list ? (
        <ol className="read-later-list">{items.map(item => <li key={item.id} className="read-later-row">
          <Cover article={item}/><div><p className="read-later-meta">{labels[item.kind]} · <time dateTime={item.date}>{item.date}</time></p><h3>{item.title}</h3>
          {item.summary && <p className="read-later-summary">{item.summary}</p>}
          {actions(item)}</div>
        </li>)}</ol>
      ) : (
        <div className="read-later-carousel">
          <div className="read-later-detail">
            <div aria-live="polite"><p className="read-later-meta">{labels[active.kind]} · <time dateTime={active.date}>{active.date}</time></p><h3>{active.title}</h3>{active.summary && <p className="read-later-summary">{active.summary}</p>}</div>
            {actions(active)}
            <div className="read-later-paging">
              <button type="button" aria-label="上一篇" disabled={activeIndex === 0} onClick={() => move(-1)}><Icon name="chevron"/></button>
              <span>{activeIndex + 1} / {items.length}</span>
              <button type="button" aria-label="下一篇" disabled={activeIndex === items.length - 1} onClick={() => move(1)}><Icon name="chevron"/></button>
            </div>
          </div>
          <div ref={selector} tabIndex={0} className="read-later-track" data-expanded={expanded} role="group" aria-label="收藏封面，用上下方向键浏览"
            onKeyDown={event => {
              if (event.key === "ArrowDown" || event.key === "ArrowUp") {
                event.preventDefault();
                move(event.key === "ArrowDown" ? 1 : -1);
                selector.current?.focus();
              }
            }}
            onWheel={event => {
              if (Math.abs(event.deltaY) < 3 || performance.now() - lastWheel.current < 140) return;
              lastWheel.current = performance.now();
              move(Math.sign(event.deltaY));
            }}
            onTouchStart={event => {
              const first = event.touches[0];
              touch.current = event.touches.length === 1 ? { x: first.clientX, y: first.clientY } : null;
            }}
            onTouchCancel={() => { touch.current = null; }}
            onTouchEnd={event => {
              const start = touch.current;
              touch.current = null;
              if (!start || !event.changedTouches.length) return;
              const { clientX, clientY } = event.changedTouches[0];
              if (Math.abs(clientY - start.y) > 24 && Math.abs(clientY - start.y) > Math.abs(clientX - start.x)) move(Math.sign(start.y - clientY));
            }}>
            {items.slice(Math.max(0, activeIndex - 2), activeIndex + 3).map(item => {
              const offset = items.indexOf(item) - activeIndex;
              return <button key={item.id} type="button" className="read-later-thumbnail" aria-pressed={offset === 0}
                aria-label={item.title} style={{ "--step": offset, "--distance": Math.abs(offset) } as CSSProperties}
                onClick={() => { setActiveId(item.id); selector.current?.focus(); }}><Cover article={item}/></button>;
            })}
          </div>

        </div>
      )}
      <footer className="read-later-footer">
        <div role="status">{error || (removed ? `已移除《${removed.title}》` : "")}</div>
        {removed && <button type="button" onClick={() => {
          if (!items.some(item => item.id === removed.id) && !toggle(removed.id)) { setError("浏览器暂时无法撤销移除。"); return; }
          setActiveId(removed.id);
          setRemoved(null);
          setError("");
          closeButton.current?.focus();
        }}>撤销</button>}
        {items.length > 0 && !reduced && <button type="button" onClick={() => setAll(!all)}>{all ? "返回封面" : "查看全部"}</button>}
      </footer>
    </div>
  </dialog>, document.body);
}
