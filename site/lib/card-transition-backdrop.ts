const MAX_SNAPSHOT_NODES = 1600;
const FLOATING_CONTENT = ".home-feed-nav, .home-sidebar, .catalogue-aside, .reading-navigator, .article-interaction-wrap";
// Freeze the layout/paint values used by the page, rather than serializing hundreds
// of unrelated computed defaults for every visible node on the click's critical path.
const FROZEN_STYLE = [
  "display", "position", "top", "right", "bottom", "left", "z-index", "box-sizing", "width", "height",
  "min-width", "max-width", "min-height", "max-height", "margin", "padding", "border", "border-radius",
  "box-shadow", "background", "color", "opacity", "visibility", "overflow", "clip-path", "transform",
  "transform-origin", "translate", "scale", "rotate", "filter", "backdrop-filter", "isolation", "contain",
  "font-family", "font-size", "font-style", "font-weight", "line-height", "letter-spacing", "word-spacing",
  "text-align", "text-transform", "text-decoration", "text-indent", "text-overflow", "text-wrap", "white-space",
  "word-break", "overflow-wrap", "-webkit-line-clamp", "-webkit-box-orient", "vertical-align", "list-style",
  "flex", "flex-direction", "flex-wrap", "align-items", "align-self", "align-content", "justify-content",
  "justify-items", "justify-self", "gap", "order", "grid-template-columns", "grid-template-rows",
  "grid-auto-columns", "grid-auto-rows", "grid-auto-flow", "grid-column", "grid-row", "object-fit",
  "object-position", "aspect-ratio", "appearance", "fill", "stroke",
];

/** A disposable, inert copy of the source viewport, never a second mounted React page. */
export class CardBackdrop {
  constructor(private layer: HTMLElement) {}

  clear() {
    this.layer.replaceChildren();
    this.layer.style.removeProperty("background");
    delete this.layer.dataset.nodes;
  }

  capture(origin?: HTMLElement) {
    this.clear();
    const roots = [...document.querySelectorAll<HTMLElement>("body > main, body > .site-footer")];
    if (!roots.length) return false;
    let count = 0;
    const floatingAncestors = new Set<Element>();
    const sticky: { source: DOMRect; copy: HTMLElement }[] = [];
    for (const root of roots) {
      for (const element of root.querySelectorAll(FLOATING_CONTENT)) {
        let parent: Element | null = element;
        while (parent && parent !== root) { floatingAncestors.add(parent); parent = parent.parentElement; }
      }
    }
    const freeze = (source: Element): Element | null => {
      if (["SCRIPT", "STYLE", "LINK", "IFRAME", "OBJECT", "EMBED", "DIALOG"].includes(source.tagName)) return null;
      if (++count > MAX_SNAPSHOT_NODES) throw new Error("Source viewport exceeds the snapshot budget");
      const bounds = source.getBoundingClientRect(), style = getComputedStyle(source);
      const outside = bounds.width > 0 && bounds.height > 0 && (bounds.bottom < 0 || bounds.top > innerHeight || bounds.right < 0 || bounds.left > innerWidth);
      const pruned = style.display === "none" || style.visibility === "hidden" || style.opacity === "0" || source === origin || (outside && !floatingAncestors.has(source));
      const copy = source.cloneNode(source instanceof SVGElement && !pruned) as HTMLElement;
      for (const node of [copy, ...copy.querySelectorAll("*")]) {
        for (const attribute of [...node.attributes]) {
          if (/^(id|name|href|tabindex|autofocus|form|on.*|data-.*|aria-.*)$/.test(attribute.name)) node.removeAttribute(attribute.name);
        }
      }
      // Computed values freeze hover, theme, grid sizing, and selectors whose ancestor
      // will disappear on navigation. Offscreen subtrees keep only a sized placeholder.
      copy.style.cssText = FROZEN_STYLE.map(property => `${property}:${style.getPropertyValue(property)};`).join("");
      copy.style.animation = "none"; copy.style.transition = "none";
      if (pruned) {
        copy.style.visibility = "hidden";
        copy.style.width = `${bounds.width}px`; copy.style.height = `${bounds.height}px`;
        copy.style.boxSizing = "border-box";
        copy.removeAttribute("src"); copy.removeAttribute("srcset");
        return copy;
      }
      if (source instanceof HTMLImageElement) {
        copy.removeAttribute("srcset"); copy.removeAttribute("sizes");
        copy.setAttribute("src", source.currentSrc || source.src);
        copy.setAttribute("loading", "eager"); copy.setAttribute("alt", "");
      } else if (!(source instanceof SVGElement)) {
        for (const child of source.childNodes) {
          if (child instanceof Element) { const frozen = freeze(child); if (frozen) copy.append(frozen); }
          else if (child.nodeType === Node.TEXT_NODE) copy.append(child.cloneNode());
        }
      }
      if (source instanceof HTMLInputElement) (copy as HTMLInputElement).value = source.value;
      if (source instanceof HTMLSelectElement) (copy as HTMLSelectElement).value = source.value;
      if (style.position === "sticky") {
        Object.assign(copy.style, { position: "relative", inset: "auto" });
        sticky.push({ source: bounds, copy });
      }
      return copy;
    };
    try {
      this.layer.style.background = getComputedStyle(document.body).backgroundColor;
      const page = document.createElement("div");
      page.className = "card-transition-source";
      this.layer.append(page);
      for (const root of roots) {
        const bounds = root.getBoundingClientRect(), copy = freeze(root) as HTMLElement | null;
        if (!copy) continue;
        Object.assign(copy.style, { position: "absolute", margin: "0", top: `${bounds.top}px`, left: `${bounds.left}px`,
          width: `${bounds.width}px`, height: `${bounds.height}px`, boxSizing: "border-box" });
        page.append(copy);
      }
      // Freeze sticky controls at their actual viewport positions, rather than running
      // sticky layout against the new document's scroll position. Parents go first.
      for (const { source, copy } of sticky.reverse()) {
        const bounds = copy.getBoundingClientRect();
        copy.style.translate = `${source.x - bounds.x}px ${source.y - bounds.y}px`;
      }
      this.layer.dataset.nodes = String(count);
      return true;
    } catch {
      this.clear(); return false;
    }
  }
}
