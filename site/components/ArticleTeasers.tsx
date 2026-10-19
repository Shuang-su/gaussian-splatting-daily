import Link from "next/link";
import type { EditorialArticleSummary } from "../lib/types";
export const ARTICLE_GENRES = { paper: "论文解读", tool: "工具解读", topic: "专题" };
export default function ArticleTeasers({ articles, title = "深入阅读" }: { articles: EditorialArticleSummary[]; title?: string }) {
  if (!articles.length) return null;
  return <section className="editorial-teasers" aria-label={title}><h2>{title}</h2><div>{articles.map(article => <article key={article.id}><span className="article-series">{ARTICLE_GENRES[article.genre]}</span><h3><Link href={article.url}>{article.title}</Link></h3><p>{article.summary}</p><time dateTime={article.date}>{article.date}</time></article>)}</div></section>;
}
