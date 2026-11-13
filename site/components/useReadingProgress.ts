"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { navigationStore, UI_CAPTURE } from "../lib/card-navigation";
import { captureReadingPosition, consumeReadingResume, readReadingPosition, readingLine, READER_ROUTE_READY, resolveReadingPosition, writeReadingPosition } from "../lib/reading-progress";
import type { ReaderIdentity } from "../lib/reader";

export function useReadingProgress(article: ReaderIdentity | null) {
  const [restartId, setRestartId] = useState<string | null>(null);
  const stop = useRef<(() => void) | null>(null);
  const resetReading = useCallback(() => {
    if (!article) return;
    stop.current?.();
    writeReadingPosition(article.id, null);
    setRestartId(null);
    if (location.hash) history.replaceState(history.state, "", location.pathname + location.search);
    const heading = document.querySelector<HTMLElement>("#article-top h1");
    if (heading) {
      heading.tabIndex = -1;
      heading.focus({ preventScroll: true });
    }
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [article]);

  useEffect(() => {
    if (!article) return;
    const root = document.getElementById("article-top");
    if (!root) return;
    let frame = 0;
    let initial = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let observer: ResizeObserver | undefined;
    let ready = false;
    let expectedScroll = scrollY;
    let dirty = false;
    let placing = false;
    let cancelled = false;
    let active = true;
    let cleanAlign: (() => void) | undefined;
    const initialURL = new URL(location.href);

    const stopRestoring = () => {
      placing = false;
      cancelled = true;
      cancelAnimationFrame(frame);
      cancelAnimationFrame(initial);
      observer?.disconnect();
      cleanAlign?.();
      cleanAlign = undefined;
    };
    const markInteraction = () => {
      cancelled = true;
      if (placing) stopRestoring();
    };
    stop.current = () => {
      stopRestoring();
      expectedScroll = 0;
      dirty = false;
      clearTimeout(timer);
    };
    const save = () => {
      if (!dirty || placing || navigationStore().restoration || !root.isConnected || location.pathname !== initialURL.pathname) return;
      dirty = false;
      const position = captureReadingPosition(root);
      writeReadingPosition(article.id, position);
      if (!position) setRestartId(null);
    };
    const scroll = () => {
      if (!ready || document.documentElement.hasAttribute("data-reader-route-pending") ||
          Math.abs(scrollY - expectedScroll) <= 1) return;
      expectedScroll = scrollY;
      stopRestoring();
      dirty = true;
      clearTimeout(timer);
      timer = setTimeout(save, 160);
    };

    function restore(explicit: boolean, kind?: string) {
      if (!active) return;
      const position = readReadingPosition(article!.id);
      const resolved = position && resolveReadingPosition(root!, position);
      if (explicit) {
        const target = resolved?.element || root!.querySelector<HTMLElement>("h1");
        if (target) {
          if (!target.matches("a[href], button, [tabindex]")) target.tabIndex = -1;
          target.focus({ preventScroll: true });
        }
      }
      const navigation = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
      const historyArrival = kind === "history" || kind === "return" || (!kind && navigation?.type === "back_forward" &&
        initialURL.pathname === new URL(navigation.name).pathname);
      if (!resolved || initialURL.searchParams.has("giscus") || (!explicit && (location.hash || historyArrival || cancelled))) {
        setRestartId(null);
        return;
      }
      setRestartId(article!.id);
      if (explicit) {
        cancelled = false;
        expectedScroll = scrollY;
        dirty = false;
        if (location.hash) history.replaceState(history.state, "", location.pathname + location.search);
      }
      placing = true;
      const align = () => {
        if (!placing || !root!.isConnected) return;
        const bounds = resolved.element.getBoundingClientRect();
        const top = scrollY + bounds.top + bounds.height * resolved.fraction - readingLine();
        if (Math.abs(top - scrollY) > 1) window.scrollTo({ top, behavior: "instant" });
        expectedScroll = scrollY;
      };
      const schedule = () => {
        cancelAnimationFrame(frame);
        frame = requestAnimationFrame(align);
      };
      align();
      observer?.disconnect();
      if (typeof ResizeObserver !== "undefined") {
        observer = new ResizeObserver(schedule);
        observer.observe(root!);
        observer.observe(resolved.element);
      }
      root!.addEventListener("load", schedule, true);
      document.fonts?.ready.then(() => { if (active && placing) schedule(); });
      window.addEventListener("resize", schedule);
      cleanAlign = () => {
        root!.removeEventListener("load", schedule, true);
        window.removeEventListener("resize", schedule);
      };
    }

    const onReady = (event?: Event) => {
      cancelAnimationFrame(initial);
      const interrupted = cancelled;
      stopRestoring();
      cancelled = interrupted;
      expectedScroll = scrollY;
      ready = true;
      restore(consumeReadingResume(), (event as CustomEvent<{ kind?: string }> | undefined)?.detail?.kind);
    };
    const initialReady = () => {
      if (navigationStore().restoration || document.documentElement.hasAttribute("data-reader-route-pending")) {
        initial = requestAnimationFrame(initialReady);
      } else onReady();
    };
    initial = requestAnimationFrame(() => { initial = requestAnimationFrame(initialReady); });
    const keydown = (event: KeyboardEvent) => {
      if (!event.defaultPrevented && !document.querySelector("dialog[open]") &&
          !(event.target instanceof HTMLElement && event.target.closest("input, textarea, select, [contenteditable]")) &&
          ["ArrowDown", "ArrowUp", "PageDown", "PageUp", "Home", "End", " "].includes(event.key)) markInteraction();
    };
    const pointer = (event: Event) => {
      if (!(event.target instanceof Element) || !event.target.closest("dialog")) markInteraction();
    };
    const onHash = () => {
      stopRestoring();
      ready = false;
      dirty = false;
      initial = requestAnimationFrame(() => {
        initial = requestAnimationFrame(() => { expectedScroll = scrollY; ready = true; });
      });
    };
    window.addEventListener(READER_ROUTE_READY, onReady);
    window.addEventListener("scroll", scroll, { passive: true });
    window.addEventListener("pointerdown", pointer, { passive: true });
    window.addEventListener("wheel", pointer, { passive: true });
    window.addEventListener("keydown", keydown);
    window.addEventListener("hashchange", onHash);
    window.addEventListener("reading-navigation-jump", onHash);
    window.addEventListener("pagehide", save);
    window.addEventListener(UI_CAPTURE, save);
    window.addEventListener(UI_CAPTURE + "-before-history", save);
    return () => {
      active = false;
      save();
      stopRestoring();
      clearTimeout(timer);
      stop.current = null;
      window.removeEventListener(READER_ROUTE_READY, onReady);
      window.removeEventListener("scroll", scroll);
      window.removeEventListener("pointerdown", pointer);
      window.removeEventListener("wheel", pointer);
      window.removeEventListener("keydown", keydown);
      window.removeEventListener("hashchange", onHash);
      window.removeEventListener("reading-navigation-jump", onHash);
      window.removeEventListener("pagehide", save);
      window.removeEventListener(UI_CAPTURE, save);
      window.removeEventListener(UI_CAPTURE + "-before-history", save);
    };
  }, [article]);

  return { canRestart: Boolean(article && article.id === restartId), resetReading };
}
