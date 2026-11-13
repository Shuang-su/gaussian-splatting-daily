import HierarchyLink from "./HierarchyLink";
import type { EditorialArticleSummary } from "../lib/types";
export const ARTICLE_GENRES = { paper: "论文解读", tool: "工具解读", topic: "专题", app: "应用介绍", tutorial: "教程", case: "作品与案例" };
export default function ArticleTeasers({ articles, title = "深入阅读" }: { articles: EditorialArticleSummary[]; title?: string }) {
  if (!articles.length) return null;
  return <section className="editorial-teasers" aria-label={title}><h2>{title}</h2><div>{articles.map(article => <article key={article.id}><span className="article-series">{ARTICLE_GENRES[article.genre]}</span><h3><HierarchyLink href={article.url}>{article.title}</HierarchyLink></h3><p>{article.summary}</p>{article.app && <p className="app-teaser-facts">{article.app.platforms.join(" · ")} · {article.app.experience === "tested" ? "实际体验" : "资料介绍"}</p>}<time dateTime={article.date}>{article.date}</time></article>)}</div></section>;
}
