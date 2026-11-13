import { SITE_URL } from "../../lib/catalog";
import { loadArchive } from "../../lib/content";
import Catalogue from "../../components/Catalogue";
export const metadata = { alternates: { canonical: `${SITE_URL}/articles/` }, title: "文章" };
export default async function Page() {
 const { index } = await loadArchive();
 return <Catalogue title="文章" description="工具解读、教程、作品与行业观察。" entries={[]} articles={index.articles?.filter(article => true)}/>;
}
