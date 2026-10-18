import { animate, mix as mixValue } from "motion";

type Rect = { x: number; y: number; width: number; height: number };
type TextPart = { rect: Rect; node: HTMLElement; fontSize: number; lineHeight: number; letterSpacing: number; weight: number; lineLimit: number; extraLineOpacity: number };
type Picture = { rect: Rect; src: string; key: string; width: number; height: number; fit: string; position: string; radii: number[] };
type CardSurface = { radius: number; shadow: string; border: string };
export type CardVisual = { rect: Rect; surface?: CardSurface; expansion: number; elevation: number; background: string; title: TextPart; image: Picture; date?: TextPart; summary?: TextPart; fullscreen?: boolean };
export const CARD_TIMING = { enter: 800, return: 550 } as const;
const springs = {
  enter: { stiffness: 180, damping: 24, mass: 1.1 },
  return: { stiffness: 300, damping: 30, mass: 1 },
  press: { stiffness: 400, damping: 32, mass: 1 },
};
const rect = (element: Element): Rect => {
  const value = element.getBoundingClientRect();
  return { x: value.x, y: value.y, width: value.width, height: value.height };
};
const properties = ["font-family", "font-size", "font-weight", "font-style", "line-height", "letter-spacing", "color", "text-align", "text-transform", "white-space", "text-wrap", "display", "padding", "border", "border-radius", "background-color", "box-shadow", "overflow", "text-overflow", "-webkit-line-clamp", "-webkit-box-orient"];

function textPart(element: HTMLElement): TextPart {
  const node = element.cloneNode(true) as HTMLElement;
  const originals = [element, ...element.querySelectorAll<HTMLElement>("*")];
  const copies = [node, ...node.querySelectorAll<HTMLElement>("*")];
  originals.forEach((original, index) => {
    const copy = copies[index], style = getComputedStyle(original);
    copy.removeAttribute("id"); copy.removeAttribute("href"); copy.removeAttribute("tabindex");
    properties.forEach(property => copy.style.setProperty(property, style.getPropertyValue(property)));
  });
  const style = getComputedStyle(element), fontSize = parseFloat(style.fontSize), lineLimit = parseInt(style.webkitLineClamp) || 0;
  return { node, rect: rect(element), fontSize, lineHeight: parseFloat(style.lineHeight) || fontSize * 1.5,
    letterSpacing: parseFloat(style.letterSpacing) || 0, weight: parseFloat(style.fontWeight) || 400,
    lineLimit, extraLineOpacity: lineLimit ? 0 : 1 };
}

export function visualElements(root: HTMLElement, article = false): HTMLElement[] {
  return [...root.querySelectorAll<HTMLElement>(article
    ? ".article-cover > .source-image > img, .article-header h1, .article-date, .article-deck"
    : "[data-card-image], h1, h2, h3, .home-slide-date, .daily-card-date, .past-date, .excerpt, .search-result-summary")];
}

export function captureCard(root: HTMLElement, article = false, fallback?: CardVisual | null): CardVisual | null {
  const image = root.querySelector<HTMLImageElement>(article ? ".article-cover > .source-image > img" : "[data-card-image]");
  const title = root.querySelector<HTMLElement>(article ? ".article-header h1" : "h1, h2, h3");
  if (!image || !title) return null;
  const key = image.dataset.cardImage || image.src;
  // A decoded list thumbnail is already sufficient to start the shared-image transition.
  // A known failed image still uses the ordinary short fade.
  const loaded = image.complete && image.naturalWidth > 0;
  const thumbnail = !image.complete && fallback?.image.key === key ? fallback.image : null;
  if (!loaded && !thumbnail) return null;
  const imageRect = rect(image), titleRect = rect(title);
  if (!imageRect.width || !imageRect.height || imageRect.y + imageRect.height <= 56 || imageRect.y >= innerHeight) return null;
  const surfaceRect = article ? { x: 0, y: 0, width: innerWidth, height: innerHeight } : rect(root);
  if (!Number.isFinite(surfaceRect.height) || !titleRect.width) return null;
  const style = getComputedStyle(root), imageStyle = getComputedStyle(image);
  const imageMask = getComputedStyle(image.closest("figure") || image);
  const radii = [imageMask.borderTopLeftRadius, imageMask.borderTopRightRadius, imageMask.borderBottomRightRadius, imageMask.borderBottomLeftRadius].map(value => parseFloat(value) || 0);
  const background = article || style.backgroundColor === "rgba(0, 0, 0, 0)" ? getComputedStyle(document.body).backgroundColor : style.backgroundColor;
  const date = root.querySelector<HTMLElement>(article ? ".article-date" : ".home-slide-date, .daily-card-date, .past-date");
  const summary = root.querySelector<HTMLElement>(article ? ".article-deck" : ".excerpt, .search-result-summary");
  return { rect: surfaceRect, ...(article ? {} : { surface: { radius: parseFloat(style.borderRadius) || 0, shadow: style.boxShadow, border: style.border } }),
    expansion: article ? 1 : 0, elevation: 0, background, title: textPart(title), fullscreen: article,
    image: { rect: imageRect, src: thumbnail?.src || image.currentSrc || image.src, key,
      width: thumbnail?.width || image.naturalWidth, height: thumbnail?.height || image.naturalHeight, fit: imageStyle.objectFit, position: imageStyle.objectPosition, radii },
    ...(date ? { date: textPart(date) } : {}), ...(summary ? { summary: textPart(summary) } : {}) };
}

/** Keep the decoded thumbnail on the real image until its larger source has loaded. */
export function retainThumbnail(root: HTMLElement, from: CardVisual) {
  const image = root.querySelector<HTMLImageElement>(`img[data-card-image="${CSS.escape(from.image.key)}"]`);
  if (!image || image.complete) return;
  const previous = image.style.background;
  image.style.background = `url(${JSON.stringify(from.image.src)}) ${getComputedStyle(image).objectPosition} / ${getComputedStyle(image).objectFit === "contain" ? "contain" : "cover"} no-repeat`;
  const clear = () => {
    image.style.background = previous;
    image.removeEventListener("load", clear); image.removeEventListener("error", clear);
  };
  image.addEventListener("load", clear, { once: true }); image.addEventListener("error", clear, { once: true });
}

const mix = (a: number, b: number, t: number) => a + (b - a) * t;
const clamp = (value: number) => Math.max(0, Math.min(1, value));
const smooth = (value: number) => { const t = clamp(value); return t * t * (3 - 2 * t); };
// Keep the card's physical corner size until it is almost a page. The same
// expansion coordinate survives interruptions, so reversing cannot square it off.
const roundness = (expansion: number) => 1 - smooth((expansion - .72) / .28);
const mixRect = (a: Rect, b: Rect, t: number): Rect => ({ x: mix(a.x, b.x, t), y: mix(a.y, b.y, t), width: mix(a.width, b.width, t), height: mix(a.height, b.height, t) });

/** Only the shared first-screen fields are copied. The real long article retains its layout. */
export class CardAnimator {
  private stopAnimation?: () => void;
  private hidden = new Map<HTMLElement, string>();
  private reveal?: { element: HTMLElement; clip: string; opacity: string };
  private visual: CardVisual | null = null;
  private underlay?: HTMLElement;
  constructor(private layer: HTMLElement, private backdrop: HTMLElement | null = null) {}
  current() { return this.visual; }
  hide(elements: HTMLElement[]) {
    for (const element of elements) {
      if (!this.hidden.has(element)) this.hidden.set(element, element.style.visibility);
      element.style.visibility = "hidden";
    }
  }
  clear() {
    this.stopAnimation?.(); this.stopAnimation = undefined;
    this.underlay?.remove(); this.underlay = undefined;
    this.hidden.forEach((value, element) => { element.style.visibility = value; }); this.hidden.clear();
    if (this.reveal) {
      this.reveal.element.style.clipPath = this.reveal.clip; this.reveal.element.style.opacity = this.reveal.opacity; this.reveal = undefined;
    }
    this.layer.replaceChildren(); this.visual = null;
  }
  preview(from: CardVisual) {
    // A small lift responds while the route loads, then the same geometry continues to expand.
    const lift = (box: Rect): Rect => ({ x: from.rect.x + (box.x - from.rect.x) * 1.02 - from.rect.width * .01,
      y: from.rect.y + (box.y - from.rect.y) * 1.02 - from.rect.height * .01, width: box.width * 1.02, height: box.height * 1.02 });
    const lifted = { ...from, elevation: .3, rect: lift(from.rect), title: { ...from.title, rect: lift(from.title.rect) }, image: { ...from.image, rect: lift(from.image.rect) },
      ...(from.date ? { date: { ...from.date, rect: lift(from.date.rect) } } : {}), ...(from.summary ? { summary: { ...from.summary, rect: lift(from.summary.rect) } } : {}) };
    this.render(from, lifted, "press", () => {});
  }
  morph(from: CardVisual, to: CardVisual, kind: "enter" | "return", done: () => void) {
    if (to.fullscreen) {
      const element = document.querySelector<HTMLElement>("main");
      if (element) this.reveal = { element, clip: element.style.clipPath, opacity: element.style.opacity };
      if (this.backdrop) {
        this.underlay = document.createElement("div");
        this.underlay.className = "card-transition-underlay";
        this.underlay.style.background = to.background;
        this.backdrop.append(this.underlay);
      }
    }
    this.render(from, to, kind, done);
  }
  private render(from: CardVisual, to: CardVisual, kind: keyof typeof springs, done: () => void) {
    this.stopAnimation?.(); this.layer.replaceChildren();
    const sheet = document.createElement("div"), surface = document.createElement("div"), frame = document.createElement("div"), image = document.createElement("img");
    const restingShadow = document.createElement("div"), liftedShadow = document.createElement("div");
    restingShadow.className = "card-transition-shadow"; liftedShadow.className = "card-transition-shadow card-transition-lift";
    const sourceSurface = from.surface || to.surface || { radius: 0, shadow: "none", border: "none" }, targetSurface = to.surface || sourceSurface;
    Object.assign(restingShadow.style, { boxShadow: sourceSurface.shadow, border: sourceSurface.border });
    sheet.className = "card-transition-sheet"; surface.className = "card-transition-surface"; frame.className = "card-transition-image";
    image.src = from.image.src; image.alt = ""; image.draggable = false;
    Object.assign(image.style, { position: "absolute", width: `${from.image.width}px`, height: `${from.image.height}px`, maxWidth: "none", transformOrigin: "0 0" });
    // Shadows sit outside the clipped sheet, otherwise clip-path cuts them off.
    frame.append(image); sheet.append(surface, frame); this.layer.append(restingShadow, liftedShadow, sheet);
    const surfaceWidth = Math.max(from.rect.width, to.rect.width) * 1.15, surfaceHeight = Math.max(from.rect.height, to.rect.height) * 1.15;
    const imageWidth = Math.max(from.image.rect.width, to.image.rect.width) * 1.15, imageHeight = Math.max(from.image.rect.height, to.image.rect.height) * 1.15;
    Object.assign(sheet.style, { width: `${surfaceWidth}px`, height: `${surfaceHeight}px` });
    Object.assign(surface.style, { width: "100%", height: "100%", background: to.background });
    Object.assign(frame.style, { width: `${imageWidth}px`, height: `${imageHeight}px` });
    const addText = (part: TextPart) => {
      const element = part.node.cloneNode(true) as HTMLElement;
      Object.assign(element.style, { position: "absolute", left: "0", top: "0", width: `${part.rect.width}px`, height: `${part.rect.height}px`, margin: "0", pointerEvents: "none", transformOrigin: "0 0" });
      return element;
    };
    const texts = (["title", "summary", "date"] as const).map(name => {
      const a = from[name], b = to[name];
      if (!a && !b) return null;
      const wrapper = document.createElement("div"); wrapper.className = `card-transition-text card-transition-${name}`;
      const part = b || a!, content = addText(part);
      const badgeStyles = name === "date" && a && b ? [content, ...content.children].flatMap((element, index) => {
        const source = [a.node, ...a.node.children][index] as HTMLElement | undefined;
        const target = [b.node, ...b.node.children][index] as HTMLElement | undefined;
        if (!source || !target) return [];
        return ["font-size", "line-height", "letter-spacing", "border-radius", "border-top-width", "border-right-width", "border-bottom-width", "border-left-width", "border-color", "padding-top", "padding-bottom", "color", "background-color", "box-shadow"].flatMap(property => {
          const start = source.style.getPropertyValue(property), end = target.style.getPropertyValue(property);
          return start && end && start !== end ? [{ element: element as HTMLElement, property, value: mixValue(start, end) }] : [];
        });
      }) : [];
      if (name !== "date") {
        // The same headline/deck gets one continuously laid-out proxy: never two readable
        // copies with different line breaks. Only these short strings reflow, not the article.
        content.textContent = part.node.textContent;
        Object.assign(content.style, { display: "block", height: "auto", overflow: "visible", webkitLineClamp: "unset" });
      }
      wrapper.append(content); sheet.append(wrapper);
      return { name, a, b, content, wrapper, badgeStyles };
    });
    const position = (element: HTMLElement, box: Rect, origin = { x: 0, y: 0 }) => { element.style.transform = `translate3d(${box.x - origin.x}px,${box.y - origin.y}px,0)`; };
    const started = performance.now(), mainRect = this.reveal ? rect(this.reveal.element) : null;
    const update = (progress: number) => {
      const elapsed = (performance.now() - started) / 1000, t = clamp(progress);
      const box = mixRect(from.rect, to.rect, progress), picture = mixRect(from.image.rect, to.image.rect, progress);
      const expansion = mix(from.expansion, to.expansion, t), cardRadius = mix(sourceSurface.radius, targetSurface.radius, t);
      const radius = cardRadius * roundness(expansion);
      const baseElevation = mix(from.elevation, to.elevation, t);
      const elevation = kind === "press" ? baseElevation : baseElevation + (1 - baseElevation) * 4 * t * (1 - t);
      for (const shadow of [restingShadow, liftedShadow]) {
        position(shadow, box);
        Object.assign(shadow.style, { width: `${box.width}px`, height: `${box.height}px`, borderRadius: `${radius}px` });
      }
      restingShadow.style.opacity = String(1 - expansion); liftedShadow.style.opacity = String(elevation);
      position(sheet, box); sheet.style.clipPath = `inset(0 ${Math.max(0, surfaceWidth - box.width)}px ${Math.max(0, surfaceHeight - box.height)}px 0 round ${radius}px)`;
      sheet.dataset.progress = progress.toFixed(4);
      // A continuous opaque sheet also covers the article's collapsed top margin,
      // which the real main background does not paint.
      if (this.underlay) this.underlay.style.clipPath = `inset(${box.y}px calc(100% - ${box.x + box.width}px) calc(100% - ${box.y + box.height}px) ${box.x}px round ${radius}px)`;
      surface.style.opacity = String(kind === "enter" ? 1 - smooth((elapsed - .2) / .24) : 1);
      if (this.reveal && mainRect) {
        // The final body appears inside the expanding sheet, without scaling or reflowing it.
        this.reveal.element.style.clipPath = `inset(${box.y - mainRect.y}px calc(100% - ${box.x + box.width - mainRect.x}px) calc(100% - ${box.y + box.height - mainRect.y}px) ${box.x - mainRect.x}px round ${radius}px)`;
        // Keep the real page opaque beneath the fading proxy surface so the retained
        // source cannot bleed through the inside of the expanding card.
        this.reveal.element.style.opacity = "1";
      }
      const startRoundness = roundness(from.expansion), endRoundness = roundness(to.expansion);
      const cornerProgress = startRoundness === endRoundness ? t : clamp((roundness(expansion) - startRoundness) / (endRoundness - startRoundness));
      const imageRadii = from.image.radii.map((value, i) => Math.max(0, mix(value, to.image.radii[i], cornerProgress)));
      position(frame, picture, box); frame.style.clipPath = `inset(0 ${Math.max(0, imageWidth - picture.width)}px ${Math.max(0, imageHeight - picture.height)}px 0 round ${imageRadii.map(value => `${value}px`).join(" ")})`;
      const fitScale = (fit: string) => (fit === "contain" ? Math.min : Math.max)(picture.width / from.image.width, picture.height / from.image.height);
      const scale = mix(fitScale(from.image.fit), fitScale(to.image.fit), t);
      const offsets = (part: Picture) => part.position.split(" ").map(value => value.endsWith("%") ? parseFloat(value) / 100 : .5);
      const a = offsets(from.image), b = offsets(to.image);
      const x = (picture.width - from.image.width * scale) * mix(a[0], b[0], t), y = (picture.height - from.image.height * scale) * mix(a[1] ?? .5, b[1] ?? .5, t);
      image.style.transform = `translate3d(${x}px,${y}px,0) scale(${scale})`;
      const current = { ...to, rect: box,
        // A fullscreen press has no source-card styling yet; keep it unknown until
        // the restored card is measured, instead of turning it into a square card.
        surface: from.surface || to.surface ? { ...sourceSurface, radius: cardRadius } : undefined,
        expansion, elevation, image: { ...from.image, rect: picture, radii: imageRadii } };
      let titleReflow = 0;
      for (const text of texts) {
        if (!text) continue;
        const { a, b, content, wrapper, name } = text;
        const anchor = a && b ? mixRect(a.rect, b.rect, progress) : { ...(a || b)!.rect };
        if (name === "summary") anchor.y += titleReflow;
        const fontSize = a && b ? mix(a.fontSize, b.fontSize, progress) : (a || b)!.fontSize;
        const typography = { fontSize,
          lineHeight: a && b ? mix(a.lineHeight, b.lineHeight, progress) : (a || b)!.lineHeight,
          letterSpacing: a && b ? mix(a.letterSpacing, b.letterSpacing, progress) : (a || b)!.letterSpacing,
          weight: a && b ? mix(a.weight, b.weight, progress) : (a || b)!.weight };
        position(wrapper, anchor, box);
        Object.assign(wrapper.style, { width: `${anchor.width}px`, height: `${anchor.height}px` });
        if (name === "date") {
          Object.assign(content.style, { width: `${anchor.width}px`, height: `${anchor.height}px`, transform: "none" });
          text.badgeStyles.forEach(({ element, property, value }) => element.style.setProperty(property, value(t)));
        }
        let lineLimit = (b || a)!.lineLimit, extraLineOpacity = (b || a)!.extraLineOpacity;
        if (name !== "date") {
          Object.assign(content.style, { width: `${anchor.width}px`, fontSize: `${fontSize}px`, lineHeight: `${typography.lineHeight}px`,
            letterSpacing: `${typography.letterSpacing}px`, fontWeight: String(typography.weight), display: "block", webkitLineClamp: "unset" });
          // Measure complete lines even when an endpoint is clamped. Interpolating
          // the endpoint heights can otherwise slice through an intermediate line.
          const height = content.getBoundingClientRect().height;
          lineLimit = a?.lineLimit || b?.lineLimit || 0;
          if (lineLimit) {
            const startOpacity = a?.extraLineOpacity ?? 1, endOpacity = b?.extraLineOpacity ?? 1;
            const fadeProgress = endOpacity < startOpacity ? smooth((t - .7) / .25) : smooth(t / .25);
            extraLineOpacity = mix(startOpacity, endOpacity, fadeProgress);
            // One mask stop per line: a whole extra line fades together, never a
            // moving rectangular crop through glyphs. Keep state for fast reversal.
            const stops: string[] = [];
            for (let line = 0; line < Math.ceil(height / typography.lineHeight); line++) {
              const opacity = line < lineLimit ? 1 : extraLineOpacity;
              stops.push(`rgba(0,0,0,${opacity}) ${line * typography.lineHeight}px`, `rgba(0,0,0,${opacity}) ${(line + 1) * typography.lineHeight}px`);
            }
            content.style.maskImage = `linear-gradient(to bottom, ${stops.join(",")})`;
            if (extraLineOpacity === 0) {
              // Restore the browser's original ellipsis only after extra lines are
              // invisible; there is still just one visible copy of the headline.
              Object.assign(content.style, { display: "-webkit-box", webkitBoxOrient: "vertical", webkitLineClamp: String(lineLimit), overflow: "hidden" });
            } else content.style.overflow = "visible";
          } else content.style.maskImage = "none";
          const visibleHeight = lineLimit && extraLineOpacity === 0 ? Math.min(height, lineLimit * typography.lineHeight) : height;
          if (name === "title") titleReflow = Math.max(0, visibleHeight - anchor.height);
          anchor.height = visibleHeight; wrapper.style.height = `${height}px`;
        }
        // Origins without a description/date reveal these fields with the rest of the article.
        if (!a || !b) wrapper.style.opacity = String(kind === "press" ? 1 : b ? smooth((elapsed - .16) / .2) : 1 - smooth(elapsed / .16));
        current[name] = { ...(b || a)!, node: content, rect: anchor, ...typography, lineLimit, extraLineOpacity };
      }
      this.visual = current;
    };
    update(0);
    const animation = animate(0, 1, { type: "spring", ...springs[kind], restDelta: .001, restSpeed: .01, onUpdate: update, onComplete: done });
    this.stopAnimation = () => animation.stop();
  }
}
