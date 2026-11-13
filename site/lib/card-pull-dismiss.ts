import { animate } from "motion";

const slop = 12;
const excluded = "a, button, input, textarea, select, label, summary, dialog, iframe, video, audio, canvas, [contenteditable], [role=button], [data-no-pull], [data-glass-surface]";
export function pullGeometry(distance: number, width: number, height: number) {
  const progress = Math.min(1, Math.max(0, distance) / 270);
  const scale = 1 - .11 * progress;
  return { scale, radius: 26 * progress, rect: { x: width * (1 - scale) / 2, y: distance, width: width * scale, height: height * scale } };
}
export function shouldDismiss(distance: number, velocity: number) {
  return distance >= 116 || (distance >= 56 && velocity >= .65);
}

type Options = {
  eligible: () => boolean;
  show: (visible: boolean) => void;
  commit: (geometry: ReturnType<typeof pullGeometry>) => void;
  invalidate: () => void;
};

export function attachPullDismiss(main: HTMLElement, options: Options) {
  const mobile = matchMedia("(max-width: 767px) and (pointer: coarse)");
  const motion = matchMedia("(prefers-reduced-motion: reduce)");
  let gesture: { id: number; x: number; y: number; top: number; distance: number; previous: number; time: number; velocity: number; owned: boolean } | null = null;
  let spring: ReturnType<typeof animate> | null = null;
  let frame = 0;
  function paint(distance: number) {
    const geometry = pullGeometry(distance, innerWidth, innerHeight);
    main.style.setProperty("--card-pull-y", `${distance}px`);
    main.style.setProperty("--card-pull-scale", String(geometry.scale));
    main.style.setProperty("--card-pull-radius", `${geometry.radius}px`);
  }
  function abort() {
    spring?.stop();
    spring = null;
    cancelAnimationFrame(frame);
    gesture = null;
    delete main.dataset.cardPulling;
    for (const name of ["y", "scale", "radius"]) main.style.removeProperty(`--card-pull-${name}`);
    options.show(false);
  }
  function start(event: TouchEvent) {
    if (event.touches.length !== 1) { abort(); return; }
    if (spring || !mobile.matches || motion.matches || Math.abs(scrollY) > 1 ||
      (visualViewport?.scale ?? 1) > 1.01 || !options.eligible() || getSelection()?.isCollapsed === false ||
      document.querySelector("dialog[open], [data-reader-popover][data-open=true], .reader-panel, [data-reading-panel]")) return;
    const target = event.target;
    if (!(target instanceof Element) || !target.closest(".article-shell") || target.closest(excluded)) return;
    for (let parent = target; parent && parent !== main; parent = parent.parentElement!) {
      if (parent.scrollHeight > parent.clientHeight + 1 && /auto|scroll/.test(getComputedStyle(parent).overflowY)) return;
    }
    const touch = event.touches[0];
    if (touch.clientX < 24 || touch.clientX > innerWidth - 24) return;
    gesture = { id: touch.identifier, x: touch.clientX, y: touch.clientY, top: main.getBoundingClientRect().top,
      distance: 0, previous: 0, time: event.timeStamp, velocity: 0, owned: false };
  }
  function move(event: TouchEvent) {
    const current = gesture;
    if (!current) return;
    if (event.touches.length !== 1) { abort(); return; }
    const touch = event.touches[0];
    if (touch.identifier !== current.id) { abort(); return; }
    const y = touch.clientY - current.y;
    const x = Math.abs(touch.clientX - current.x);
    if (!current.owned) {
      if (Math.max(Math.abs(y), x) < slop) return;
      if (y < slop || y < x * 1.3 || Math.abs(scrollY) > 1 || !event.cancelable) { abort(); return; }
      current.owned = true;
      main.dataset.cardPulling = "";
      options.show(true);
    }
    if (!event.cancelable) { abort(); return; }
    event.preventDefault();
    current.velocity = (y - current.previous) / Math.max(8, event.timeStamp - current.time);
    current.previous = y;
    current.time = event.timeStamp;
    current.distance = Math.max(0, y - slop);
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => paint(current.distance));
  }
  function end(event: TouchEvent) {
    const current = gesture;
    if (!current || !Array.from(event.changedTouches).some(touch => touch.identifier === current.id)) return;
    gesture = null;
    if (!current.owned) return;
    cancelAnimationFrame(frame);
    const velocity = event.timeStamp - current.time < 80 ? current.velocity : 0;
    if (options.eligible() && shouldDismiss(current.distance, velocity)) {
      paint(current.distance);
      const geometry = pullGeometry(current.distance, innerWidth, innerHeight);
      geometry.rect.y += current.top;
      geometry.radius *= geometry.scale;
      options.commit(geometry);
      abort();
      return;
    }
    spring = animate(current.distance, 0, { type: "spring", stiffness: 390, damping: 32, onUpdate: paint, onComplete: abort });
  }
  const resize = () => { abort(); options.invalidate(); };
  main.addEventListener("touchstart", start, { passive: true });
  main.addEventListener("touchmove", move, { passive: false });
  main.addEventListener("touchend", end);
  main.addEventListener("touchcancel", abort);
  const escape = (event: KeyboardEvent) => { if (event.key === "Escape") abort(); };
  window.addEventListener("keydown", escape);
  window.addEventListener("resize", resize);
  window.addEventListener("pagehide", resize);
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
    document.removeEventListener("visibilitychange", abort);
    motion.removeEventListener("change", abort);
  } };
}
