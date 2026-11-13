import { animate } from "motion";

const slop = 12;
const excluded = "a, button, input, textarea, select, label, summary, dialog, iframe, video, audio, canvas, [contenteditable], [role=button], [role=slider], [data-no-pull], [data-glass-surface], .preview-stage, .source-gallery";
const overlays = "dialog[open], [aria-modal=true], [data-reader-popover][data-open=true], .reader-panel, [data-reading-panel], .site-header[data-menu-open=true]";

export function pullGeometry(distance: number, width: number, height: number) {
  const progress = Math.min(1, Math.max(0, distance) / 270);
  const scale = 1 - .11 * progress;
  return { scale, radius: 26 * progress, rect: { x: width * (1 - scale) / 2, y: distance, width: width * scale, height: height * scale } };
}

type Sample = { distance: number; time: number };
type Direction = "down" | "right";

export function pullKinematics(samples: Sample[], release: number) {
  const recent = samples.filter(sample => release - sample.time <= 100);
  const last = recent.at(-1);
  if (!last || recent.length < 3 || release - last.time >= 55) return { velocity: 0, acceleration: 0 };
  const first = recent[0];
  const middle = recent[Math.floor(recent.length / 2)];
  const earlyTime = middle.time - first.time;
  const lateTime = last.time - middle.time;
  if (earlyTime < 6 || lateTime < 6) return { velocity: 0, acceleration: 0 };
  const early = (middle.distance - first.distance) / earlyTime;
  const late = (last.distance - middle.distance) / lateTime;
  return {
    velocity: late,
    acceleration: Math.max(-.025, Math.min(.025, 2 * (late - early) / (earlyTime + lateTime))),
  };
}

export function shouldDismiss(distance: number, velocity: number, acceleration = 0) {
  if (distance >= 116) return true;
  if (distance < 42 || velocity <= .05) return false;
  // A brake can stop the flick before the look-ahead interval expires.
  const time = acceleration < 0 ? Math.min(85, velocity / -acceleration) : 85;
  const prediction = Math.min(96, velocity * time + .5 * acceleration * time ** 2);
  return distance + prediction >= 116;
}

type Options = {
  eligible: () => boolean;
  show: (visible: boolean) => void;
  commit: (geometry: ReturnType<typeof pullGeometry>) => void;
  swipe: () => void;
  invalidate: () => void;
};

type Gesture = {
  id: number; x: number; y: number; top: number; scroll: number;
  distance: number; samples: Sample[]; direction?: Direction;
};

export function attachPullDismiss(main: HTMLElement, options: Options) {
  const mobile = matchMedia("(max-width: 767px) and (pointer: coarse)");
  const motion = matchMedia("(prefers-reduced-motion: reduce)");
  let gesture: Gesture | null = null;
  let animation: ReturnType<typeof animate> | null = null;
  let frame = 0;
  function paint(distance: number, direction: Direction) {
    const geometry = direction === "down" ? pullGeometry(distance, innerWidth, innerHeight) : null;
    main.style.setProperty("--card-pull-x", `${direction === "right" ? distance : 0}px`);
    main.style.setProperty("--card-pull-y", `${direction === "down" ? distance : 0}px`);
    main.style.setProperty("--card-pull-scale", String(geometry?.scale ?? 1));
    main.style.setProperty("--card-pull-radius", `${geometry?.radius ?? 0}px`);
  }
  function abort() {
    animation?.stop();
    animation = null;
    cancelAnimationFrame(frame);
    gesture = null;
    delete main.dataset.cardPulling;
    for (const name of ["x", "y", "scale", "radius"]) main.style.removeProperty(`--card-pull-${name}`);
    options.show(false);
  }
  function blocked() {
    return !mobile.matches || motion.matches || (visualViewport?.scale ?? 1) > 1.01 ||
      !options.eligible() || getSelection()?.isCollapsed === false || document.querySelector(overlays);
  }
  function start(event: TouchEvent) {
    if (animation || gesture) { abort(); return; }
    if (event.touches.length !== 1 || blocked()) return;
    const target = event.target;
    if (!(target instanceof Element) || !target.closest(".article-shell") || target.closest(excluded)) return;
    for (let parent: Element | null = target; parent && parent !== main; parent = parent.parentElement) {
      const { overflowX, overflowY } = getComputedStyle(parent);
      if ((parent.scrollHeight > parent.clientHeight + 1 && /auto|scroll/.test(overflowY)) ||
        (parent.scrollWidth > parent.clientWidth + 1 && /auto|scroll/.test(overflowX))) return;
    }
    const touch = event.touches[0];
    if (touch.clientX < 24 || touch.clientX > innerWidth - 24) return;
    gesture = { id: touch.identifier, x: touch.clientX, y: touch.clientY, top: main.getBoundingClientRect().top,
      scroll: scrollY, distance: 0, samples: [{ distance: 0, time: event.timeStamp }] };
  }
  function move(event: TouchEvent) {
    const current = gesture;
    if (!current) return;
    const touch = event.touches[0];
    if (event.touches.length !== 1 || touch.identifier !== current.id) { abort(); return; }
    const y = touch.clientY - current.y;
    const x = touch.clientX - current.x;
    if (!current.direction) {
      if (Math.max(Math.abs(y), Math.abs(x)) < slop) return;
      const down = y >= slop && y >= Math.abs(x) * 1.3 && Math.abs(scrollY) <= 1 && Math.abs(current.scroll) <= 1;
      const right = x >= slop && x >= Math.abs(y) * 1.3 && Math.abs(scrollY - current.scroll) <= 1;
      if ((!down && !right) || !event.cancelable || blocked()) { abort(); return; }
      current.direction = down ? "down" : "right";
      main.dataset.cardPulling = current.direction;
      options.show(true);
    }
    if (!event.cancelable || getSelection()?.isCollapsed === false || document.querySelector(overlays)) { abort(); return; }
    event.preventDefault();
    const direction = current.direction;
    const position = (direction === "down" ? y : x) - slop;
    current.distance = Math.max(0, position);
    current.samples = current.samples.filter(sample => event.timeStamp - sample.time <= 100);
    current.samples.push({ distance: position, time: event.timeStamp });
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => paint(current.distance, direction));
  }
  function end(event: TouchEvent) {
    const current = gesture;
    if (!current || !Array.from(event.changedTouches).some(touch => touch.identifier === current.id)) return;
    gesture = null;
    const direction = current.direction;
    if (!direction) return;
    cancelAnimationFrame(frame);
    const { velocity, acceleration } = pullKinematics(current.samples, event.timeStamp);
    if (!blocked() && shouldDismiss(current.distance, velocity, acceleration)) {
      paint(current.distance, direction);
      if (direction === "right") {
        animation = animate(current.distance, innerWidth, { duration: .18, ease: [0.18, 0.76, 0.38, 1],
          onUpdate: distance => paint(distance, direction),
          onComplete: () => {
            if (!blocked()) options.swipe();
            abort();
          },
        });
        return;
      }
      const geometry = pullGeometry(current.distance, innerWidth, innerHeight);
      geometry.rect.y += current.top;
      geometry.radius *= geometry.scale;
      options.commit(geometry);
      abort();
      return;
    }
    animation = animate(current.distance, 0, { type: "spring", stiffness: 390, damping: 32,
      onUpdate: distance => paint(distance, direction), onComplete: abort });
  }
  const resize = () => { abort(); options.invalidate(); };
  const viewport = window.visualViewport;
  main.addEventListener("touchstart", start, { passive: true });
  main.addEventListener("touchmove", move, { passive: false });
  main.addEventListener("touchend", end);
  main.addEventListener("touchcancel", abort);
  const escape = (event: KeyboardEvent) => { if (event.key === "Escape") abort(); };
  window.addEventListener("keydown", escape);
  window.addEventListener("resize", resize);
  window.addEventListener("pagehide", resize);
  viewport?.addEventListener("resize", abort);
  mobile.addEventListener("change", abort);
  document.addEventListener("visibilitychange", abort);
  motion.addEventListener("change", abort);
  return { abort, dispose() {
    abort();
    main.removeEventListener("touchstart", start);
    main.removeEventListener("touchmove", move);
    main.removeEventListener("touchend", end);
    main.removeEventListener("touchcancel", abort);
    window.removeEventListener("keydown", escape);
    window.removeEventListener("resize", resize);
    window.removeEventListener("pagehide", resize);
    viewport?.removeEventListener("resize", abort);
    mobile.removeEventListener("change", abort);
    document.removeEventListener("visibilitychange", abort);
    motion.removeEventListener("change", abort);
  } };
}
