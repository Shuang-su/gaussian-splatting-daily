import Search from "../../components/Search";
export const metadata = { title: "搜索" };
export default function Page() {
  return (
    <div className="shell search-page">
      <div className="page-heading">
        <p className="eyebrow">FIND YOUR NEXT IDEA</p>
        <h1>从一个关键词开始。</h1>
        <p>搜索日报全文、研究论文与工具更新。</p>
      </div>
      <Search />
    </div>
  );
}
