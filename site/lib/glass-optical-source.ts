export type OpticalBox = { left: number; top: number; width: number; height: number };

const excluded = "script, style, link, svg, iframe, object, embed, canvas, audio, video, dialog, [data-glass-surface], [data-glass-optics], [data-no-optical-source]";
const typeStyles = ["font", "font-kerning", "font-variant", "font-feature-settings", "font-optical-sizing", "letter-spacing", "line-height", "text-align", "text-decoration", "text-indent", "text-transform", "text-wrap", "white-space", "word-break", "overflow-wrap", "direction", "color"];
const boxStyles = ["background-color", "background-image", "background-size", "background-position", "background-repeat", "border-radius", "border", "padding", "object-fit", "object-position", "overflow", "opacity", "box-sizing"];
const leaf = "p, h1, h2, h3, h4, h5, h6, pre, figcaption, dt, dd, blockquote, td, th, li";
const maxPieces = 96;

export function intersectsOpticalBox(a: OpticalBox, b: OpticalBox) {
  return a.width > 0 && a.height > 0 && a.left < b.left + b.width && a.left + a.width > b.left &&
    a.top < b.top + b.height && a.top + a.height > b.top;
}

function copyStyles(source: CSSStyleDeclaration, target: HTMLElement, properties: readonly string[]) {
  for (const property of properties) target.style.setProperty(property, source.getPropertyValue(property));
}

function inlineCopy(source: Node): Node | null {
  if (source.nodeType === Node.TEXT_NODE) return source.cloneNode();
  if (!(source instanceof HTMLElement) || source.matches(excluded)) return null;
  if (source instanceof HTMLImageElement) {
    const image = document.createElement("img");
    image.alt = "";
    image.src = source.currentSrc || source.src;
    copyStyles(getComputedStyle(source), image, [...typeStyles, ...boxStyles, "width", "height", "vertical-align"]);
    return image;
  }
  const tag = ["BR", "WBR"].includes(source.tagName) ? source.tagName : "span";
  const copy = document.createElement(tag);
  copyStyles(getComputedStyle(source), copy, [...typeStyles, "display", "vertical-align"]);
  for (const child of source.childNodes) {
    const clone = inlineCopy(child);
    if (clone) copy.append(clone);
  }
  return copy;
}

type Piece = { node: HTMLElement; width: number; height: number; backgroundOnly: boolean };

/** Uses real HTML layout for the visible source pieces. The replica contains
 * no original attributes, links, handlers, or interactive elements. */
export class OpticalSource {
  private pieces = new Map<HTMLElement, Piece>();
  private displayed: HTMLElement[] = [];
  private textCount = 0;

  get visibleTextCount() { return this.textCount; }

  clear() {
    this.pieces.clear();
    this.displayed = [];
    this.textCount = 0;
    this.layer.replaceChildren();
  }

  constructor(private layer: HTMLElement) {}

  update(roots: HTMLElement[], region: OpticalBox) {
    const visible: HTMLElement[] = [];
    let textCount = 0;
    const active = new Set<HTMLElement>();
    const add = (source: HTMLElement, rect: DOMRect, style: CSSStyleDeclaration, backgroundOnly: boolean) => {
      const borderBox = style.boxSizing === "border-box";
      const px = (name: string) => parseFloat(style.getPropertyValue(name)) || 0;
      const width = px("width") + (borderBox ? 0 : px("padding-left") + px("padding-right") + px("border-left-width") + px("border-right-width")) || source.offsetWidth || rect.width;
      const height = px("height") + (borderBox ? 0 : px("padding-top") + px("padding-bottom") + px("border-top-width") + px("border-bottom-width")) || source.offsetHeight || rect.height;
      const scale = width ? rect.width / width : 1;
      let entry = this.pieces.get(source);
      if (!entry || entry.width !== width || entry.height !== height || entry.backgroundOnly !== backgroundOnly) {
        const node = document.createElement(source instanceof HTMLImageElement ? "img" : "div");
        copyStyles(style, node, [...typeStyles, ...boxStyles]);
        if (node instanceof HTMLImageElement && source instanceof HTMLImageElement) {
          node.alt = "";
          node.src = source.currentSrc || source.src;
        } else if (!backgroundOnly) {
          for (const child of source.childNodes) {
            const clone = inlineCopy(child);
            if (clone) node.append(clone);
          }
        }
        Object.assign(node.style, { position: "absolute", boxSizing: "border-box", width: `${width}px`, height: `${height}px`, transformOrigin: "0 0" });
        entry = { node, width, height, backgroundOnly };
        this.pieces.set(source, entry);
      }
      const transform = `translate(${rect.left - region.left}px, ${rect.top - region.top}px) scale(${scale}, ${height ? rect.height / height : 1})`;
      if (entry.node.style.transform !== transform) entry.node.style.transform = transform;
      if (entry.node.style.opacity !== style.opacity) entry.node.style.opacity = style.opacity;
      visible.push(entry.node);
      if (!backgroundOnly && entry.node.textContent?.trim()) textCount++;
      active.add(source);
    };
    const visit = (node: HTMLElement) => {
      if (visible.length >= maxPieces || node.matches(excluded)) return;
      const rect = node.getBoundingClientRect();
      if (!intersectsOpticalBox(rect, region)) {
        // A display:contents wrapper owns no box.
        if (!rect.width && !rect.height && getComputedStyle(node).display === "contents")
          for (const child of node.children) if (child instanceof HTMLElement) visit(child);
        return;
      }
      const style = getComputedStyle(node);
      if (style.visibility !== "visible" || Number(style.opacity) <= .01) return;
      const text = Array.from(node.childNodes).some(child => child.nodeType === Node.TEXT_NODE && child.textContent?.trim());
      const hasBlockChildren = node.querySelector(":scope > p, :scope > li, :scope > ul, :scope > ol, :scope > div");
      const isLeaf = node instanceof HTMLImageElement || ((node.matches(leaf) || text) && !hasBlockChildren);
      if (isLeaf || style.backgroundColor !== "rgba(0, 0, 0, 0)" || style.backgroundImage !== "none") add(node, rect, style, !isLeaf);
      if (!isLeaf) for (const child of node.children) if (child instanceof HTMLElement) visit(child);
    };
    for (const root of roots) visit(root);
    for (const node of this.pieces.keys()) if (!active.has(node)) this.pieces.delete(node);
    if (visible.length !== this.displayed.length || visible.some((node, index) => node !== this.displayed[index])) {
      this.layer.replaceChildren(...visible);
      this.displayed = visible;
    }
    this.textCount = textCount;
    return visible.length;
  }
}
