import { loadArchive } from "../../lib/content";
import Catalogue from "../../components/Catalogue";
export const metadata = { title: "论文研究" };
export default async function Page() {
  const { index } = await loadArchive();
  return (
    <Catalogue
      title="从论文，到下一步。"
      description="以稳定的 arXiv 标识归档研究，阅读当日判断、可运行程度与实际影响。"
      entries={index.entries.filter((e) => e.kind === "paper")}
    />
  );
}
