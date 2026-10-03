import type { EventTags } from "./types";
export type TagDimension = keyof EventTags;
export interface Tag { id: string; name: string; aliases?: string[]; parent?: string; url?: string; topic?: string }
export const TAXONOMY: Record<TagDimension, Tag[]> = {
  techniques: [
    {id:"3dgs",name:"3DGS",topic:"3dgs"},{id:"dynamic",name:"动态高斯",aliases:["4DGS","Dynamic Gaussian"],parent:"3dgs",topic:"4dgs"},
    {id:"capture",name:"采集"},{id:"sfm",name:"SfM",parent:"capture"},{id:"training",name:"训练"},{id:"partition",name:"分区训练",parent:"training"},
    {id:"editing",name:"编辑"},{id:"rendering",name:"渲染"},{id:"webgpu",name:"WebGPU",parent:"rendering",topic:"webgpu"},{id:"compression",name:"压缩"},
    {id:"formats",name:"格式",topic:"formats"},{id:"format-lcc",name:".lcc 文件格式",parent:"formats"},{id:"lod",name:"LOD",parent:"rendering",topic:"lod"},
    {id:"streaming",name:"流式加载",parent:"rendering",topic:"streaming"},{id:"slam",name:"SLAM",topic:"slam"},{id:"xr",name:"XR"},{id:"avatar",name:"Avatar",topic:"avatar"},
    {id:"generative",name:"生成式三维"},{id:"relighting",name:"重光照",parent:"rendering"},{id:"robotics",name:"机器人"},
  ],
  projects: [
    {id:"ooosplat",name:"OOOSplat",url:"https://github.com/ooolabdev/ooosplat"},
    {id:"spirula",name:"Spirula Studio",aliases:["Spirula"],url:"https://github.com/harry7557558/spirula-studio"},
    {id:"lichtfeld",name:"LichtFeld Studio",aliases:["LichtFeld"],url:"https://lichtfeld.io/"},
    {id:"playcanvas",name:"PlayCanvas",url:"https://playcanvas.com/"},
    {id:"playcanvas-engine",name:"PlayCanvas Engine",parent:"playcanvas",url:"https://github.com/playcanvas/engine"},
    {id:"playcanvas-editor",name:"PlayCanvas Editor",parent:"playcanvas",url:"https://playcanvas.com/editor"},
    {id:"supersplat-editor",name:"SuperSplat Editor",aliases:["SuperSplat"],parent:"playcanvas",url:"https://github.com/playcanvas/supersplat"},
    {id:"supersplat-viewer",name:"SuperSplat Viewer",parent:"playcanvas",url:"https://github.com/playcanvas/supersplat-viewer"},
    {id:"splattransform",name:"SplatTransform",aliases:["splat-transform"],parent:"playcanvas",url:"https://github.com/playcanvas/splat-transform"},
    {id:"lcc",name:"Lixel CyberColor",aliases:["LCC","XGRIDS LCC"],url:"https://docs.xgrids.com/en-us/06-lixel-cybercolor/"},
    {id:"lcc-studio",name:"LCC Studio",parent:"lcc",url:"https://www.xgrids.com/lcc/"},
    {id:"lcc-scene-editor",name:"LCC Scene Editor",parent:"lcc"},{id:"lcc-model-editor",name:"LCC Model Editor",parent:"lcc"},
    {id:"blender",name:"Blender",url:"https://www.blender.org/"},{id:"gsplat",name:"gsplat",url:"https://github.com/nerfstudio-project/gsplat"},
    {id:"gslite",name:"Gaussian-Splat-Lite",aliases:["GSLite"],url:"https://github.com/WilliamLiu-1997/Gaussian-Splat-Lite"},
    {id:"mobile-4dgs",name:"Mobile-4DGS",url:"https://github.com/xiaobiaodu/Mobile-4DGS"},
    {id:"babylonjs",name:"Babylon.js",url:"https://www.babylonjs.com/"},{id:"threejs",name:"Three.js",url:"https://threejs.org/"},
    {id:"fvdb",name:"fVDB",url:"https://github.com/openvdb/fvdb-core"},
    {id:"precisionreach",name:"PrecisionReach-GS",url:"https://github.com/001-Wang/PrecisionReach-GS"},
    {id:"arcturus",name:"Arcturus Vision",url:"https://arcturus.vision/ja/apps"},
    {id:"niantic-spatial",name:"Niantic Spatial",url:"https://www.nianticspatial.com/"},
    {id:"scaniverse",name:"Scaniverse",parent:"niantic-spatial",url:"https://scaniverse.com/"},
    {id:"iags",name:"IA’GS",aliases:["IA-GS"],url:"https://github.com/by-lastime/IA-GS"},
    {id:"comfyui-meridian",name:"ComfyUI Meridian",aliases:["ComfyUI-Meridian"],url:"https://github.com/Enndee/ComfyUI_Meridian_for_Gaussian_Splatting"},
  ],
  content: [{id:"paper",name:"论文"},{id:"release",name:"版本发布"},{id:"code",name:"代码更新"},{id:"standard",name:"标准"},{id:"hardware",name:"硬件"},{id:"case",name:"应用案例"},{id:"analysis",name:"分析与实践"}],
  sources: [{id:"official",name:"官方"},{id:"community",name:"社区"},{id:"unresolved",name:"来源待复核"}],
};
export function normalizeTag(dimension: TagDimension, value: string) {
  return TAXONOMY[dimension].find(t => [t.id,t.name,...t.aliases || []].some(alias => alias.toLowerCase() === value.toLowerCase()))?.id;
}
export function validateTags(tags: EventTags, file = "taxonomy") {
  for (const dimension of Object.keys(TAXONOMY) as TagDimension[]) {
    if (!Array.isArray(tags?.[dimension]) || new Set(tags[dimension]).size !== tags[dimension].length || tags[dimension].some(id => !TAXONOMY[dimension].some(t => t.id === id))) throw Error(`${file}: invalid ${dimension} tags`);
  }
  if (!tags.techniques.length || !tags.content.length || !tags.sources.length) throw Error(`${file}: missing tag dimensions`);
}

export function normalizeTags(tags: EventTags): EventTags {
  return Object.fromEntries((Object.keys(TAXONOMY) as TagDimension[]).map(dimension=>[dimension,[...new Set((tags[dimension] || []).map(value=>normalizeTag(dimension,value) || value))]])) as unknown as EventTags;
}
