import { OpticalSource, type OpticalBox } from "./glass-optical-source";
import { encodeMapPixels } from "../vendor/glass-hq/src/dom/map-encoding";
import { WebGL2MaterialRenderer } from "../vendor/glass-hq/src/webgl2/index";

const selector = "[data-glass-surface]";
const svgNamespace = "http://www.w3.org/2000/svg";
const maxSurfaces = 12;
const reach = 30;
const refraction = 16;
let nextFilter = 0;

function svgElement<K extends keyof SVGElementTagNameMap>(tag: K, attributes: Record<string, string | number>) {
  const element = document.createElementNS(svgNamespace, tag);
  for (const [key, value] of Object.entries(attributes)) element.setAttribute(key, String(value));
  return element;
}

function createLens(root: HTMLElement) {
  const id = `reader-glass-${++nextFilter}`;
  const strip = document.createElement("div");
  strip.className = "glass-optical-strip";
  const plane = document.createElement("div");
  plane.className = "glass-optical-plane";
  strip.append(plane);
  const svg = svgElement("svg", { width: 0, height: 0, "aria-hidden": "true" });
  const filter = svgElement("filter", { id, x: 0, y: 0, width: 1, height: 1,
    filterUnits: "objectBoundingBox", primitiveUnits: "userSpaceOnUse", "color-interpolation-filters": "sRGB" });
  const field = svgElement("feImage", { x: reach - 2, y: reach - 2, preserveAspectRatio: "none", result: "field" });
  const rim = svgElement("feImage", { x: reach - 2, y: reach - 2, preserveAspectRatio: "none", result: "rim" });
  const merge = svgElement("feMerge", {});
  merge.append(svgElement("feMergeNode", { in: "inside" }), svgElement("feMergeNode", { in: "rim" }));
  filter.append(
    field,
    svgElement("feGaussianBlur", { in: "SourceGraphic", stdDeviation: 2.2, result: "soft" }),
    svgElement("feDisplacementMap", { in: "soft", in2: "field", scale: refraction * 2, xChannelSelector: "R", yChannelSelector: "G", result: "refracted" }),
    svgElement("feComposite", { in: "refracted", in2: "field", operator: "in", result: "inside" }),
    rim, merge,
  );
  const defs = svgElement("defs", {});
  defs.append(filter);
  svg.append(defs);
  root.append(svg, strip);
  plane.style.filter = `url("#${id}")`;
  const source = new OpticalSource(plane);
  let geometry = "";
  let lastBox = "";
  let mapReady = false;
  let token = 0;

  return {
    source,
    position(box: OpticalBox) {
      const left = box.left - reach, top = box.top - reach;
      const width = box.width + reach * 2, height = box.height + reach * 2;
      const key = `${left}|${top}|${width}|${height}`;
      if (key !== lastBox) {
        lastBox = key;
        Object.assign(strip.style, { left: `${left}px`, top: `${top}px`, width: `${width}px`, height: `${height}px` });
      }
      return { left, top, width, height };
    },
    async map(box: OpticalBox, appearance: "dark" | "light", getMap: (width: number, height: number, appearance: "dark" | "light") => Promise<string[][]>) {
      const width = Math.max(1, Math.round(box.width));
      const height = Math.max(1, Math.round(box.height));
      const key = `${width}|${height}|${appearance}`;
      if (geometry === key) return mapReady;
      geometry = key;
      mapReady = false;
      const generation = ++token;
      const [[fieldUrl], [rimUrl]] = await getMap(width, height, appearance);
      if (generation !== token) return false;
      for (const [node, url] of [[field, fieldUrl], [rim, rimUrl]] as const) {
        node.setAttribute("width", String(box.width + 4));
        node.setAttribute("height", String(box.height + 4));
        node.setAttribute("href", url);
      }
      mapReady = true;
      return true;
    },
    dispose() { token++; source.clear(); svg.remove(); strip.remove(); },
  };
}

export function startGlassChrome(root: HTMLElement) {
  const lenses = new Map<HTMLElement, ReturnType<typeof createLens>>();
  const mapCache = new Map<string, Promise<string[][]>>();
  let frame = 0;
  let motionUntil = 0;
  let renderer: WebGL2MaterialRenderer | undefined;
  let disposed = false;
  let failed = false;
  let refreshSources = false;
  const report = (state: string) => { if (root.dataset.glassState !== state) root.dataset.glassState = state; };
  function fallback() {
    if (disposed || failed) return;
    failed = true;
    for (const [element, lens] of lenses) { delete element.dataset.glassReady; lens.dispose(); }
    lenses.clear();
    mapCache.clear();
    renderer?.dispose();
    report("fallback");
  }
  try { renderer = new WebGL2MaterialRenderer(fallback); } catch { fallback(); }
  const getMap = (width: number, height: number, appearance: "light" | "dark") => {
    const key = `${width}|${height}|${appearance}`;
    let result = mapCache.get(key);
    if (!result) {
      result = renderer!.render({ width, height, radius: width === height ? "circle" : "capsule", dpr: 1, appearance })
        .then(({ pixels, width: w, height: h }) => encodeMapPixels(pixels, w, h))
        .then(async maps => {
          await Promise.all(maps.map(([url]) => {
            const image = new Image();
            image.src = url;
            return image.decode();
          }));
          return maps;
        });
      if (mapCache.size >= 24) mapCache.delete(mapCache.keys().next().value!);
      mapCache.set(key, result);
    }
    return result;
  };

  const resized = new ResizeObserver(() => {
    refreshSources = true;
    schedule();
  });
  function draw(now: number) {
    frame = 0;
    if (disposed || failed || document.hidden || document.documentElement.hasAttribute("data-card-glass-hold")) return;
    const surfaces = Array.from(document.querySelectorAll<HTMLElement>(selector)).filter(element => {
      if (element.closest("[inert], [hidden], [aria-hidden=true]")) return false;
      const bounds = element.getBoundingClientRect();
      return bounds.width > 1 && bounds.height > 1 && bounds.right > 0 && bounds.left < innerWidth && bounds.bottom > 0 && bounds.top < innerHeight &&
        getComputedStyle(element).visibility === "visible";
    }).slice(0, maxSurfaces);
    for (const [element, lens] of lenses) {
      if (surfaces.includes(element)) continue;
      lens.dispose();
      resized.unobserve(element);
      delete element.dataset.glassReady;
      lenses.delete(element);
    }

    const main = document.querySelector<HTMLElement>("#main");
    const sourceBackdrop = document.querySelector<HTMLElement>(".card-transition-backdrop[data-pull-visible] .card-transition-source, .card-transition-backdrop:not([data-retained]) .card-transition-source");
    const transition = document.querySelector<HTMLElement>(".card-transition-layer:not(:empty)");
    const entering = transition?.dataset.kind === "enter" && transition.dataset.state === "waiting";
    const draggedReturn = transition?.dataset.kind === "return" && Boolean(sourceBackdrop?.closest("[data-pull-visible]"));
    const painted = [sourceBackdrop, entering || draggedReturn ? null : main, transition].filter((element): element is HTMLElement => Boolean(element));
    const theme = document.documentElement.dataset.theme;
    const appearance = theme === "light" || theme === "dark" ? theme : preference.matches ? "dark" : "light";
    let pieces = 0, textPieces = 0;
    for (const element of surfaces) {
      let lens = lenses.get(element);
      if (!lens) {
        lens = createLens(root);
        lenses.set(element, lens);
        resized.observe(element);
      }
      if (refreshSources) lens.source.clear();
      const box = element.getBoundingClientRect();
      pieces += lens.source.update(painted, lens.position(box));
      textPieces += lens.source.visibleTextCount;
      void lens.map(box, appearance, getMap).then(ready => {
        if (!ready || disposed || failed || !element.isConnected || lenses.get(element) !== lens) return;
        if (!element.hasAttribute("data-glass-ready")) element.dataset.glassReady = "";
        report("webgl2-svg");
      }).catch(error => {
        if (disposed || failed) return;
        if (/context lost|renderer disposed|framebuffer incomplete|readback|shader|program/i.test(String(error))) fallback();
        else report("optics-error");
      });
    }
    const pieceCount = String(pieces);
    if (root.dataset.glassPieces !== pieceCount) root.dataset.glassPieces = pieceCount;
    if (root.dataset.glassTextPieces !== String(textPieces)) root.dataset.glassTextPieces = String(textPieces);
    refreshSources = false;
    if (now < motionUntil) schedule();
  }

  function schedule() {
    if (!disposed && !failed && !frame) frame = requestAnimationFrame(draw);
  }
  const motion = () => { motionUntil = performance.now() + 220; schedule(); };
  const repaint = (event: Event) => {
    if (event.target instanceof Node && root.contains(event.target)) return;
    refreshSources = true;
    motion();
  };
  const observer = new MutationObserver(records => {
    for (const record of records) {
      const target = record.target instanceof Element ? record.target : record.target.parentElement;
      if (!target || root.contains(target) || record.attributeName === "data-glass-ready") continue;
      if (record.type !== "attributes" || !["style", "data-card-pulling"].includes(record.attributeName ?? "")) refreshSources = true;
      if (target === document.documentElement || target === document.body) refreshSources = true;
      schedule();
    }
  });
  observer.observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true,
    attributeFilter: ["class", "style", "hidden", "aria-hidden", "data-card-pulling", "data-pull-visible", "data-retained", "src", "data-glass-surface"] });
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme", "data-card-glass-hold", "class", "style"] });
  const viewport = window.visualViewport;
  const preference = matchMedia("(prefers-color-scheme: dark)");
  window.addEventListener("scroll", schedule, { passive: true });
  window.addEventListener("resize", motion, { passive: true });
  viewport?.addEventListener("resize", motion);
  document.addEventListener("visibilitychange", schedule);
  document.addEventListener("transitionrun", motion);
  document.addEventListener("animationstart", motion);
  document.addEventListener("load", repaint, true);
  document.fonts?.addEventListener("loadingdone", repaint);
  preference.addEventListener("change", motion);
  schedule();

  return () => {
    disposed = true;
    cancelAnimationFrame(frame);
    observer.disconnect();
    resized.disconnect();
    window.removeEventListener("scroll", schedule);
    window.removeEventListener("resize", motion);
    viewport?.removeEventListener("resize", motion);
    document.removeEventListener("visibilitychange", schedule);
    document.removeEventListener("transitionrun", motion);
    document.removeEventListener("animationstart", motion);
    document.removeEventListener("load", repaint, true);
    document.fonts?.removeEventListener("loadingdone", repaint);
    preference.removeEventListener("change", motion);
    for (const [element, lens] of lenses) { delete element.dataset.glassReady; lens.dispose(); }
    renderer?.dispose();
    mapCache.clear();
  };
}
