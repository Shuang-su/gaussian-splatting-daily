import { loadArchive } from "../../lib/content";
import Catalogue from "../../components/Catalogue";
export const metadata = { title: "论文" };
export default async function Page() {
  const { index } = await loadArchive();
  const entries = index.entries.filter((e) => e.kind === "paper");
  return <Catalogue title="论文" description={`${entries.length} 篇论文`} entries={entries} articles={index.articles?.filter(article=>article.genre==="paper")} />;
}
