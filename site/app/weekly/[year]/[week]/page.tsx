import Link from "next/link";
import { notFound } from "next/navigation";
import { loadArchive } from "../../../../lib/content";
import { entryUrl, dailyUrl, SITE_URL } from "../../../../lib/catalog";
import { buildWeekly, coverageLabel, weeklyTitle, weeklyUrl } from "../../../../lib/feeds";
import Subscription from "../../../../components/Subscription";
export const dynamicParams = false;
type RouteParams = Promise<{ year: string; week: string }>;
export async function generateStaticParams() {
  return buildWeekly((await loadArchive()).index.daily).map(week => ({ year: String(week.year), week: String(week.week).padStart(2,"0") }));
}
async function digest(params: RouteParams) {
  const p = await params;
  return buildWeekly((await loadArchive()).index.daily).find(week => String(week.year) === p.year && String(week.week).padStart(2,"0") === p.week);
}
export async function generateMetadata({ params }: { params: RouteParams }) {
  const week = await digest(params);
  return week ? { title: weeklyTitle(week), description: coverageLabel(week), alternates: { canonical: SITE_URL + weeklyUrl(week) } } : {};
}
export default async function Page({ params }: { params: RouteParams }) {
  const week = await digest(params);
  if (!week) notFound();
  return <article className="weekly-shell" data-weekly-id={week.id} data-report-count={week.reports.length}><header className="page-heading"><Link className="article-series" href="/subscribe/">每周汇总</Link><h1>{weeklyTitle(week)}</h1><p>{coverageLabel(week)}</p><p className="week-period">自然周：{week.startDate} — {week.endDate}</p></header><section className="weekly-reports"><h2>本周日报</h2>{week.reports.map(report => <article key={report.id}><time dateTime={report.date}>{report.date}</time><h3><Link href={dailyUrl(report.date)}>{report.headline}</Link></h3><p>{report.summary}</p><Link className="weekly-read" href={dailyUrl(report.date)}>阅读全文 <span aria-hidden="true">→</span></Link></article>)}</section>{week.highlights.length > 0 && <section className="weekly-highlights"><h2>本周事件</h2><ol>{week.highlights.map(entry => <li key={entry.id}><time dateTime={entry.date}>{entry.date}</time><h3><Link href={entryUrl(entry)}>{entry.title}</Link></h3><p>{entry.summary}</p><div><Link href={entryUrl(entry)}>日报正文</Link><a href={entry.source} target="_blank" rel="noopener noreferrer">来源 ↗</a></div></li>)}</ol></section>}<Subscription /><div className="article-end"><Link href="/daily/">全部日报</Link></div></article>;
}
