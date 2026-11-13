"use client";

import { useEffect, useRef, useState } from "react";
import { READER_FONT_MAX, READER_FONT_MIN } from "../lib/reader";
import { useReader } from "./ReaderProvider";
import Icon from "./Icon";

export function ReaderFontControl({ onOpen }: { onOpen?: () => void }) {
  const reader = useReader();
  const [open, setOpen] = useState(false);
  const [mobile, setMobile] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const slider = useRef<HTMLInputElement>(null);
  const size = reader?.fontSize ?? (mobile ? 15 : 17);

  useEffect(() => {
    const media = matchMedia("(max-width: 767px)");
    const sync = () => setMobile(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);
  useEffect(() => { setOpen(false); }, [reader?.article?.id]);
  useEffect(() => {
    if (!open) return;
    slider.current?.focus({ preventScroll: true });
    const dismiss = (event: PointerEvent) => { if (!root.current?.contains(event.target as Node)) setOpen(false); };
    document.addEventListener("pointerdown", dismiss);
    return () => document.removeEventListener("pointerdown", dismiss);
  }, [open]);

  return <div ref={root} className="reader-font-control" onKeyDown={event => {
    if (open && event.key === "Escape") {
      event.stopPropagation();
      setOpen(false);
      trigger.current?.focus({ preventScroll: true });
    }
  }}>
    <button ref={trigger} type="button" className="reader-font-trigger reader-chrome-control" data-glass-surface aria-label="调整字号" aria-expanded={open} aria-controls="reader-font-panel"
      onClick={() => { if (!open) onOpen?.(); setOpen(!open); }}>字</button>
    <div id="reader-font-panel" className="reader-font-panel" hidden={!open}>
      <label htmlFor="reader-font-size">正文字号 <output htmlFor="reader-font-size">{size} px</output></label>
      <input ref={slider} id="reader-font-size" type="range" min={READER_FONT_MIN} max={READER_FONT_MAX} step={1} value={size}
        onChange={event => reader?.setFontSize(Number(event.currentTarget.value))}/>
      <button type="button" onClick={() => reader?.setFontSize(null)}>恢复默认</button>
    </div>
  </div>;
}

export function ReaderShareControl({ onOpen }: { onOpen?: () => void }) {
  const reader = useReader();
  return <button type="button" className="reader-share-trigger reader-chrome-control" data-glass-surface aria-label="分享文章" title="分享文章" onClick={event => {
    onOpen?.();
    reader?.share(event.currentTarget);
  }}><Icon name="share"/></button>;
}
