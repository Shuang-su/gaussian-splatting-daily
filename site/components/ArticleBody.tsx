"use client";
import { useEffect, useRef } from "react";
import { useImagePreview } from "./ImageGallery";
export default function ArticleBody({ html }: { html: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const preview = useImagePreview();
  useEffect(() => {
    const images = Array.from(ref.current?.querySelectorAll("img") || []);
    function fallback(event: Event) {
      const img = event.currentTarget as HTMLImageElement;
      if (img.dataset.failed) return;
      img.dataset.failed = "true";
      const text = document.createElement("span");
      text.className = "inline-image-fallback";
      text.textContent = `图片暂不可用：${img.alt || "原文图示"}（来源链接保留于正文）`;
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
    return () =>
      images.forEach((img) => img.removeEventListener("error", fallback));
  }, [html, preview]);
  function show(e: React.MouseEvent | React.KeyboardEvent) {
    const img = e.target as HTMLElement;
    if (img.tagName !== "IMG" || !preview) return;
    if ("key" in e && !["Enter", " "].includes(e.key)) return;
    e.preventDefault();
    preview((img as HTMLImageElement).getAttribute("src") || "");
  }
  return (
    <div
      className="prose"
      ref={ref}
      onClick={show}
      onKeyDown={show}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
