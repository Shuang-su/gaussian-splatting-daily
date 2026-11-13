"use client";

import { useLayoutEffect, useRef, type ReactNode } from "react";
import { useCardNavigation } from "./CardNavigation";

/** Semantic title and metadata stay intact; only their presentation enters in stages. */
export default function ArticleIntro({ children }: { children: ReactNode }) {
  const root = useRef<HTMLElement>(null);
  const entered = useRef(false);
  const navigation = useCardNavigation();
  useLayoutEffect(() => {
    if (navigation?.busy || entered.current || !root.current) return;
    entered.current = true;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const targets = root.current.querySelectorAll("h1, .author-byline, .article-intro-cover");
    const animations = Array.from(targets).map((element, index) => element.animate(
      [{ opacity: 0, transform: "translateY(14px)" }, { opacity: 1, transform: "translateY(0)" }],
      { duration: 460, delay: index * 75, easing: "cubic-bezier(.2,.8,.2,1)", fill: "backwards" },
    ));
    return () => animations.forEach(animation => animation.cancel());
  }, [navigation?.busy]);
  return <header ref={root} className="article-header no-cover article-intro">{children}</header>;
}
