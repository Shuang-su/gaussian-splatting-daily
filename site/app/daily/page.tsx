import { loadArchive } from "../../lib/content";
import { DailyCard } from "../../components/Cards";
export const metadata = { title: "日报归档" };
export default async function Page() {
  const { index } = await loadArchive();
  return (
    <div className="shell">
      <div className="page-heading">
        <p className="eyebrow">THE DAILY ARCHIVE</p>
        <h1>每天，记录一点进展。</h1>
        <p>
          完整中文日报与当日增量，保留原文、来源和纠错。共 {index.daily.length}{" "}
          期，更新至 {index.updatedThrough}。
        </p>
      </div>
      <div className="archive-grid">
        {index.daily.map((d) => (
          <DailyCard key={d.id} daily={d} />
        ))}
      </div>
    </div>
  );
}
