import Link from "next/link";
import { loadArchive } from "../lib/content";
import { dailyUrl, entryUrl, TOPICS } from "../lib/catalog";
import SourceImage from "../components/SourceImage";
import { DailyCard, EntryCard } from "../components/Cards";
import Icon from "../components/Icon";

export default async function Home() {
  const { index } = await loadArchive();
  const latest = index.daily[0];
  const papers = index.entries.filter((e) => e.kind === "paper").slice(0, 3);
  const tools = index.entries.filter((e) => e.kind === "tool").slice(0, 3);
  return <div className="shell home">
    <section className="hero" aria-label="最新日报" data-latest-report={latest.date} data-source-sha256={latest.contentHash}>
      <article className="lead-story">
        {latest.image && <Link href={dailyUrl(latest.date)} className="lead-image" aria-label={`阅读 ${latest.date} 日报`}><SourceImage image={latest.image} priority /></Link>}
        <h1><Link href={dailyUrl(latest.date)}>{latest.headline}</Link></h1>
        <p className="lead-summary">{latest.summary}</p>
        <div className="lead-meta"><time dateTime={latest.date}>{latest.date}</time><Link href={dailyUrl(latest.date)}>阅读全文 <Icon name="arrow" /></Link></div>
      </article>
      <aside className="hero-secondary" aria-label="当期新闻">
        {latest.highlights.slice(1, 4).map((e) => <article className="secondary-story" key={e.id}>
          <div><h2><Link href={entryUrl(e)}>{e.title}</Link></h2><p>{e.summary}</p><time dateTime={e.date}>{e.date}</time></div>
          {e.image && <Link href={entryUrl(e)} className="secondary-image" aria-label={`阅读 ${e.title}`}><SourceImage image={e.image} sizes="120px" /></Link>}
        </article>)}
      </aside>
    </section>
    <section className="home-daily">
      <div className="section-heading"><h2>往期日报</h2><Link href="/daily/">全部日报 <Icon name="arrow" /></Link></div>
      <div className="archive-grid">{index.daily.slice(1, 4).map((d) => <DailyCard key={d.id} daily={d} />)}</div>
    </section>
    <div className="home-catalogues">
      <section><div className="section-heading"><h2>论文</h2><Link href="/papers/">全部论文 <Icon name="arrow" /></Link></div>{papers.map((e) => <EntryCard entry={e} compact key={e.id} />)}</section>
      <section><div className="section-heading"><h2>工具</h2><Link href="/tools/">全部工具 <Icon name="arrow" /></Link></div>{tools.map((e) => <EntryCard entry={e} compact key={e.id} />)}</section>
    </div>
    <section className="explore"><h2>主题</h2><div>{TOPICS.map((t) => <Link href={`/topics/${t.slug}/`} key={t.slug}>{t.label}</Link>)}</div></section>
  </div>;
}
