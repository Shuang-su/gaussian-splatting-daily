import Link from "./ArticleLink";
import SourceImage from "./SourceImage";
import { dailyUrl, entryUrl, topicLabel } from "../lib/catalog";
import { calendarDate } from "../lib/home";
import type { Daily, Entry } from "../lib/types";

export function TopicLinks({ topics }: { topics: string[] }) {
  return <div className="topic-links">{topics.map((t) => <Link key={t} href={`/topics/${t}/`}>{topicLabel(t)}</Link>)}</div>;
}
export function DailyCard({ daily }: { daily: Daily }) {
  const date = calendarDate(daily.date);
  return <article data-article-origin={`archive:${daily.id}`} className={`daily-card${daily.image ? "" : " text-only"}`}>
    {daily.image && <div className="card-image"><SourceImage image={daily.image} href={dailyUrl(daily.date)} label={`阅读 ${daily.date} 日报`} sizes="(max-width: 639px) 100vw, (max-width: 1023px) 45vw, 370px" /></div>}
    <div className="daily-card-copy">
      <div className="daily-card-date" aria-hidden="true"><span>{date.weekday}</span><strong>{date.day}</strong></div>
      <h2><Link href={dailyUrl(daily.date)}>{daily.headline}</Link></h2><p className="excerpt">{daily.summary}</p>
      <div className="card-meta"><time dateTime={daily.date}>{daily.date}</time><span>{daily.readingMinutes} 分钟阅读</span></div>
    </div>
  </article>;
}
export function EntryCard({ entry, compact = false }: { entry: Entry; compact?: boolean }) {
  return <article data-article-origin={`entry:${entry.id}`} className={`entry-card ${compact ? "compact" : ""}`}>
    {entry.image && <div className="entry-image"><SourceImage image={entry.image} href={entryUrl(entry)} label={`阅读 ${entry.title}`} sizes="(max-width: 639px) 100px, 180px" /></div>}
    <div><p className="eyebrow"><time dateTime={entry.date}>{entry.date}</time></p><h2><Link href={entryUrl(entry)}>{entry.title}</Link></h2><p className="excerpt">{entry.summary}</p>
      {!compact && <><TopicLinks topics={entry.topics} /><div className="entry-actions"><Link href={entryUrl(entry)}>阅读全文</Link><a href={entry.source} target="_blank" rel="noopener noreferrer">{entry.kind === "paper" ? "论文" : "项目来源"}</a></div></>}
    </div>
  </article>;
}
