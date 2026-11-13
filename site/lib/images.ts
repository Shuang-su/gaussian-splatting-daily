import type { SourceImage } from "./types";
import { BASE } from "./catalog";

export const BASE_PATH = BASE;
const PUBLIC_ORIGIN = `https://metaflow.shuang-su.com${BASE_PATH}`;

export function assetUrl(url: string): string {
  if (url.startsWith(`${PUBLIC_ORIGIN}/`)) return url.slice("https://metaflow.shuang-su.com".length);
  if (url.startsWith(`${BASE_PATH}/`)) return url;
  return url.startsWith("/") ? `${BASE_PATH}${url}` : url;
}

export function imageKey(image: SourceImage): string {
  return assetUrl(image.originalUrl || image.url);
}

export function imageSrcSet(image: SourceImage): string | undefined {
  return image.variants?.map((v) => `${assetUrl(v.url)} ${v.width}w`).join(", ");
}

export function validImageUrl(url: string): boolean {
  return /^https:\/\//.test(url) || /^\/[a-zA-Z0-9_][a-zA-Z0-9_./-]*$/.test(url) && !url.includes("..");
}
