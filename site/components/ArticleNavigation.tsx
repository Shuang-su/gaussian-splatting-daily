"use client";
import { useEffect, useState } from "react";
import type { Article } from "../lib/types";
import { articleNavigation } from "../lib/article-navigation";
export default function ArticleNavigation({
  toc,
  collapsed = false,
  excludeIds = [],
}: {
  toc: Article["toc"];
  collapsed?: boolean;
  excludeIds?: string[];
}) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    setOpen(!collapsed && window.matchMedia("(min-width: 781px)").matches);
  }, [collapsed]);
  return (
    <details open={open} onToggle={(e) => setOpen(e.currentTarget.open)}>
      <summary>目录</summary>
      <nav aria-label="本期目录">
        {articleNavigation(toc)
          .filter((t) => !excludeIds.includes(t.id))
          .map((t) => (
            <a href={`#${t.id}`} key={t.key}>
              {t.title}
            </a>
          ))}
      </nav>
    </details>
  );
}
