import Search from "../../components/Search";
export const metadata = { title: "搜索" };
export default function Page() {
  return <div className="shell search-page"><div className="page-heading"><h1>搜索</h1></div><Search /></div>;
}
