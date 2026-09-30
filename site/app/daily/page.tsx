import { loadArchive } from "../../lib/content";
import { DailyCard } from "../../components/Cards";
export const metadata = { title: "日报" };
export default async function Page() {
  const { index } = await loadArchive();
  return <div className="archive-surface"><div className="shell"><div className="page-heading"><h1>日报</h1><p>{index.daily.length} 期 · 更新至 {index.updatedThrough}</p></div>
    <div className="archive-grid">{index.daily.map((d) => <DailyCard key={d.id} daily={d} />)}</div>
  </div></div>;
}
