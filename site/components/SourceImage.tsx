"use client";
import { useState } from "react";
import type { SourceImage as ImageData } from "../lib/types";
import { useImagePreview } from "./ImageGallery";
export default function SourceImage({
  image,
  caption = false,
}: {
  image?: ImageData;
  caption?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  const preview = useImagePreview();
  return (
    <figure
      className={`source-image ${!image || failed ? "image-fallback" : ""}`}
    >
      {image && !failed ? (
        <img
          src={image.url.replace(
            "https://shuang-su.github.io/gaussian-splatting-daily/",
            "/gaussian-splatting-daily/",
          )}
          alt={image.alt}
          loading="lazy"
          className={caption && preview ? "preview-trigger" : undefined}
          role={caption && preview ? "button" : undefined}
          tabIndex={caption && preview ? 0 : undefined}
          aria-label={caption && preview ? `放大图片：${image.alt}` : undefined}
          onClick={() => {
            if (caption) preview?.(image.url);
          }}
          onKeyDown={(e) => {
            if (caption && preview && ["Enter", " "].includes(e.key)) {
              e.preventDefault();
              preview(image.url);
            }
          }}
          style={{
            objectPosition: image.position || "center",
            objectFit: image.fit || "cover",
          }}
          onError={() => setFailed(true)}
        />
      ) : (
        <div className="fallback-poster">
          <span className="splat-glyph" aria-hidden="true">
            ∴
          </span>
          <span>{image ? "图片暂不可用" : "Gaussian Splatting"}</span>
        </div>
      )}
      {image && (
        <figcaption className={caption ? "" : "image-credit"}>
          {caption ? (
            <a href={image.source} target="_blank" rel="noopener noreferrer">
              {image.credit} ↗
            </a>
          ) : (
            image.credit
          )}
        </figcaption>
      )}
    </figure>
  );
}
