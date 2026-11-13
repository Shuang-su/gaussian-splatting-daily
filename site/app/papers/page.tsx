import { SITE_URL } from "../../lib/catalog";
import { loadArchive } from "../../lib/content";
import Catalogue from "../../components/Catalogue";
export const metadata = { alternates: { canonical: `${SITE_URL}/papers/` }, title: "研究" };
export default async function Page() {
  const { index } = await loadArchive();
  const entries = index.entries.filter((e) => e.kind === "paper");
  return <Catalogue title="研究" description={`${entries.length} 条论文与研究进展`} entries={entries} articles={index.articles?.filter(article=>article.genre==="paper")} />;
}
