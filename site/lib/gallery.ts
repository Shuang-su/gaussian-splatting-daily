export interface Point { x: number; y: number }
export interface Size { width: number; height: number }
export interface GalleryView { scale: number; rotation: number; offset: Point }

export function normalizeRotation(rotation: number): number {
  return ((rotation % 360) + 360) % 360;
}

export function fitImage(image: Size, stage: Size, rotation: number): Size {
  const angle = normalizeRotation(rotation) * Math.PI / 180;
  const width = Math.max(1, image.width);
  const height = Math.max(1, image.height);
  const rotatedWidth = Math.abs(Math.cos(angle)) * width + Math.abs(Math.sin(angle)) * height;
  const rotatedHeight = Math.abs(Math.sin(angle)) * width + Math.abs(Math.cos(angle)) * height;
  const factor = Math.min(1, Math.max(1, stage.width) / rotatedWidth, Math.max(1, stage.height) / rotatedHeight);
  return { width: width * factor, height: height * factor };
}

export function panLimits(image: Size, stage: Size, scale: number, rotation: number): Point {
  const angle = normalizeRotation(rotation) * Math.PI / 180;
  const width = (Math.abs(Math.cos(angle)) * image.width + Math.abs(Math.sin(angle)) * image.height) * scale;
  const height = (Math.abs(Math.sin(angle)) * image.width + Math.abs(Math.cos(angle)) * image.height) * scale;
  return { x: Math.max(0, (width - stage.width) / 2), y: Math.max(0, (height - stage.height) / 2) };
}

export function clampOffset(offset: Point, image: Size, stage: Size, scale: number, rotation: number): Point {
  const limits = panLimits(image, stage, scale, rotation);
  return { x: Math.max(-limits.x, Math.min(limits.x, offset.x)), y: Math.max(-limits.y, Math.min(limits.y, offset.y)) };
}

/** Preserve the image point under the initial anchor while zooming and moving the anchor. */
export function zoomAt(view: GalleryView, scale: number, anchor: Point, destination: Point = anchor): GalleryView {
  const nextScale = Math.max(1, Math.min(4, scale));
  const ratio = nextScale / view.scale;
  return {
    ...view,
    scale: nextScale,
    offset: {
      x: destination.x - (anchor.x - view.offset.x) * ratio,
      y: destination.y - (anchor.y - view.offset.y) * ratio,
    },
  };
}

export function swipeDirection(delta: Point): number {
  return Math.abs(delta.x) >= 60 && Math.abs(delta.y) < 80 && Math.abs(delta.x) > Math.abs(delta.y) * 1.25
    ? (delta.x > 0 ? -1 : 1) : 0;
}
