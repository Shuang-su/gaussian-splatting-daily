import Link from "next/link";
import { notFound } from "next/navigation";
import { loadArchive } from "../../../lib/content";
import { dailyUrl, SITE_URL } from "../../../lib/catalog";
import ArticleBody from "../../../components/ArticleBody";
import ReadingNavigator from "../../../components/ReadingNavigator";
import ImageGallery from "../../../components/ImageGallery";
import BrandMark from "../../../components/BrandMark";
import { ARTICLE_GENRES } from "../../../components/ArticleTeasers";
export const dynamicParams = false;
type Params = Promise<{ slug: string }>;
export async function generateStaticParams() { return (await loadArchive()).editorials.map(article => ({ slug: article.slug })); }
export async function generateMetadata({ params }: { params: Params }) {
  const { slug } = await params, article = (await loadArchive()).editorials.find(article => article.slug === slug);
  return article ? { title: article.title, description: article.summary, alternates: { canonical: SITE_URL + article.url } } : {};
}
export default async function Page({ params }: { params: Params }) {
  const { slug } = await params, archive = await loadArchive(), article = archive.editorials.find(article => article.slug === slug);
  if (!article) notFound();
  return <ImageGallery images={article.images}><ReadingNavigator items={article.toc.filter(item=>item.depth===2).map(item=>({ id:item.id,title:item.title }))}/>
    <article id="article-top" className="article-shell article-longform" data-article-id={article.id}>
      <header className="article-header no-cover"><Link className="article-series" href={article.genre === "topic" ? "/topics/3dgs/" : `/${article.genre === "paper" ? "papers" : "tools"}/`}>{ARTICLE_GENRES[article.genre]}</Link><h1>{article.title}</h1><p className="article-deck">{article.summary}</p><div className="article-meta"><span className="author-byline"><BrandMark/>{article.author}</span><time dateTime={article.date}>{article.date}</time><span>{article.readingMinutes} 分钟阅读</span></div></header>
      <div className="article-layout"><ArticleBody html={article.html}/>
        <section className="longform-related"><h2>相关日报</h2>{article.related.map(link=>{const report=archive.articles.find(report=>report.date===link.date)!,event=report.events!.find(event=>event.id===link.event)!;return <p key={link.event}><Link href={`${dailyUrl(link.date)}#${event.anchor}`}>{link.date} · {event.title}</Link></p>;})}</section>
        <footer className="article-colophon"><h2>来源与说明</h2><ul>{article.sources.map(source=><li key={source.url}><a href={source.url} target="_blank" rel="noopener noreferrer">{source.title}</a></li>)}</ul><p className="editorial-disclosure">{article.disclosure}</p></footer>
      </div>
    </article>
  </ImageGallery>;
}
