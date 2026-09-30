"use client";
import { useEffect, useState } from "react";
import type { Article } from "../lib/types";
export default function ArticleNavigation({
  toc,
  collapsed = false,
}: {
  toc: Article["toc"];
  collapsed?: boolean;
}) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    setOpen(!collapsed && window.matchMedia("(min-width: 781px)").matches);
  }, [collapsed]);
  return (
    <details open={open} onToggle={(e) => setOpen(e.currentTarget.open)}>
      <summary>完整栏目目录</summary>
      <nav aria-label="本期目录">
        {toc
          .filter((t) => t.depth === 2)
          .map((t) => (
            <a href={`#${t.id}`} key={t.id}>
              {t.title}
            </a>
          ))}
      </nav>
    </details>
  );
}
