import Link from "next/link";
import { loadArchive } from "../lib/content";
import { dailyUrl, entryUrl, TOPICS } from "../lib/catalog";
import SourceImage from "../components/SourceImage";
import HomeFeed from "../components/HomeFeed";
import Icon from "../components/Icon";

export default async function Home() {
  const { index } = await loadArchive();
  const latest = index.daily[0];
  const weekday = ["周日","周一","周二","周三","周四","周五","周六"][new Date(`${latest.date}T12:00:00+08:00`).getUTCDay()];
  const feeds = {
    daily: index.daily.slice(1).map(d => ({ id:d.id, title:d.headline, summary:d.summary, date:d.date, url:dailyUrl(d.date), image:d.image })),
    paper: index.entries.filter(e => e.kind === "paper").map(e => ({ id:e.id, title:e.title, summary:e.summary, date:e.date, url:entryUrl(e), image:e.image })),
    tool: index.entries.filter(e => e.kind === "tool").map(e => ({ id:e.id, title:e.title, summary:e.summary, date:e.date, url:entryUrl(e), image:e.image })),
  };
  return <div className="shell home">
    <section className="hero" aria-label="最新日报" data-latest-report={latest.date} data-source-sha256={latest.contentHash}>
      <article className={`lead-story${latest.image ? "" : " lead-text-only"}`}>
        <div className="lead-copy">
          <p className="lead-kicker"><span>日报</span><time dateTime={latest.date}>{latest.date}</time></p>
          <h1><Link href={dailyUrl(latest.date)}>{latest.headline}</Link></h1>
          <p className="lead-summary">{latest.summary}</p>
          <div className="lead-meta"><span>{latest.readingMinutes} 分钟阅读</span><Link href={dailyUrl(latest.date)}>阅读全文 <Icon name="arrow" /></Link></div>
          {latest.image && <p className="mobile-lead-credit"><a href={latest.image.source} target="_blank" rel="noopener noreferrer">{latest.image.credit}</a></p>}
        </div>
        {latest.image && <div className="lead-visual"><div className="lead-image"><SourceImage image={latest.image} href={dailyUrl(latest.date)} label={`阅读 ${latest.date} 日报`} priority sizes="(max-width: 767px) calc(100vw - 32px), (max-width: 1199px) 46vw, 460px" /></div><div className="lead-date" aria-hidden="true"><span>{weekday}</span><strong>{latest.date.slice(8)}</strong></div><p className="lead-credit"><a href={latest.image.source} target="_blank" rel="noopener noreferrer">{latest.image.credit}</a></p></div>}
      </article>
      <aside className="hero-secondary" aria-label="当期新闻">
        {latest.highlights.slice(2, 4).map(e => <article className="secondary-story" key={e.id}><p className="eyebrow">{e.kind === "tool" ? "工具" : "动态"}</p><h2><Link href={entryUrl(e)}>{e.title}</Link></h2><p className="secondary-summary">{e.summary}</p><Link className="secondary-read" href={entryUrl(e)}>阅读全文 <Icon name="arrow" /></Link></article>)}
      </aside>
    </section>
    <div className="home-content">
      <HomeFeed feeds={feeds} />
      <aside className="home-sidebar"><section><h2>主题</h2><div className="sidebar-topics">{TOPICS.map(t => <Link key={t.slug} href={`/topics/${t.slug}/`}>{t.label}</Link>)}</div></section><section className="sidebar-subscribe"><h2>订阅高斯日报</h2><Link href="/subscribe/">每日简报 <Icon name="arrow" /></Link><Link href="/subscribe/">每周汇总 <Icon name="arrow" /></Link></section></aside>
    </div>
  </div>;
}
