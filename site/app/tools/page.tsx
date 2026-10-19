import { loadArchive } from "../../lib/content";
import Catalogue from "../../components/Catalogue";
export const metadata = { title: "工具" };
export default async function Page() {
  const { index } = await loadArchive();
  const entries = index.entries.filter((e) => e.kind === "tool");
  return <Catalogue title="工具" description={`${entries.length} 条工具更新`} entries={entries} articles={index.articles?.filter(article=>article.genre==="tool")} />;
}
