"use client";
import { useState } from "react";
import type { SourceImage as ImageData } from "../lib/types";
import { assetUrl, imageKey, imageSrcSet } from "../lib/images";
import { useImagePreview } from "./ImageGallery";

export default function SourceImage({ image, caption = false, priority = false, sizes = "(max-width: 639px) 100vw, (max-width: 1023px) 80vw, 760px" }: { image?: ImageData; caption?: boolean; priority?: boolean; sizes?: string }) {
  const [failedUrl, setFailedUrl] = useState<string>();
  const preview = useImagePreview();
  if (!image) return null;
  const failed = failedUrl === image.url;
  const canPreview = caption && Boolean(preview);
  return (
    <figure className={`source-image${failed ? " image-fallback" : ""}`}>
      {!failed ? <img src={assetUrl(image.url)} srcSet={imageSrcSet(image)} sizes={sizes} width={image.width} height={image.height} alt={image.alt} loading={priority ? "eager" : "lazy"} fetchPriority={priority ? "high" : undefined} decoding="async"
        className={canPreview ? "preview-trigger" : undefined} role={canPreview ? "button" : undefined} tabIndex={canPreview ? 0 : undefined} aria-label={canPreview ? `放大图片：${image.alt}` : undefined}
        onClick={(e) => { if (canPreview) preview?.(imageKey(image), e.currentTarget); }}
        onKeyDown={(e) => { if (canPreview && ["Enter", " "].includes(e.key)) { e.preventDefault(); preview?.(imageKey(image), e.currentTarget); } }}
        style={{ objectPosition: image.position || "center", objectFit: image.fit }} onError={() => setFailedUrl(image.url)}
      /> : <div className="image-unavailable"><span>图片暂不可用</span>{caption && <a href={image.source} target="_blank" rel="noopener noreferrer">查看来源</a>}</div>}
      {caption && <figcaption><a href={image.source} target="_blank" rel="noopener noreferrer">{image.credit}</a></figcaption>}
    </figure>
  );
}
