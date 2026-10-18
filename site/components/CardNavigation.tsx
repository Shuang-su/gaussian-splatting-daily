"use client";

import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useRef, useState, type MouseEvent, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { animate } from "motion";
import { BASE } from "../lib/catalog";
import { articlePath, HISTORY_CHANGE, markerFrom, mergeMarker, navigationStore, ordinaryClick, returnDistance, sameDocument, sitePath, UI_CAPTURE, type NavigationMarker, type PageSnapshot, type PageUI } from "../lib/card-navigation";
import { CARD_TIMING, CardAnimator, captureCard, retainThumbnail, visualElements, type CardVisual } from "../lib/card-transition-visual";

type Transaction = {
  kind: "enter" | "return" | "history"; href: string; marker: NavigationMarker;
  snapshot?: PageSnapshot; visual: CardVisual | null; cancelled: boolean; token: number; inputTime?: number; arrived?: boolean; expired?: boolean;
};
type Context = { busy: boolean; returnHref: string; hasSource: boolean; navigate: (event: MouseEvent<HTMLAnchorElement>) => void; back: (event: MouseEvent<HTMLAnchorElement>) => void };
const NavigationContext = createContext<Context | null>(null);
export const useCardNavigation = () => useContext(NavigationContext);
const currentURL = () => location.pathname + location.search + location.hash;
const nextHref = (url: string) => url.slice(BASE.length) || "/";
const findOrigin = (key?: string) => key ? document.querySelector<HTMLElement>(`[data-article-origin="${CSS.escape(key)}"]`) : null;
const linksIn = (root: HTMLElement) => root.matches("a[href]") ? [root] : [...root.querySelectorAll<HTMLElement>("a[href]")];
const reduceMotion = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

export default function CardNavigation({ children }: { children: ReactNode }) {
  const router = useRouter(), pathname = usePathname();
  const layer = useRef<HTMLDivElement>(null), animator = useRef<CardAnimator | null>(null);
  const active = useRef<NavigationMarker | null>(null), activeURL = useRef("");
  const pending = useRef<Transaction | null>(null), sequence = useRef(0);
  const frame = useRef(0), watchdog = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const returnTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const restoring = useRef(false), animatedScroll = useRef(0);
  const fade = useRef<ReturnType<typeof animate> | null>(null);
  const [busy, setBusy] = useState(false);
  const [source, setSource] = useState<PageSnapshot | null>(null);

  const syncSource = useCallback((marker: NavigationMarker) => {
    const candidate = navigationStore().get(marker.sourceId);
    setSource(candidate && sitePath(candidate.url) ? candidate : null);
  }, []);
  const ensureMarker = useCallback(() => {
    if (active.current) return active.current;
    const existing = markerFrom(history.state);
    const marker = existing || { session: crypto.randomUUID(), id: crypto.randomUUID(), index: 0 };
    active.current = marker; activeURL.current = currentURL();
    history.replaceState(mergeMarker(history.state, marker), "");
    return marker;
  }, []);
  const capture = useCallback((origin?: HTMLElement, anchor?: HTMLElement) => {
    const marker = ensureMarker(), previous = navigationStore().get(marker.id);
    const ui: PageUI = {};
    window.dispatchEvent(new CustomEvent(UI_CAPTURE, { detail: { ui } }));
    const snapshot: PageSnapshot = { marker, url: activeURL.current || currentURL(), scroll: scrollY, width: innerWidth, ui,
      ...(previous?.originKey ? { originKey: previous.originKey, originTop: previous.originTop, focusIndex: previous.focusIndex } : {}) };
    // Queries can change without a route render (the search filter uses replaceState).
    if (sameDocument(activeURL.current.split("?")[0], location.pathname)) snapshot.url = currentURL();
    if (origin) { snapshot.originKey = origin.dataset.articleOrigin; snapshot.originTop = origin.getBoundingClientRect().top; snapshot.focusIndex = anchor ? Math.max(0, linksIn(origin).indexOf(anchor)) : 0; }
    navigationStore().save(snapshot); return snapshot;
  }, [ensureMarker]);

  const clearVisual = useCallback(() => {
    animator.current?.clear();
    fade.current?.stop(); fade.current = null;
    document.querySelector<HTMLElement>("main")?.style.removeProperty("opacity");
    document.querySelectorAll<HTMLElement>("[data-card-opening]").forEach(element => { delete element.dataset.cardOpening; });
    document.querySelectorAll<HTMLElement>("[data-card-returning]").forEach(element => { element.style.removeProperty("transform"); element.style.removeProperty("opacity"); delete element.dataset.cardReturning; });
    if (layer.current) layer.current.dataset.state = "idle";
  }, []);
  const finish = useCallback(() => {
    clearVisual(); clearTimeout(watchdog.current); clearTimeout(returnTimer.current); cancelAnimationFrame(frame.current);
    restoring.current = false; navigationStore().restoration = null;
    pending.current = null; setBusy(false);
  }, [clearVisual]);
  const cancelVisual = useCallback(() => {
    const waiting = pending.current && (!pending.current.arrived || restoring.current);
    if (pending.current) pending.current.cancelled = true;
    if (waiting) { clearVisual(); setBusy(false); }
    else finish();
  }, [clearVisual, finish]);

  const begin = useCallback((transaction: Transaction) => {
    cancelAnimationFrame(frame.current); clearTimeout(watchdog.current); clearTimeout(returnTimer.current); clearVisual();
    pending.current = transaction; restoring.current = Boolean(transaction.snapshot);
    navigationStore().restoration = transaction.snapshot || null;
    setBusy(true);
    if (layer.current) {
      layer.current.dataset.state = "waiting";
      layer.current.dataset.kind = transaction.kind;
      layer.current.dataset.duration = String(transaction.kind === "enter" ? CARD_TIMING.enter : CARD_TIMING.return);
      if (!animator.current) animator.current = new CardAnimator(layer.current);
    }
    if (transaction.visual && !reduceMotion()) {
      try { animator.current?.preview(transaction.visual); }
      catch { clearVisual(); transaction.visual = null; }
    }
    performance.clearMarks("gsd-navigation-input"); performance.clearMarks("gsd-navigation-feedback");
    performance.mark("gsd-navigation-input", { startTime: transaction.inputTime ?? performance.now() });
    requestAnimationFrame(() => {
      performance.mark("gsd-navigation-feedback");
      performance.measure("gsd-navigation-feedback", "gsd-navigation-input", "gsd-navigation-feedback");
    });
    watchdog.current = setTimeout(() => {
      if (pending.current?.token !== transaction.token) return;
      // A slow/failed route must leave a usable page, without an abandoned proxy.
      pending.current.expired = true;
      cancelVisual(); restoring.current = false;
    }, 2000);
  }, [cancelVisual, clearVisual]);

  const navigate = useCallback((event: MouseEvent<HTMLAnchorElement>) => {
    const anchor = event.currentTarget;
    if (!ordinaryClick(event, anchor.target, anchor.hasAttribute("download"))) return;
    const url = new URL(anchor.href), href = url.pathname + url.search + url.hash;
    const origin = anchor.closest<HTMLElement>("[data-article-origin]");
    if (url.origin !== location.origin || !articlePath(href) || !origin || url.pathname === location.pathname) return;
    if (pending.current?.href === href) {
      if (pending.current.expired) finish(); // A failed route can be retried as an ordinary link.
      else event.preventDefault();
      return;
    }
    event.preventDefault();
    const inputTime = performance.now();
    const snapshot = capture(origin, anchor), marker = snapshot.marker;
    begin({ kind: "enter", href, marker: { session: marker.session, id: crypto.randomUUID(), index: marker.index + 1, sourceId: marker.id, sourceKey: origin.dataset.articleOrigin },
      visual: url.hash ? null : captureCard(origin), cancelled: false, token: ++sequence.current, inputTime });
    origin.dataset.cardOpening = "true";
    router.push(nextHref(href), { scroll: false });
  }, [begin, capture, finish, router]);

  const back = useCallback((event: MouseEvent<HTMLAnchorElement>) => {
    if (!ordinaryClick(event, event.currentTarget.target)) return;
    const current = ensureMarker(), target = navigationStore().get(current.sourceId);
    if (!target || !sitePath(target.url)) return; // The ordinary link opens the archive.
    event.preventDefault();
    if (pending.current?.kind === "return") return;
    const inputTime = performance.now();
    const article = document.querySelector<HTMLElement>(".article-shell");
    const visual = animator.current?.current() || (article ? captureCard(article, true) : null);
    capture();
    const token = ++sequence.current;
    begin({ kind: "return", href: target.url, marker: target.marker, snapshot: target, visual, cancelled: false, token, inputTime });
    const distance = returnDistance(current, target);
    const navigateBack = () => {
      if (pending.current?.token !== token) return;
      if (distance !== null) history.go(distance);
      else router.replace(nextHref(target.url), { scroll: false });
    };
    if (!visual && !reduceMotion()) {
      const main = document.querySelector<HTMLElement>("main");
      if (main) fade.current = animate(main, { opacity: 0 }, { duration: .12 });
      // Scrolling may cancel the visual, but it must not swallow the requested return.
      returnTimer.current = setTimeout(navigateBack, 120);
    } else navigateBack();
  }, [begin, capture, ensureMarker, router]);

  const arrive = useCallback(() => {
    let transaction = pending.current;
    if (transaction && !sameDocument(transaction.href, currentURL())) {
      // A regular menu/header link can take over a pending card route too.
      finish(); transaction = null;
    }
    if (!transaction) {
      const existing = markerFrom(history.state);
      const marker = existing && (!active.current || existing.id !== active.current.id || sameDocument(activeURL.current, currentURL())) ? existing
        : { session: ensureMarker().session, id: crypto.randomUUID(), index: ensureMarker().index + 1 };
      active.current = marker; activeURL.current = currentURL();
      history.replaceState(mergeMarker(history.state, marker), ""); syncSource(marker);
      return;
    }
    transaction.arrived = true;
    if (transaction.snapshot) {
      fade.current?.stop(); fade.current = null;
      document.querySelector<HTMLElement>("main")?.style.removeProperty("opacity");
    }
    // Mask the incoming page in the layout phase, before its first paint. Geometry is
    // measured over the next frames while the already-visible source proxy stays in place.
    if (transaction.kind === "enter" && transaction.visual && !transaction.cancelled && !reduceMotion()) {
      const main = document.querySelector<HTMLElement>("main");
      if (main) main.style.opacity = "0";
    }
    active.current = transaction.marker; activeURL.current = currentURL();
    history.replaceState(mergeMarker(history.state, transaction.marker), ""); syncSource(transaction.marker);
    clearTimeout(watchdog.current);
    const started = performance.now();
    const settle = () => {
      if (pending.current?.token !== transaction.token) return;
      const snapshot = transaction.snapshot;
      const target = snapshot?.originKey ? findOrigin(snapshot.originKey)
        : document.querySelector<HTMLElement>(".article-shell") || (snapshot ? document.querySelector<HTMLElement>("main") : null);
      let chapterFocus: HTMLElement | null = null;
      // Search results and restored load-more rows can mount after the route shell.
      if (!target && performance.now() - started < 1800) { frame.current = requestAnimationFrame(settle); return; }
      if (snapshot) {
        const top = snapshot.width !== innerWidth && target && snapshot.originTop !== undefined
          ? scrollY + target.getBoundingClientRect().top - snapshot.originTop : snapshot.scroll;
        window.scrollTo({ top, behavior: "instant" });
      } else {
        const hash = new URL(transaction.href, location.origin).hash;
        let destination: HTMLElement | null = null;
        try { destination = hash ? document.getElementById(decodeURIComponent(hash.slice(1))) : null; } catch {}
        if (destination) {
          const section = destination.closest<HTMLElement>("[data-event-id], section") || destination;
          chapterFocus = section.querySelector<HTMLElement>("h1, h2, h3, h4") || section;
        }
        if (destination) destination.scrollIntoView({ block: "start", behavior: "instant" });
        else window.scrollTo({ top: 0, behavior: "instant" });
      }
      frame.current = requestAnimationFrame(() => {
        if (pending.current?.token !== transaction.token) return;
        restoring.current = false; animatedScroll.current = scrollY;
        const focus = snapshot?.originKey && target ? linksIn(target)[snapshot.focusIndex || 0] || target
          : chapterFocus || document.querySelector<HTMLElement>(".article-header h1");
        const complete = () => {
          finish();
          // Focusing before hiding the real title for the proxy makes browsers blur it.
          if (focus?.isConnected) { if (!focus.matches("a, button")) focus.tabIndex = -1; focus.focus({ preventScroll: true }); }
        };
        const starting = animator.current?.current() || transaction.visual;
        const destination = target ? captureCard(target, !snapshot, starting) : null;
        const canMorph = transaction.kind !== "history" && !transaction.cancelled && !reduceMotion() && transaction.visual && destination &&
          transaction.visual.image.key === destination.image.key && (!snapshot || snapshot.width === innerWidth);
        if (canMorph && target) {
          try {
            layer.current!.dataset.state = transaction.kind;
            retainThumbnail(target, starting!);
            animator.current?.hide(visualElements(target, !snapshot));
            animator.current?.morph(starting!, destination!, transaction.kind === "enter" ? "enter" : "return", complete);
            return;
          } catch { /* Return control to the real page if geometry/animation setup fails. */ }
        }
        clearVisual();
        if (transaction.kind === "history" || reduceMotion() || transaction.cancelled) { complete(); return; }
        layer.current!.dataset.state = "fade";
        const element = snapshot && target ? target : document.querySelector<HTMLElement>("main");
        if (!element) { complete(); return; }
        if (snapshot) element.dataset.cardReturning = "true";
        fade.current = animate(element, { opacity: [.65, 1] }, { duration: .12, onComplete: complete });
      });
    };
    frame.current = requestAnimationFrame(settle);
  }, [clearVisual, ensureMarker, finish, syncSource]);

  useLayoutEffect(() => { arrive(); }, [pathname, arrive]);
  useEffect(() => {
    ensureMarker(); syncSource(active.current!);
    const beforeHistory = () => capture();
    const hashChanged = () => {
      const marker = markerFrom(history.state);
      if (marker) { active.current = marker; activeURL.current = currentURL(); syncSource(marker); }
    };
    const pop = (event: PopStateEvent) => {
      const previousURL = activeURL.current;
      // Capture against the outgoing entry, before React handles this popstate.
      const ui: PageUI = {}; window.dispatchEvent(new CustomEvent(UI_CAPTURE, { detail: { ui } }));
      if (active.current) navigationStore().save({ ...navigationStore().get(active.current.id), marker: active.current, url: previousURL, scroll: scrollY, width: innerWidth, ui });
      const marker = markerFrom(event.state);
      if (!marker) { finish(); active.current = null; return; }
      if (pending.current?.kind === "return" && pending.current.marker.id === marker.id) return;
      finish();
      active.current = marker; activeURL.current = currentURL(); syncSource(marker);
      if (sameDocument(previousURL, currentURL())) return; // Native anchor traversal.
      const snapshot = navigationStore().get(marker.id);
      if (!snapshot) return; // Leave unrelated history entries to the browser/router.
      const transaction: Transaction = { kind: "history", href: currentURL(), marker, snapshot, visual: null, cancelled: false, token: ++sequence.current };
      begin(transaction);
    };
    const userInput = () => { if (pending.current) cancelVisual(); };
    const otherLink = (event: globalThis.MouseEvent) => {
      if (!pending.current || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || !(event.target instanceof Element)) return;
      const anchor = event.target.closest<HTMLAnchorElement>("a[href]");
      if (!anchor || anchor.download || (anchor.target && anchor.target !== "_self")) return;
      const url = new URL(anchor.href);
      if (url.origin === location.origin && url.pathname + url.search + url.hash !== pending.current.href) finish();
    };
    const scroll = () => { if (!restoring.current && pending.current && Math.abs(scrollY - animatedScroll.current) > 1 && layer.current?.dataset.state !== "waiting") cancelVisual(); };
    const keys = (event: KeyboardEvent) => { if (["ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End", " "].includes(event.key)) userInput(); };
    const resize = () => { if (pending.current) { pending.current.cancelled = true; cancelVisual(); } };
    const motionPreference = matchMedia("(prefers-reduced-motion: reduce)");
    motionPreference.addEventListener("change", userInput);
    window.addEventListener("popstate", pop, true);
    window.addEventListener(UI_CAPTURE + "-before-history", beforeHistory);
    window.addEventListener(HISTORY_CHANGE, hashChanged);
    window.addEventListener("pagehide", beforeHistory);
    document.addEventListener("click", otherLink);
    window.addEventListener("wheel", userInput, { passive: true }); window.addEventListener("touchmove", userInput, { passive: true });
    window.addEventListener("scroll", scroll, { passive: true }); window.addEventListener("keydown", keys); window.addEventListener("resize", resize);
    return () => {
      window.removeEventListener("popstate", pop, true); window.removeEventListener(UI_CAPTURE + "-before-history", beforeHistory);
      window.removeEventListener(HISTORY_CHANGE, hashChanged); window.removeEventListener("pagehide", beforeHistory);
      document.removeEventListener("click", otherLink);
      motionPreference.removeEventListener("change", userInput);
      window.removeEventListener("wheel", userInput); window.removeEventListener("touchmove", userInput); window.removeEventListener("scroll", scroll);
      window.removeEventListener("keydown", keys); window.removeEventListener("resize", resize);
      clearTimeout(watchdog.current); clearTimeout(returnTimer.current); cancelAnimationFrame(frame.current); animator.current?.clear(); fade.current?.stop();
    };
  }, [begin, cancelVisual, capture, ensureMarker, finish, syncSource]);

  return <NavigationContext.Provider value={{ busy, returnHref: source?.url ? nextHref(source.url) : "/daily/", hasSource: Boolean(source), navigate, back }}>
    {children}<div ref={layer} className="card-transition-layer" data-state="idle" aria-hidden="true" inert />
  </NavigationContext.Provider>;
}
