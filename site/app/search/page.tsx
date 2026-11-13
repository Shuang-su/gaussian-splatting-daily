import { SITE_URL } from "../../lib/catalog";
import Search from "../../components/Search";
export const metadata = { alternates: { canonical: `${SITE_URL}/search/` }, title: "搜索" };
export default function Page() {
  return <div className="shell search-page"><h1 className="search-visually-hidden">搜索</h1><Search /></div>;
}
