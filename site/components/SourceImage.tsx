"use client";
import { useEffect, useRef, useState } from "react";
import Link from "./ArticleLink";
import type { SourceImage as ImageData } from "../lib/types";
import { assetUrl, imageKey, imageSrcSet } from "../lib/images";
import { useImagePreview } from "./ImageGallery";

export default function SourceImage({ image, caption = false, previewable = caption, priority = false, href, label, sizes = "(max-width: 639px) 100vw, (max-width: 1023px) 80vw, 760px" }: { image?: ImageData; caption?: boolean; previewable?: boolean; priority?: boolean; href?: string; label?: string; sizes?: string }) {
  const [failedUrl, setFailedUrl] = useState<string>();
  const element = useRef<HTMLImageElement>(null);
  const preview = useImagePreview();
  useEffect(() => {
    // Static HTML can finish a failed image request before React attaches onError.
    if (image && element.current?.complete && !element.current.naturalWidth) setFailedUrl(image.url);
  }, [image?.url]);
  if (!image) return null;
  const failed = failedUrl === image.url;
  const canPreview = previewable && !href && Boolean(preview);
  const picture = <img data-card-image={imageKey(image)} ref={element} src={assetUrl(image.url)} srcSet={imageSrcSet(image)} sizes={sizes} width={image.width} height={image.height} alt={image.alt} loading={priority ? "eager" : "lazy"} fetchPriority={priority ? "high" : undefined} decoding="async"
        className={canPreview ? "preview-trigger" : undefined} role={canPreview ? "button" : undefined} tabIndex={canPreview ? 0 : undefined} aria-label={canPreview ? `放大图片：${image.alt}` : undefined}
        onClick={(e) => { if (canPreview) preview?.(imageKey(image), e.currentTarget); }}
        onKeyDown={(e) => { if (canPreview && ["Enter", " "].includes(e.key)) { e.preventDefault(); preview?.(imageKey(image), e.currentTarget); } }}
        style={{ objectPosition: image.position || "center", objectFit: image.fit }} onError={() => setFailedUrl(image.url)}
      />;
  return (
    <figure className={`source-image${failed ? " image-fallback" : ""}`}>
      {failed ? <div className="image-unavailable"><span>图片暂不可用</span><a href={image.source} target="_blank" rel="noopener noreferrer">查看来源</a></div> : href ? <Link className="source-image-link" href={href} aria-label={label}>{picture}</Link> : picture}
      {caption && <figcaption><a href={image.source} target="_blank" rel="noopener noreferrer">{image.credit}</a></figcaption>}
    </figure>
  );
}
