"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { installReaderSheetDrag } from "../lib/reader-sheet";

export default function ReadingExperience() {
  const pathname = usePathname();
  useEffect(installReaderSheetDrag, []);
  useEffect(() => {
    const cover = document.querySelector<HTMLElement>(".article-cover, .article-intro-cover");
    const image = cover?.querySelector<HTMLElement>(".source-image > img");
    if (!cover || !image) return;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;
    let previous = -1;
    function update() {
      frame = 0;
      const bounds = image!.getBoundingClientRect();
      const height = Math.max(bounds.height, 1);
      const top = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--header-height")) || 56;
      const progress = !reduced.matches && bounds.bottom > 0
        ? Math.min(1, Math.max(0, (top - bounds.top) / (height * .8))) : 0;
      const blur = Math.round(14 * progress * 4) / 4;
      if (blur !== previous) {
        image!.style.filter = blur > 0 ? `blur(${blur}px)` : "";
        previous = blur;
      }
    }
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };
    schedule();
    addEventListener("scroll", schedule, { passive: true });
    addEventListener("resize", schedule);
    reduced.addEventListener("change", schedule);
    return () => {
      cancelAnimationFrame(frame);
      image.style.removeProperty("filter");
      removeEventListener("scroll", schedule);
      removeEventListener("resize", schedule);
      reduced.removeEventListener("change", schedule);
    };
  }, [pathname]);
  return null;
}
