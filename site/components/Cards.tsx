import Link from "next/link";
import SourceImage from "./SourceImage";
import { dailyUrl, entryUrl, topicLabel } from "../lib/catalog";
import type { Daily, Entry } from "../lib/types";

export function TopicLinks({ topics }: { topics: string[] }) {
  return <div className="topic-links">{topics.map((t) => <Link key={t} href={`/topics/${t}/`}>{topicLabel(t)}</Link>)}</div>;
}
export function DailyCard({ daily }: { daily: Daily }) {
  return <article className={`daily-card${daily.image ? "" : " text-only"}`}>
    {daily.image && <Link className="card-image" href={dailyUrl(daily.date)} aria-label={`阅读 ${daily.date} 日报`}><SourceImage image={daily.image} sizes="(max-width: 639px) 100vw, (max-width: 1023px) 45vw, 370px" /></Link>}
    <div><h2><Link href={dailyUrl(daily.date)}>{daily.headline}</Link></h2><p className="excerpt">{daily.summary}</p>
      <div className="card-meta"><time dateTime={daily.date}>{daily.date}</time><span>{daily.readingMinutes} 分钟阅读</span></div>
    </div>
  </article>;
}
export function EntryCard({ entry, compact = false }: { entry: Entry; compact?: boolean }) {
  return <article className={`entry-card ${compact ? "compact" : ""}`}>
    {entry.image && <Link className="entry-image" href={entryUrl(entry)} aria-label={`阅读 ${entry.title}`}><SourceImage image={entry.image} sizes="(max-width: 639px) 100px, 180px" /></Link>}
    <div><p className="eyebrow"><time dateTime={entry.date}>{entry.date}</time></p><h2><Link href={entryUrl(entry)}>{entry.title}</Link></h2><p className="excerpt">{entry.summary}</p>
      {!compact && <><TopicLinks topics={entry.topics} /><div className="entry-actions"><Link href={entryUrl(entry)}>阅读全文</Link><a href={entry.source} target="_blank" rel="noopener noreferrer">{entry.kind === "paper" ? "论文" : "项目来源"}</a></div></>}
    </div>
  </article>;
}
