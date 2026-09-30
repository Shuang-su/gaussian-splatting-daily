import Link from "next/link";
export default function Page() {
  return (
    <div className="shell page-heading">
      <p className="eyebrow">404</p>
      <h1>这一页，还没有记录。</h1>
      <p>前往日报归档，或搜索你感兴趣的研究与项目。</p>
      <Link href="/daily/">浏览日报 →</Link>
    </div>
  );
}
