import Link from "next/link";
import { notFound } from "next/navigation";
import { loadArchive } from "../../../../lib/content";
import { entryUrl, dailyUrl, SITE_URL } from "../../../../lib/catalog";
import { coverageLabel, weeklyTitle, weeklyUrl } from "../../../../lib/feeds";
import Subscription from "../../../../components/Subscription";
import ArticleBody from "../../../../components/ArticleBody";
export const dynamicParams = false;
type RouteParams = Promise<{ year: string; week: string }>;
export async function generateStaticParams() {
  return (await loadArchive()).weeks.map(week => ({ year: String(week.year), week: String(week.week).padStart(2,"0") }));
}
async function digest(params: RouteParams) {
  const p = await params, archive = await loadArchive();
  const week = archive.weeks.find(week => String(week.year) === p.year && String(week.week).padStart(2,"0") === p.week);
  return { week, editorial: archive.weeklyEditorials.find(item => item.id === week?.id) };
}
export async function generateMetadata({ params }: { params: RouteParams }) {
  const { week, editorial } = await digest(params);
  return week ? { title: editorial?.headline || weeklyTitle(week), description: editorial?.summary || coverageLabel(week), alternates: { canonical: SITE_URL + weeklyUrl(week) } } : {};
}
export default async function Page({ params }: { params: RouteParams }) {
  const { week, editorial } = await digest(params);
  if (!week) notFound();
  return <article className="weekly-shell" data-weekly-id={week.id} data-report-count={week.reports.length}>
    <header className="page-heading"><Link className="article-series" href="/subscribe/">每周汇总 · 第 {week.week} 周</Link><h1>{editorial?.headline || weeklyTitle(week)}</h1>{editorial && <p>{editorial.summary}</p>}<p>{coverageLabel(week)}</p><p className="week-period">自然周：{week.startDate} — {week.endDate}{week.reports.length < 7 ? " · 本站仅有部分日期记录" : ""}</p></header>
    {editorial && <section className="weekly-editorial"><ArticleBody html={editorial.html}/><p className="editorial-disclosure">{editorial.disclosure}</p></section>}
    <section className="weekly-reports"><h2>本周日报</h2>{week.reports.map(report => <article key={report.id}><time dateTime={report.date}>{report.date}</time><h3><Link href={dailyUrl(report.date)}>{report.headline}</Link></h3><p>{report.summary}</p><Link className="weekly-read" href={dailyUrl(report.date)}>阅读全文 <span aria-hidden="true">→</span></Link></article>)}</section>
    {week.highlights.length > 0 && <details className="weekly-event-index"><summary>查看本周事件索引</summary><section className="weekly-highlights"><ol>{week.highlights.map(entry => <li key={entry.id}><time dateTime={entry.date}>{entry.date}</time><h3><Link href={entryUrl(entry)}>{entry.title}</Link></h3><p>{entry.summary}</p><div><Link href={entryUrl(entry)}>日报正文</Link><a href={entry.source} target="_blank" rel="noopener noreferrer">来源 ↗</a></div></li>)}</ol></section></details>}
    <Subscription /><div className="article-end"><Link href="/daily/">全部日报</Link></div>
  </article>;
}
