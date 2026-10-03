import Link from "next/link";
import { notFound } from "next/navigation";
import { loadArchive } from "../../../../../lib/content";
import { BASE, dailyUrl, REPO } from "../../../../../lib/catalog";
import { imageKey } from "../../../../../lib/images";
import SourceImage from "../../../../../components/SourceImage";
import ReadingGuide from "../../../../../components/ReadingGuide";
import ImageGallery from "../../../../../components/ImageGallery";
import ArticleBody from "../../../../../components/ArticleBody";
import { TopicLinks } from "../../../../../components/Cards";
import Subscription from "../../../../../components/Subscription";
import ArticleEvents from "../../../../../components/ArticleEvents";
import Discussion from "../../../../../components/Discussion";
import PastDaily from "../../../../../components/PastDaily";
import { weekPicks } from "../../../../../lib/week-picks";
import { entryUrl } from "../../../../../lib/catalog";
export const dynamicParams = false;
type RouteParams = Promise<{ year: string; month: string; day: string }>;
export async function generateStaticParams() {
  return (await loadArchive()).articles.map((a) => ({ year: a.date.slice(0,4), month: a.date.slice(5,7), day: a.date.slice(8) }));
}
export async function generateMetadata({ params }: { params: RouteParams }) {
  const p = await params;
  const a = (await loadArchive()).articles.find((a) => a.date === `${p.year}-${p.month}-${p.day}`);
  if (!a) return {};
  return { title: a.headline, description: a.summary, alternates: { canonical: `https://shuang-su.github.io${BASE}${dailyUrl(a.date)}` }, openGraph: { title: a.headline, description: a.summary, type: "article", images: [{ url: `${BASE}/share/${a.date}.png`, width: 1200, height: 630, alt: a.headline }] } };
}
export default async function Page({ params }: { params: RouteParams }) {
  const p = await params;
  const { articles } = await loadArchive();
  const a = articles.find((a) => a.date === `${p.year}-${p.month}-${p.day}`);
  if (!a) notFound();
  const orderedImages = a.events ? a.events.flatMap(event=>[...a.images.filter(image=>event.html.includes(imageKey(image))),...event.images || []]) : a.images;
  const images = [...new Map([...(a.image ? [a.image] : []), ...orderedImages, ...a.images].map((img) => [imageKey(img), img])).values()];
  const related = articles.filter((d) => d.date < a.date).slice(0,5);
  const week = weekPicks(a, articles);
  const weekday = ["周日","周一","周二","周三","周四","周五","周六"][new Date(`${a.date}T12:00:00+08:00`).getUTCDay()];
  return <ImageGallery images={images}>
    <article className="article-shell" data-report-id={a.id} data-source-sha256={a.contentHash}>
      {a.image && <div className="article-cover"><SourceImage image={a.image} caption priority sizes="(max-width: 639px) 100vw, 768px" /><div className="article-date" aria-hidden="true"><span>{weekday}</span><strong>{a.date.slice(8)}</strong></div></div>}
      <header className={`article-header${a.image ? "" : " no-cover"}`}>
        <Link className="article-series" href="/daily/">日报</Link><h1>{a.headline}</h1><p className="article-deck">{a.summary}</p>
        <div className="article-meta"><time dateTime={a.date}>{a.date}</time><span>{a.readingMinutes} 分钟阅读</span></div>
      </header>
      <div className="article-layout">
        <ReadingGuide article={a} hasWeek={week.length > 0} />
        {!a.events && a.introductionHtml && <ArticleBody html={a.introductionHtml} />}
        {a.events ? <ArticleEvents article={a} /> : <ArticleBody html={a.bodyHtml} />}
        {week.length > 0 && <section className="this-week" id="this-week"><h2>本周重要内容</h2><ul>{week.map(e=><li key={e.id}><Link href={entryUrl(e)}>{e.title}</Link><p>{e.summary}</p><time dateTime={e.date}>{e.date}</time></li>)}</ul></section>}
        <div className="article-topics"><TopicLinks topics={a.topics} /></div>
        <section className="article-sources" id="sources"><h2>来源与纠错</h2>
          <div><a href={`${REPO}/blob/main/${a.path}`}>GitHub 原文</a><a href={`${REPO}/blob/main/docs/corrections.md`}>纠错记录</a><a href={`${REPO}/issues/new?template=correction.yml`}>提交纠错</a></div>
          {a.unresolvedSources > 0 && <p className="source-notice">本期有 {a.unresolvedSources} 处来源引用待补充。<a href={`${REPO}/blob/main/docs/history-audit.md`}>来源记录</a></p>}
          <details><summary>归档说明</summary><div className="archive-links">{a.issue && <a href={`${REPO}/issues/${a.issue}`}>Issue #{a.issue}</a>}{a.prs.map((n) => <a key={n} href={`${REPO}/pull/${n}`}>PR #{n}</a>)}</div>{a.archiveHtml && <ArticleBody html={a.archiveHtml} />}</details>
        </section>
        <section className="issue-discussion" id="discussion"><h2>本期讨论</h2><Discussion dailyId={a.id} date={a.date}/></section>
        <div className="article-end"><Link href="/daily/">全部日报</Link></div>
      </div>
    </article>
    <PastDaily reports={related}/>
    <div className="article-subscription-wrap"><Subscription /></div>
  </ImageGallery>;
}
