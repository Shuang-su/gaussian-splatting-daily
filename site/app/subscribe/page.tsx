import Link from "next/link";
import FeedOptions from "../../components/FeedOptions";
import { loadArchive } from "../../lib/content";
import { buildWeekly, coverageLabel, weeklyTitle, weeklyUrl } from "../../lib/feeds";
import { SITE_URL } from "../../lib/catalog";
export const metadata = { title: "订阅 horizon", description: "通过 RSS 接收每日简报或每周汇总。", alternates: { canonical: `${SITE_URL}/subscribe/` } };
export default async function Page() {
  const archive = await loadArchive();
  const weeks = archive.weeks.slice(0,5);
  return <div className="shell subscribe-page"><header className="page-heading"><h1>订阅 horizon</h1><p>选择日报、周报或文章与应用，将链接添加到你的 RSS 阅读器。</p></header><FeedOptions />{weeks.length > 0 && <section className="recent-weeks"><h2>近期周汇总</h2>{weeks.map(week => <Link key={week.id} href={weeklyUrl(week)}><strong>{weeklyTitle(week)}</strong><span>{coverageLabel(week)}</span><span aria-hidden="true">→</span></Link>)}</section>}</div>;
}
