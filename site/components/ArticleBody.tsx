"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useImagePreview } from "./ImageGallery";
import { readingHashTarget } from "../lib/reading-navigation";
import FootnotePopover from "./FootnotePopover";
import type { FootnoteSelection } from "./FootnotePopover";
export default function ArticleBody({ html }: { html: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const preview = useImagePreview();
  const [footnote, setFootnote] = useState<FootnoteSelection | null>(null);
  const closeFootnote = useCallback((restore: boolean) => {
    if (restore) footnote?.trigger.focus({ preventScroll: true });
    setFootnote(null);
  }, [footnote]);
  useEffect(() => {
    let closed: HTMLDetailsElement[] = [];
    const before = () => { closed = [...ref.current?.querySelectorAll<HTMLDetailsElement>("details:not([open])") || []]; closed.forEach(element => { element.open = true; }); };
    const after = () => { closed.forEach(element => { element.open = false; }); closed = []; };
    window.addEventListener("beforeprint", before); window.addEventListener("afterprint", after);
    return () => { window.removeEventListener("beforeprint", before); window.removeEventListener("afterprint", after); };
  }, [html]);
  useEffect(() => {
    let frame: number | undefined;
    function revealHash() {
      if (frame !== undefined) cancelAnimationFrame(frame);
      let id: string;
      try { id = decodeURIComponent(window.location.hash.slice(1)); } catch { return; }
      if (!id) return;
      const target = document.getElementById(id);
      if (!target || !ref.current?.contains(target)) return;
      for (let parent = target.parentElement; parent; parent = parent.parentElement) {
        if (parent instanceof HTMLDetailsElement) parent.open = true;
      }
      frame = requestAnimationFrame(() => readingHashTarget(target).scrollIntoView({ block: "start" }));
    }
    revealHash();
    window.addEventListener("hashchange", revealHash);
    return () => {
      window.removeEventListener("hashchange", revealHash);
      if (frame !== undefined) cancelAnimationFrame(frame);
    };
  }, [html]);
  useEffect(() => {
    const images = Array.from(ref.current?.querySelectorAll("img") || []);
    function fallback(event: Event) {
      const img = event.currentTarget as HTMLImageElement;
      if (img.dataset.failed) return;
      img.dataset.failed = "true";
      const text = document.createElement("span");
      text.className = "inline-image-fallback";
      text.textContent = "图片暂不可用。";
      const source = img.dataset.imageSource;
      if (source && /^https:\/\//.test(source)) {
        const link = document.createElement("a");
        link.href = source;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        link.textContent = "查看来源";
        text.append(" ", link);
      }
      img.replaceWith(text);
    }
    images.forEach((img) => {
      img.addEventListener("error", fallback);
      if (preview) {
        img.tabIndex = 0;
        img.setAttribute("role", "button");
        img.setAttribute("aria-label", `放大图片：${img.alt || "原文图示"}`);
        img.classList.add("preview-trigger");
      }
      if (img.complete && !img.naturalWidth)
        fallback({ currentTarget: img } as unknown as Event);
    });
    return () => images.forEach((img) => img.removeEventListener("error", fallback));
  }, [html, preview]);
  function show(e: React.MouseEvent | React.KeyboardEvent) {
    const img = e.target as HTMLElement;
    if ("button" in e && e.button === 0 && !e.ctrlKey && !e.metaKey && !e.altKey && !e.shiftKey) {
      const trigger = img.closest<HTMLAnchorElement>("a[data-footnote-ref]");
      if (trigger) {
        const hash = trigger.getAttribute("href");
        if (!hash?.startsWith("#")) return;
        let id;
        try { id = decodeURIComponent(hash.slice(1)); } catch { return; }
        const definition = document.getElementById(id);
        if (!definition?.closest("[data-footnotes]")) return;
        e.preventDefault();
        if (footnote?.trigger === trigger) closeFootnote(true);
        else setFootnote({ trigger, definition });
        return;
      }
    }
    if (img.tagName !== "IMG" || !preview) return;
    if ("key" in e && !["Enter", " "].includes(e.key)) return;
    e.preventDefault();
    preview(img.dataset.previewKey || (img as HTMLImageElement).getAttribute("src") || "", img);
  }
  return (
    <>
      <div className="prose" ref={ref} onClick={show} onKeyDown={show} dangerouslySetInnerHTML={{ __html: html }} />
      {footnote && <FootnotePopover selection={footnote} close={closeFootnote}/>}
    </>
  );
}
