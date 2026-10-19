import type { Article } from "../lib/types";
import { REPO } from "../lib/catalog";
import ArticleBody from "./ArticleBody";

export default function ArticleFooter({ article: a }: { article: Article }) {
  return <footer className="article-colophon" id="sources">
    <h2>来源与纠错</h2>
    {a.editorialDisclosure && <p className="editorial-disclosure">{a.editorialDisclosure}</p>}
    <nav aria-label="文章来源"><a href={`${REPO}/blob/main/${a.path}`}>{a.readingEdition ? "研究归档" : "GitHub 原文"}</a><a href={`${REPO}/blob/main/docs/corrections.md`}>纠错记录</a><a href={`${REPO}/issues/new?template=correction.yml`}>提交纠错</a></nav>
    {a.unresolvedSources > 0 && <p className="source-notice">本期有 {a.unresolvedSources} 处来源引用待补充。<a href={`${REPO}/blob/main/docs/history-audit.md`}>查看来源记录</a></p>}
    {a.image && <p className="cover-credit">封面：<a href={a.image.source} target="_blank" rel="noopener noreferrer">{a.image.credit}</a></p>}
    <details className="article-archive"><summary>归档与修订记录</summary>
      <div className="archive-links">{a.issue && <a href={`${REPO}/issues/${a.issue}`}>Issue #{a.issue}</a>}{a.prs.map(n => <a key={n} href={`${REPO}/pull/${n}`}>PR #{n}</a>)}</div>
      {a.archiveHtml && <details className="original-record"><summary>原始研究记录</summary><ArticleBody html={a.archiveHtml} /></details>}
    </details>
  </footer>;
}
