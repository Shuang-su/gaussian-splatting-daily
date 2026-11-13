"use client";

import { useId, useLayoutEffect, useRef } from "react";
import { createPortal } from "react-dom";
import Icon from "./Icon";

export interface FootnoteSelection {
  trigger: HTMLAnchorElement;
  definition: HTMLElement;
}

export default function FootnotePopover({ selection, close }: {
  selection: FootnoteSelection;
  close: (restoreFocus: boolean) => void;
}) {
  const bubble = useRef<HTMLDivElement>(null);
  const body = useRef<HTMLDivElement>(null);
  const id = useId();

  useLayoutEffect(() => {
    const panel = bubble.current;
    const content = body.current;
    if (!panel || !content) return;
    const { trigger, definition } = selection;
    const copy = definition.cloneNode(true) as HTMLElement;
    copy.querySelectorAll("[data-footnote-backref]").forEach(element => element.remove());
    copy.querySelectorAll("[id]").forEach(element => element.removeAttribute("id"));
    content.replaceChildren(...copy.childNodes);
    trigger.setAttribute("aria-expanded", "true");
    trigger.setAttribute("aria-controls", id);

    function position() {
      if (!panel) return;
      const viewport = window.visualViewport;
      const leftEdge = (viewport?.offsetLeft ?? 0) + 12;
      const topEdge = (viewport?.offsetTop ?? 0) + 12;
      const rightEdge = leftEdge + (viewport?.width ?? innerWidth) - 24;
      const bottomEdge = topEdge + (viewport?.height ?? innerHeight) - 24;
      const anchor = trigger.getBoundingClientRect();
      if (anchor.bottom < topEdge || anchor.top > bottomEdge) { close(false); return; }
      panel.style.maxWidth = `${Math.max(0, Math.min(360, rightEdge - leftEdge))}px`;
      panel.style.maxHeight = `${Math.max(0, bottomEdge - topEdge)}px`;
      const { width, height } = panel.getBoundingClientRect();
      const left = Math.max(leftEdge, Math.min(anchor.left, rightEdge - width));
      const above = anchor.top - height - 8;
      const below = anchor.bottom + 8;
      const top = below + height <= bottomEdge ? below : above >= topEdge ? above : Math.max(topEdge, bottomEdge - height);
      panel.style.left = `${left}px`;
      panel.style.top = `${top}px`;
    }

    const dismiss = (event: PointerEvent) => {
      const target = event.target as Node;
      if (!panel.contains(target) && !trigger.contains(target)) close(false);
    };
    const keyboard = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        event.preventDefault();
        close(true);
      }
    };
    position();
    panel.focus({ preventScroll: true });
    document.addEventListener("pointerdown", dismiss);
    document.addEventListener("keydown", keyboard, true);
    window.addEventListener("scroll", position, { passive: true });
    window.addEventListener("resize", position);
    window.visualViewport?.addEventListener("resize", position);
    window.visualViewport?.addEventListener("scroll", position);
    return () => {
      trigger.removeAttribute("aria-expanded");
      trigger.removeAttribute("aria-controls");
      document.removeEventListener("pointerdown", dismiss);
      document.removeEventListener("keydown", keyboard, true);
      window.removeEventListener("scroll", position);
      window.removeEventListener("resize", position);
      window.visualViewport?.removeEventListener("resize", position);
      window.visualViewport?.removeEventListener("scroll", position);
    };
  }, [selection, close, id]);

  return createPortal(<div id={id} className="reader-footnote-popover" ref={bubble} role="region" aria-label="脚注" tabIndex={-1}>
    <button type="button" className="reader-footnote-close" aria-label="关闭脚注" onClick={() => close(true)}><Icon name="close"/></button>
    <div ref={body}/>
  </div>, document.body);
}
