import Link from "next/link";
import { loadArchive } from "../lib/content";
import { dailyUrl, entryUrl, TOPICS } from "../lib/catalog";
import SourceImage from "../components/SourceImage";
import { DailyCard, EntryCard } from "../components/Cards";
export default async function Home() {
  const { index } = await loadArchive();
  const latest = index.daily[0];
  const picks = latest.highlights;
  const papers = index.entries.filter((e) => e.kind === "paper").slice(0, 3);
  return (
    <div className="shell home">
      <section className="hero" aria-label="最新日报" data-latest-report={latest.date} data-source-sha256={latest.contentHash}>
        <aside className="date-card">
          <div className="calendar">
            <span>
              {latest.date.slice(0, 4)} / {latest.date.slice(5, 7)}
            </span>
            <strong>{latest.date.slice(8)}</strong>
          </div>
          <div className="date-intro">
            <p className="eyebrow">今日观察</p>
            <h2>从变化，看见方向</h2>
            <p>从研究进展到可运行项目，每天记录真实变化。</p>
          </div>
          {picks[3] && (
            <Link className="date-story" href={entryUrl(picks[3])}>
              <h3>{picks[3].title}</h3>
              <span>
                {picks[3].priority} · {picks[3].date} <b>→</b>
              </span>
            </Link>
          )}
        </aside>
        <article className="lead-story">
          <Link href={dailyUrl(latest.date)} aria-label="阅读最新完整日报">
            <SourceImage image={latest.image} />
          </Link>
          <h1>
            <Link href={dailyUrl(latest.date)}>{latest.headline}</Link>
          </h1>
          <div className="lead-meta">
            <time>{latest.date}</time>
            <Link href={dailyUrl(latest.date)}>阅读今日完整日报 ↗</Link>
          </div>
        </article>
        <aside className="hero-secondary">
          {picks.slice(1, 3).map((e) => (
            <article className="secondary-story" key={e.id}>
              <h2>
                <Link href={entryUrl(e)}>{e.title}</Link>
              </h2>
              <p>{e.summary}</p>
              {e.image && (
                <Link href={entryUrl(e)} aria-label={e.title}>
                  <SourceImage image={e.image} />
                </Link>
              )}
              <div>
                <time>{e.date}</time>
                <Link href={entryUrl(e)} aria-label={`阅读 ${e.title}`}>
                  →
                </Link>
              </div>
            </article>
          ))}
        </aside>
      </section>
      <section className="home-feed">
        <nav className="feed-nav" aria-label="内容分类">
          <Link className="selected" href="/daily/">
            最新日报
          </Link>
          <Link href="/papers/">论文研究</Link>
          <Link href="/tools/">工具动态</Link>
        </nav>
        <div className="daily-feed">
          {index.daily.slice(1, 4).map((d) => (
            <DailyCard key={d.id} daily={d} />
          ))}
          <Link className="more-link" href="/daily/">
            浏览全部 {index.daily.length} 期日报 →
          </Link>
        </div>
        <aside className="research-feed">
          <div className="section-label">
            <h2>研究论文</h2>
            <Link href="/papers/" aria-label="全部论文">
              →
            </Link>
          </div>
          {papers.map((e) => (
            <EntryCard entry={e} compact key={e.id} />
          ))}
        </aside>
      </section>
      <section className="explore">
        <h2>探索主题</h2>
        {TOPICS.map((t) => (
          <Link href={`/topics/${t.slug}/`} key={t.slug}>
            {t.label}
          </Link>
        ))}
      </section>
    </div>
  );
}
