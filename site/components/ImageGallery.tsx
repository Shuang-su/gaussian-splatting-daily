"use client";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import type { SourceImage } from "../lib/types";
const Preview = createContext<((url: string) => void) | undefined>(undefined);
export function useImagePreview() {
  return useContext(Preview);
}
export default function ImageGallery({
  images,
  children,
}: {
  images: SourceImage[];
  children: React.ReactNode;
}) {
  const [index, setIndex] = useState<number | null>(null);
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [failed, setFailed] = useState<string[]>([]);
  const dialog = useRef<HTMLDialogElement>(null);
  const startX = useRef<number | null>(null);
  const open = useCallback(
    (url: string) => {
      const found = images.findIndex((i) => i.url === url);
      if (found >= 0) {
        setScale(1);
        setRotation(0);
        setIndex(found);
      }
    },
    [images],
  );
  const close = () => setIndex(null);
  const move = (by: number) => {
    setScale(1);
    setRotation(0);
    setIndex((i) =>
      i === null ? null : (i + by + images.length) % images.length,
    );
  };
  useEffect(() => {
    const d = dialog.current;
    if (index === null) {
      if (d?.open) d.close();
      return;
    }
    if (!d?.open) d?.showModal();
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [index]);
  const current = index === null ? undefined : images[index];
  return (
    <Preview.Provider value={open}>
      {children}
      <dialog
        className="image-preview"
        ref={dialog}
        aria-label="图片预览"
        onClose={close}
        onCancel={close}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight") {
            e.preventDefault();
            move(1);
          }
          if (e.key === "ArrowLeft") {
            e.preventDefault();
            move(-1);
          }
        }}
      >
        {current && (
          <>
            <div className="preview-toolbar">
              <span aria-live="polite">
                {(index ?? 0) + 1} / {images.length}
              </span>
              <button
                type="button"
                aria-label="逆时针旋转图片"
                onClick={() => setRotation((r) => r - 90)}
              >
                ↺
              </button>
              <button
                type="button"
                aria-label="顺时针旋转图片"
                onClick={() => setRotation((r) => r + 90)}
              >
                ↻
              </button>
              <button
                type="button"
                aria-label="缩小图片"
                disabled={scale <= 1}
                onClick={() => setScale((s) => Math.max(1, s - 0.5))}
              >
                −
              </button>
              <button
                type="button"
                aria-label="放大图片"
                disabled={scale >= 3}
                onClick={() => setScale((s) => Math.min(3, s + 0.5))}
              >
                ＋
              </button>
              <button
                type="button"
                aria-label="适应屏幕"
                onClick={() => {
                  setScale(1);
                  setRotation(0);
                }}
              >
                适应
              </button>
              <a
                href={current.url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="查看原图"
              >
                ↗
              </a>
              <button type="button" aria-label="关闭图片预览" onClick={close}>
                ×
              </button>
            </div>
            <div
              className="preview-stage"
              onClick={(e) => {
                if (e.target === e.currentTarget) close();
              }}
              onPointerDown={(e) => {
                if (scale === 1) startX.current = e.clientX;
              }}
              onPointerUp={(e) => {
                if (
                  startX.current !== null &&
                  Math.abs(e.clientX - startX.current) > 60
                )
                  move(e.clientX > startX.current ? -1 : 1);
                startX.current = null;
              }}
            >
              {images.length > 1 && (
                <button
                  type="button"
                  className="preview-prev"
                  aria-label="上一张图片"
                  onClick={() => move(-1)}
                >
                  ‹
                </button>
              )}
              {failed.includes(current.url) ? (
                <p className="preview-failed">
                  图片暂不可用，可通过下方来源查看原文。
                </p>
              ) : (
                <img
                  src={current.url.replace(
                    "https://shuang-su.github.io/gaussian-splatting-daily/",
                    "/gaussian-splatting-daily/",
                  )}
                  alt={current.alt}
                  draggable={false}
                  style={{
                    transform: `rotate(${rotation}deg) scale(${scale})`,
                  }}
                  onError={() => setFailed((f) => [...f, current.url])}
                />
              )}
              {images.length > 1 && (
                <button
                  type="button"
                  className="preview-next"
                  aria-label="下一张图片"
                  onClick={() => move(1)}
                >
                  ›
                </button>
              )}
            </div>
            <footer className="preview-footer">
              <p>{current.alt}</p>
              <a
                href={current.source}
                target="_blank"
                rel="noopener noreferrer"
              >
                {current.credit} · 图片来源 ↗
              </a>
              <div className="preview-thumbnails">
                {images.map((img, i) => (
                  <button
                    key={img.url}
                    type="button"
                    aria-label={`预览第 ${i + 1} 张图片`}
                    aria-current={index === i ? "true" : undefined}
                    onClick={() => {
                      setScale(1);
                      setRotation(0);
                      setIndex(i);
                    }}
                  >
                    <img
                      src={img.url.replace(
                        "https://shuang-su.github.io/gaussian-splatting-daily/",
                        "/gaussian-splatting-daily/",
                      )}
                      alt=""
                      loading="lazy"
                    />
                  </button>
                ))}
              </div>
            </footer>
          </>
        )}
      </dialog>
    </Preview.Provider>
  );
}
