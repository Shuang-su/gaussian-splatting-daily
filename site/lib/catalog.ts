export const REPO = "https://github.com/Shuang-su/gaussian-splatting-daily";
export const BASE = "/gaussian-splatting-daily";
export const TOPICS = [
  {
    slug: "3dgs",
    label: "3DGS",
    pattern: /3DGS|3D Gaussian|Gaussian Splatting/i,
  },
  {
    slug: "4dgs",
    label: "4DGS",
    pattern: /4DGS|4D Gaussian|Dynamic Gaussian/i,
  },
  { slug: "webgpu", label: "WebGPU", pattern: /WebGPU|WebGL|stochastic/i },
  { slug: "lod", label: "LOD", pattern: /\bLOD\b|level.of.detail/i },
  {
    slug: "streaming",
    label: "Streaming",
    pattern: /streaming|streamed|流式/i,
  },
  { slug: "slam", label: "SLAM", pattern: /SLAM|Robotics|Mapping/i },
  { slug: "avatar", label: "Avatar", pattern: /Avatar|Human|人像|人体/i },
  {
    slug: "formats",
    label: "格式与压缩",
    pattern: /SPZ|SOG|glTF|compression|格式|压缩/i,
  },
];
export function dailyUrl(date: string) {
  return `/daily/${date.replaceAll("-", "/")}/`;
}
export function entryUrl(entry: { date: string; anchor: string }) {
  return `${dailyUrl(entry.date)}#${entry.anchor}`;
}
export function topicLabel(slug: string) {
  return TOPICS.find((t) => t.slug === slug)?.label || slug;
}
