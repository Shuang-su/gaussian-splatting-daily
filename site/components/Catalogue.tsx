import Link from "next/link";
import { EntryCard } from "./Cards";
import { TOPICS } from "../lib/catalog";
import type { Entry } from "../lib/types";
export default function Catalogue({
  title,
  description,
  entries,
}: {
  title: string;
  description: string;
  entries: Entry[];
}) {
  return (
    <div className="shell">
      <div className="page-heading">
        <p className="eyebrow">RESEARCH & PRACTICE</p>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      <div className="catalogue-layout">
        <div className="catalogue-list">
          {entries.map((e) => (
            <EntryCard entry={e} key={e.id} />
          ))}
          {!entries.length && (
            <p>此主题尚无独立条目，可在日报全文中搜索相关内容。</p>
          )}
        </div>
        <aside className="catalogue-aside">
          <h2>按主题发现</h2>
          <div className="topic-links">
            {TOPICS.map((t) => (
              <Link href={`/topics/${t.slug}/`} key={t.slug}>
                {t.label}
              </Link>
            ))}
          </div>
          <p>
            每条记录指向首次归档的日报分析与第一手来源。项目更新按仓库、Release
            或 PR 标识归档。
          </p>
          <Link href="/search/">搜索完整日报 →</Link>
        </aside>
      </div>
    </div>
  );
}
