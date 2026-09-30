"use client";
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import type { SourceImage } from "../lib/types";
import { assetUrl, imageKey } from "../lib/images";
import { clampOffset, fitImage, normalizeRotation, swipeDirection, zoomAt } from "../lib/gallery";
import type { GalleryView, Point, Size } from "../lib/gallery";

type OpenPreview = (key: string, trigger?: HTMLElement) => void;
const Preview = createContext<OpenPreview | undefined>(undefined);
export function useImagePreview() { return useContext(Preview); }
const initialView = (): GalleryView => ({ scale: 1, rotation: 0, offset: { x: 0, y: 0 } });
type Gesture = { kind: "single"; start: Point; offset: Point; scale: number } | { kind: "pinch"; midpoint: Point; distance: number; view: GalleryView };
type IconName = "left" | "right" | "rotateLeft" | "rotateRight" | "minus" | "plus" | "fit" | "external" | "close" | "retry";
function Icon({ name }: { name: IconName }) {
  const paths: Record<IconName, string> = {
    left: "m15 5-7 7 7 7", right: "m9 5 7 7-7 7",
    rotateLeft: "M3 10a9 9 0 1 1 1.5 7M3 4v6h6", rotateRight: "M21 10a9 9 0 1 0-1.5 7M21 4v6h-6",
    minus: "M5 12h14", plus: "M5 12h14M12 5v14",
    fit: "M8 3H3v5M16 3h5v5M3 16v5h5M21 16v5h-5M8 8h8v8H8z",
    external: "M14 3h7v7M21 3l-11 11M10 3H3v18h18v-7", close: "m6 6 12 12M18 6 6 18", retry: "M20 7v5h-5M20 12a8 8 0 1 0-2.3 5.7",
  };
  return <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[name]} /></svg>;
}
const point = (e: { clientX: number; clientY: number }): Point => ({ x: e.clientX, y: e.clientY });
const midpoint = (a: Point, b: Point): Point => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
const distance = (a: Point, b: Point): number => Math.hypot(a.x - b.x, a.y - b.y);

export default function ImageGallery({ images, children }: { images: SourceImage[]; children: React.ReactNode }) {
  const [index, setIndex] = useState<number | null>(null);
  const [view, setView] = useState<GalleryView>(initialView);
  const [stageSize, setStageSize] = useState<Size>({ width: 1, height: 1 });
  const [dimensionRevision, setDimensionRevision] = useState(0);
  const [failed, setFailed] = useState<Set<string>>(() => new Set());
  const [failedThumbnails, setFailedThumbnails] = useState<Set<string>>(() => new Set());
  const [retry, setRetry] = useState(0);
  const dialog = useRef<HTMLDialogElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const thumbnails = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLElement | null>(null);
  const triggerContainer = useRef<HTMLElement | null>(null);
  const currentIndex = useRef<number | null>(null);
  const viewRef = useRef<GalleryView>(initialView());
  const geometry = useRef({ image: { width: 1, height: 1 }, stage: { width: 1, height: 1 } });
  const dimensions = useRef(new Map<string, Size>());
  const animation = useRef<number | null>(null);
  const pointers = useRef(new Map<number, Point>());
  const gesture = useRef<Gesture | null>(null);
  const multiPointer = useRef(false);
  const moved = useRef(false);
  const beganOnBackdrop = useRef(false);
  const suppressClickUntil = useRef(0);
  currentIndex.current = index;
  const isOpen = index !== null;
  const current = index === null ? undefined : images[index];
  const key = current ? imageKey(current) : "";
  const sourceSize = dimensions.current.get(key) || { width: current?.width || 1, height: current?.height || 1 };
  const fitted = fitImage(sourceSize, stageSize, view.rotation);
  geometry.current = { image: fitted, stage: stageSize };

  const writeView = useCallback((next: GalleryView) => {
    const g = geometry.current;
    viewRef.current = { ...next, offset: clampOffset(next.offset, g.image, g.stage, next.scale, next.rotation) };
    if (animation.current !== null) return;
    animation.current = requestAnimationFrame(() => {
      animation.current = null;
      setView({ ...viewRef.current, offset: { ...viewRef.current.offset } });
    });
  }, []);
  const clearPointers = useCallback(() => {
    const captured = [...pointers.current.keys()];
    pointers.current.clear();
    gesture.current = null;
    if (captured.length) suppressClickUntil.current = performance.now() + 400;
    for (const pointerId of captured) {
      if (stage.current?.hasPointerCapture(pointerId)) stage.current.releasePointerCapture(pointerId);
    }
  }, []);
  const resetView = useCallback(() => {
    clearPointers();
    if (animation.current !== null) {
      cancelAnimationFrame(animation.current);
      animation.current = null;
    }
    viewRef.current = initialView();
    setView(initialView());
  }, [clearPointers]);
  const open = useCallback<OpenPreview>((requested, originatingElement) => {
    const normalized = assetUrl(requested);
    const found = images.findIndex((image) => imageKey(image) === normalized || assetUrl(image.url) === normalized || image.variants?.some((variant) => assetUrl(variant.url) === normalized));
    if (found < 0) return;
    trigger.current = originatingElement || (document.activeElement instanceof HTMLElement ? document.activeElement : null);
    triggerContainer.current = trigger.current?.parentElement || null;
    resetView();
    currentIndex.current = found;
    setIndex(found);
  }, [images, resetView]);
  const close = useCallback(() => { clearPointers(); currentIndex.current = null; setIndex(null); }, [clearPointers]);
  const select = useCallback((next: number) => { resetView(); currentIndex.current = next; setIndex(next); }, [resetView]);
  const move = useCallback((by: number) => {
    if (!images.length || currentIndex.current === null) return;
    select((currentIndex.current + by + images.length) % images.length);
  }, [images.length, select]);

  useEffect(() => {
    if (!isOpen) return;
    const element = dialog.current;
    if (!element) return;
    const scroll = { x: window.scrollX, y: window.scrollY };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    if (!element.open) element.showModal();
    return () => {
      clearPointers();
      if (element.open) element.close();
      document.body.style.overflow = previousOverflow;
      window.scrollTo({ left: scroll.x, top: scroll.y, behavior: "instant" });
      if (trigger.current?.isConnected) trigger.current.focus({ preventScroll: true });
      else if (triggerContainer.current?.isConnected) {
        const container = triggerContainer.current;
        const focusable = "a[href],button:not([disabled]),[tabindex]:not([tabindex='-1'])";
        const fallback = container.matches(focusable) ? container : container.querySelector<HTMLElement>(focusable);
        if (fallback) fallback.focus({ preventScroll: true });
        else {
          const oldTabIndex = container.getAttribute("tabindex");
          container.tabIndex = -1;
          container.focus({ preventScroll: true });
          if (oldTabIndex === null) container.removeAttribute("tabindex");
          else container.setAttribute("tabindex", oldTabIndex);
        }
      }
    };
  }, [isOpen, clearPointers]);
  useEffect(() => {
    if (!isOpen || !stage.current) return;
    const element = stage.current;
    const measure = () => setStageSize({ width: Math.max(1, element.clientWidth - 32), height: Math.max(1, element.clientHeight - 24) });
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [isOpen]);
  useEffect(() => {
    clearPointers();
    writeView(viewRef.current);
  }, [stageSize, dimensionRevision, key, view.rotation, clearPointers, writeView]);
  useEffect(() => {
    if (!isOpen || index === null) return;
    const strip = thumbnails.current;
    const selected = strip?.querySelector<HTMLButtonElement>(`[data-image-index="${index}"]`);
    if (!strip || !selected) return;
    const stripRect = strip.getBoundingClientRect();
    const selectedRect = selected.getBoundingClientRect();
    if (selectedRect.left < stripRect.left || selectedRect.right > stripRect.right) strip.scrollTo({ left: strip.scrollLeft + selectedRect.left - stripRect.left - (strip.clientWidth - selected.clientWidth) / 2, behavior: "smooth" });
  }, [index, isOpen]);
  useEffect(() => () => {
    if (animation.current !== null) {
      cancelAnimationFrame(animation.current);
      animation.current = null;
    }
    clearPointers();
  }, [clearPointers]);

  const relativePoint = (p: Point): Point => {
    const rect = stage.current!.getBoundingClientRect();
    return { x: p.x - rect.left - rect.width / 2, y: p.y - rect.top - rect.height / 2 };
  };
  const startSingle = (p: Point) => { gesture.current = { kind: "single", start: p, offset: { ...viewRef.current.offset }, scale: viewRef.current.scale }; };
  const zoom = (delta: number) => writeView(zoomAt(viewRef.current, viewRef.current.scale + delta, { x: 0, y: 0 }));
  const rotate = (delta: number) => { clearPointers(); writeView({ scale: 1, rotation: normalizeRotation(viewRef.current.rotation + delta), offset: { x: 0, y: 0 } }); };
  const markFailed = (failedKey: string, thumbnail = false) => {
    const update = thumbnail ? setFailedThumbnails : setFailed;
    update((old) => new Set(old).add(failedKey));
  };

  return <Preview.Provider value={open}>
    {children}
    <dialog className="image-preview" ref={dialog} aria-label="图片预览" onClose={() => { if (!dialog.current?.open) close(); }} onCancel={(event) => { event.preventDefault(); close(); }} onKeyDown={(event) => {
      if (event.key === "ArrowRight" || event.key === "ArrowLeft") { event.preventDefault(); move(event.key === "ArrowRight" ? 1 : -1); }
    }}>
      {current && <>
        <div className="preview-toolbar">
          <span className="preview-count" aria-live="polite">{(index ?? 0) + 1} / {images.length}</span>
          <button type="button" aria-label="逆时针旋转图片" title="逆时针旋转" onClick={() => rotate(-90)}><Icon name="rotateLeft" /></button>
          <button type="button" aria-label="顺时针旋转图片" title="顺时针旋转" onClick={() => rotate(90)}><Icon name="rotateRight" /></button>
          <button type="button" aria-label="缩小图片" title="缩小" disabled={view.scale <= 1} onClick={() => zoom(-0.5)}><Icon name="minus" /></button>
          <output className="preview-zoom" aria-label="缩放比例">{Math.round(view.scale * 100)}%</output>
          <button type="button" aria-label="放大图片" title="放大" disabled={view.scale >= 4} onClick={() => zoom(0.5)}><Icon name="plus" /></button>
          <button type="button" aria-label="适应屏幕" title="适应屏幕" onClick={() => { clearPointers(); writeView({ ...viewRef.current, scale: 1, offset: { x: 0, y: 0 } }); }}><Icon name="fit" /></button>
          <a href={assetUrl(current.originalUrl || current.url)} target="_blank" rel="noopener noreferrer" aria-label="查看原图" title="查看原图"><Icon name="external" /></a>
          <button type="button" aria-label="关闭图片预览" title="关闭" onClick={close}><Icon name="close" /></button>
        </div>
        <div className="preview-stage" ref={stage} data-scale={view.scale} data-rotation={view.rotation} data-offset-x={view.offset.x} data-offset-y={view.offset.y} onClick={(event) => {
          if (event.target === event.currentTarget && beganOnBackdrop.current && performance.now() > suppressClickUntil.current) close();
        }} onPointerDown={(event) => {
          if (event.button !== 0 || (event.target instanceof Element && event.target.closest("button,a")) || pointers.current.size >= 2) return;
          const p = point(event);
          if (!pointers.current.size) { moved.current = false; multiPointer.current = false; beganOnBackdrop.current = event.target === event.currentTarget; startSingle(p); }
          pointers.current.set(event.pointerId, p);
          event.currentTarget.setPointerCapture(event.pointerId);
          if (pointers.current.size === 2) {
            const [a, b] = [...pointers.current.values()];
            multiPointer.current = true;
            moved.current = true;
            gesture.current = { kind: "pinch", midpoint: relativePoint(midpoint(a, b)), distance: Math.max(1, distance(a, b)), view: { ...viewRef.current, offset: { ...viewRef.current.offset } } };
          }
        }} onPointerMove={(event) => {
          if (!pointers.current.has(event.pointerId) || !gesture.current) return;
          pointers.current.set(event.pointerId, point(event));
          const active = gesture.current;
          if (active.kind === "pinch" && pointers.current.size === 2) {
            const [a, b] = [...pointers.current.values()];
            writeView(zoomAt(active.view, active.view.scale * distance(a, b) / active.distance, active.midpoint, relativePoint(midpoint(a, b))));
          } else if (active.kind === "single") {
            const delta = { x: event.clientX - active.start.x, y: event.clientY - active.start.y };
            if (Math.hypot(delta.x, delta.y) > 8) moved.current = true;
            if (viewRef.current.scale > 1) writeView({ ...viewRef.current, offset: { x: active.offset.x + delta.x, y: active.offset.y + delta.y } });
          }
        }} onPointerUp={(event) => {
          if (!pointers.current.has(event.pointerId)) return;
          const active = gesture.current;
          pointers.current.delete(event.pointerId);
          if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
          if (pointers.current.size) startSingle([...pointers.current.values()][0]);
          else {
            gesture.current = null;
            if (moved.current || multiPointer.current) suppressClickUntil.current = performance.now() + 400;
            if (active?.kind === "single" && !multiPointer.current && active.scale === 1 && viewRef.current.scale === 1) {
              const direction = swipeDirection({ x: event.clientX - active.start.x, y: event.clientY - active.start.y });
              if (direction) move(direction);
            }
          }
        }} onPointerCancel={(event) => {
          pointers.current.delete(event.pointerId);
          if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
          suppressClickUntil.current = performance.now() + 400;
          multiPointer.current = true;
          if (pointers.current.size) startSingle([...pointers.current.values()][0]); else gesture.current = null;
        }} onLostPointerCapture={(event) => {
          if (!pointers.current.has(event.pointerId)) return;
          pointers.current.delete(event.pointerId);
          suppressClickUntil.current = performance.now() + 400;
          multiPointer.current = true;
          if (pointers.current.size) startSingle([...pointers.current.values()][0]); else gesture.current = null;
        }}>
          {images.length > 1 && <button type="button" className="preview-prev" aria-label="上一张图片" onClick={() => move(-1)}><Icon name="left" /></button>}
          {failed.has(key) ? <div className="preview-failed" role="status">
            <p>图片加载失败</p>
            <a href={current.source} target="_blank" rel="noopener noreferrer">查看来源</a>
            <button type="button" aria-label="重新加载图片" onClick={() => { setFailed((old) => { const next = new Set(old); next.delete(key); return next; }); setRetry((old) => old + 1); }}><Icon name="retry" />重试</button>
          </div> : <img key={`${key}:${retry}`} className="preview-picture" src={assetUrl(current.originalUrl || current.url)} alt={current.alt} draggable={false} decoding="async" style={{ width: fitted.width, height: fitted.height, transform: `translate(-50%, -50%) translate(${view.offset.x}px, ${view.offset.y}px) rotate(${view.rotation}deg) scale(${view.scale})` }} onLoad={(event) => {
            const element = event.currentTarget;
            dimensions.current.set(key, { width: element.naturalWidth, height: element.naturalHeight });
            setDimensionRevision((old) => old + 1);
          }} onError={() => markFailed(key)} />}
          {images.length > 1 && <button type="button" className="preview-next" aria-label="下一张图片" onClick={() => move(1)}><Icon name="right" /></button>}
        </div>
        <footer className="preview-footer">
          <p>{current.alt}</p>
          <a href={current.source} target="_blank" rel="noopener noreferrer">{current.credit} · 图片来源</a>
          <div className="preview-thumbnails" ref={thumbnails}>
            {images.map((image, i) => {
              const thumbnailKey = imageKey(image);
              return <button key={`${thumbnailKey}:${i}`} type="button" data-image-index={i} aria-label={`预览第 ${i + 1} 张图片`} aria-current={index === i ? "true" : undefined} onClick={() => select(i)}>
                {failedThumbnails.has(thumbnailKey) ? <span className="preview-thumbnail-failed" aria-hidden="true">{i + 1}</span> : <img src={assetUrl(image.variants?.[0]?.url || image.url)} alt="" loading="lazy" draggable={false} onError={() => markFailed(thumbnailKey, true)} />}
              </button>;
            })}
          </div>
        </footer>
      </>}
    </dialog>
  </Preview.Provider>;
}
