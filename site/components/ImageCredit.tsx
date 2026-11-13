import type { SourceImage } from "../lib/types";

export default function ImageCredit({ image, showSourceLabel = false }: { image: SourceImage; showSourceLabel?: boolean }) {
  if (image.kind === "editorial-illustration") {
    return <>{image.credit} · <a href={image.source} target="_blank" rel="noopener noreferrer">主题来源</a></>;
  }
  return <a href={image.source} target="_blank" rel="noopener noreferrer">{image.credit}{showSourceLabel && " · 图片来源"}</a>;
}
