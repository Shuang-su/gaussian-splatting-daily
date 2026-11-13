import { SITE_URL } from "../../lib/catalog";
import { loadArchive } from "../../lib/content";
import Catalogue from "../../components/Catalogue";
export const metadata = { alternates: { canonical: `${SITE_URL}/apps/` }, title: "应用" };
export default async function Page() {
 const { index } = await loadArchive();
 return <Catalogue title="应用" description="扫描、重建、空间体验与创作工具。资料介绍和实际体验分别标注。" entries={[]} articles={index.articles?.filter(article => article.genre === "app")}/>;
}
