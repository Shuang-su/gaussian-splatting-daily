export const REPO = "https://github.com/Shuang-su/metaflow-horizon";
export const BASE = "/horizon";
export const SITE_URL = `https://metaflow.shuang-su.com${BASE}`;
export const BRAND = "metaflow horizon";
export const TOPICS = [
  { slug: "capture", label: "扫描与摄影测量", pattern: /capture|scan|photogrammetry|摄影测量|扫描|采集/i },
  { slug: "spatial-ai", label: "空间 AI", pattern: /World Labs|SpAItial|world model|空间|NeRF|生成式/i },
  { slug: "xr", label: "XR 与创作", pattern: /XR|VR|AR|创作|作品|艺术|展览/i },
  { slug: "industry", label: "行业与应用", pattern: /平台|商业|应用|收费|合作|行业/i },
  {
    slug: "3dgs",
    label: "3DGS",
    pattern: /3DGS|3D Gaussian|Gaussian Splatting|高斯|Spirula|LichtFeld|SuperSplat|SplatTransform|gsplat|Gaussian-Splat-Lite/i,
  },
  {
    slug: "4dgs",
    label: "4DGS",
    pattern: /4DGS|4D Gaussian|Dynamic Gaussian|四维高斯|动态高斯/i,
  },
  { slug: "webgpu", label: "WebGPU", pattern: /WebGPU|WebGL|stochastic|随机渲染|随机透明度/i },
  { slug: "lod", label: "LOD", pattern: /\bLOD\b|level.of.detail/i },
  {
    slug: "streaming",
    label: "Streaming",
    pattern: /streaming|streamed|流式/i,
  },
  { slug: "slam", label: "SLAM", pattern: /SLAM|Robotics|Mapping|建图|机器人|运动规划/i },
  { slug: "avatar", label: "Avatar", pattern: /Avatar|Human|人像|人体|说话头像/i },
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
