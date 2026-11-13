import Link from "next/link";
import { EntryCard } from "./Cards";
import { TOPICS } from "../lib/catalog";
import type { Entry } from "../lib/types";
import type { EditorialArticleSummary } from "../lib/types";
import ArticleTeasers from "./ArticleTeasers";
export default function Catalogue({ title, description, entries, articles = [] }: { title: string; description: string; entries: Entry[]; articles?: EditorialArticleSummary[] }) {
  return <div className="shell"><div className="page-heading"><h1>{title}</h1>{description && <p>{description}</p>}</div>
    <ArticleTeasers articles={articles}/><div className="catalogue-layout"><div className="catalogue-list">{entries.map((e) => <EntryCard entry={e} key={e.id} />)}{!entries.length && !articles.length && <p>暂无条目。</p>}</div>
      <aside className="catalogue-aside"><h2>主题</h2><div className="topic-links">{TOPICS.map((t) => <Link href={`/topics/${t.slug}/`} key={t.slug}>{t.label}</Link>)}</div><Link href="/search/">搜索</Link></aside>
    </div>
  </div>;
}
