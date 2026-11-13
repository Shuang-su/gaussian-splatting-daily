import HierarchyLink from "../../components/HierarchyLink";
import { loadArchive } from "../../lib/content";
import { TOPICS } from "../../lib/catalog";
export const metadata = { title: "主题" };
export default async function Page() {
  const { index } = await loadArchive();
  return (
    <div className="shell">
      <div className="page-heading">
        <h1>主题</h1>
      </div>
      <div className="topics-grid">
        {TOPICS.map((t) => (
          <HierarchyLink href={`/topics/${t.slug}/`} key={t.slug}>
            <h2>{t.label}</h2>
            <p>
              {index.daily.filter((d) => d.topics.includes(t.slug)).length}{" "}
              期日报 ·{" "}
              {index.entries.filter((e) => e.topics.includes(t.slug)).length}{" "}
              条内容
            </p>
            <span>查看</span>
          </HierarchyLink>
        ))}
      </div>
    </div>
  );
}
