"use client";

import { usePathname } from "next/navigation";
import { useEffect, useLayoutEffect, useRef, type ReactNode } from "react";
import { TOPICS } from "../lib/catalog";
import { restoredUI, UI_CAPTURE, type PageUI } from "../lib/card-navigation";
import { hierarchyParent, hierarchyPath, topicIndex } from "../lib/reading-hierarchy";
import type { EditorialArticleSummary } from "../lib/types";
import { useCardNavigation } from "./CardNavigation";
import HierarchyLink from "./HierarchyLink";

const uiKey = "reading-hierarchy";

function ParentList({ parent, current, articles }: { parent: string; current: string; articles: EditorialArticleSummary[] }) {
  const list = useRef<HTMLDivElement>(null);
  // Keep the same scroll container when switching between siblings, and keep
  // its position independently of the active document's window scroll.
  const position = useRef(0);
  useLayoutEffect(() => {
    const restored = restoredUI(uiKey) as { parent?: string; top?: number } | undefined;
    if (restored?.parent === parent && typeof restored.top === "number" && Number.isFinite(restored.top)) position.current = restored.top;
    const element = list.current;
    if (!element) return;
    if (restored?.parent === parent || position.current) element.scrollTop = position.current;
    else {
      const active = element.querySelector("[aria-current=page]")?.getBoundingClientRect();
      const bounds = element.getBoundingClientRect();
      if (active && active.bottom > bounds.bottom) element.scrollTop += active.bottom - bounds.bottom + 12;
    }
  }, [current, parent]);
  useEffect(() => {
    const capture = (event: Event) => {
      const { ui } = (event as CustomEvent<{ ui: PageUI }>).detail;
      ui[uiKey] = { parent, top: list.current?.getClientRects().length ? list.current.scrollTop : position.current };
    };
    window.addEventListener(UI_CAPTURE, capture);
    return () => window.removeEventListener(UI_CAPTURE, capture);
  }, [parent]);

  const topic = TOPICS.find(item => parent === `/topics/${item.slug}/`);
  const label = topic?.label || (parent === topicIndex ? "主题" : parent === "/papers/" ? "论文" : "工具");
  const siblings = parent === topicIndex
    ? TOPICS.map(item => ({ title: item.label, url: `/topics/${item.slug}/` }))
    : articles.filter(item => topic ? item.topics.includes(topic.slug) : item.genre === (parent === "/papers/" ? "paper" : "tool"));
  return <aside className="reading-parent" aria-label={`${label}列表`}>
    <nav aria-label="上级页面">
      {topic && <HierarchyLink href={topicIndex}>主题</HierarchyLink>}
      <HierarchyLink href={parent}>{label}</HierarchyLink>
    </nav>
    <div ref={list} className="reading-parent-list" onScroll={event => { position.current = event.currentTarget.scrollTop; }}>
      <ul>{siblings.map(item => <li key={item.url}><HierarchyLink href={item.url} parent={parent} aria-current={hierarchyPath(item.url) === current ? "page" : undefined}>{item.title}</HierarchyLink></li>)}</ul>
    </div>
  </aside>;
}

export default function ReadingHierarchy({ children, articles }: { children: ReactNode; articles: EditorialArticleSummary[] }) {
  const current = hierarchyPath(usePathname());
  const navigation = useCardNavigation();
  const parent = navigation?.hasSource ? null : hierarchyParent(current, navigation?.contextPath);
  return <div className="reading-hierarchy" data-reading-hierarchy={parent ? "active" : undefined}>
    {parent && <ParentList key={parent} parent={parent} current={current} articles={articles} />}
    {children}
  </div>;
}
