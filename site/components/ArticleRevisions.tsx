"use client";

import type { ArticleRevision } from "../lib/types";
import { pushArticleHash } from "../lib/card-navigation";
import ArticleBody from "./ArticleBody";

export function ArticleRevisionLinks({ revisions }: { revisions?: ArticleRevision[] }) {
  if (!revisions?.length) return null;
  return <nav className="article-revision-links" aria-label="文章更新">
    <span>文章更新</span>
    {revisions.map(revision => <a href={`#${revision.id}`} key={revision.id} onClick={event => {
      if (event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return;
      const target = document.getElementById(revision.id);
      if (!target) return;
      event.preventDefault();
      const offset = parseFloat(getComputedStyle(target).scrollMarginTop) || 76;
      const top = Math.min(document.documentElement.scrollHeight - innerHeight, Math.max(0, target.getBoundingClientRect().top + scrollY - offset));
      const hash = `#${revision.id}`;
      if (location.hash !== hash) pushArticleHash(revision.id);
      window.dispatchEvent(new CustomEvent("reading-navigation-jump", { detail: { top } }));
      window.scrollTo({ top, behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
      target.focus({ preventScroll: true });
    }}><time dateTime={revision.date}>{revision.date}</time><span className="sr-only"> {revision.title}</span></a>)}
  </nav>;
}

export function ArticleRevisions({ revisions }: { revisions?: ArticleRevision[] }) {
  if (!revisions?.length) return null;
  return <section className="article-revisions" aria-label="更新记录">
    <h2>更新记录</h2>
    {revisions.map(revision => <section className="article-revision" id={revision.id} key={revision.id} tabIndex={-1}>
      <time dateTime={revision.date}>{revision.date}</time>
      <h3>{revision.title}</h3>
      <ArticleBody html={revision.html}/>
    </section>)}
  </section>;
}
