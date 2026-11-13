import Link from "next/link";
export default function Page() {
  return <div className="shell page-heading"><p className="eyebrow">404</p><h1>页面不存在</h1><Link href="/daily/">查看日报</Link></div>;
}
