import Link from "next/link";
import { loadArchive } from "../../lib/content";
import { TOPICS } from "../../lib/catalog";
export const metadata = { title: "探索主题" };
export default async function Page() {
  const { index } = await loadArchive();
  return (
    <div className="shell">
      <div className="page-heading">
        <p className="eyebrow">FOLLOW THE THREAD</p>
        <h1>沿着主题，继续探索。</h1>
        <p>连接不同日期的研究与实践，从一条线索追踪持续变化。</p>
      </div>
      <div className="topics-grid">
        {TOPICS.map((t) => (
          <Link href={`/topics/${t.slug}/`} key={t.slug}>
            <h2>{t.label}</h2>
            <p>
              {index.daily.filter((d) => d.topics.includes(t.slug)).length}{" "}
              期日报 ·{" "}
              {index.entries.filter((e) => e.topics.includes(t.slug)).length}{" "}
              条研究与项目
            </p>
            <span>探索 →</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
