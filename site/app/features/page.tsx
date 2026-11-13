import { SITE_URL } from "../../lib/catalog";
import { loadArchive } from "../../lib/content";
import Catalogue from "../../components/Catalogue";
export const metadata = { alternates: { canonical: `${SITE_URL}/features/` }, title: "专题" };
export default async function Page() {
 const { index } = await loadArchive();
 return <Catalogue title="专题" description="把分散的进展放进完整的问题与背景中。" entries={[]} articles={index.articles?.filter(article => article.genre === "topic")}/>;
}
