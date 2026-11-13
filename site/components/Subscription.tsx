import Link from "next/link";
export default function Subscription() {
  return <section className="article-subscribe" aria-label="订阅 horizon"><div><h2>订阅 horizon</h2><p>日报 · 周报 · 文章与应用</p></div><Link href="/subscribe/">选择订阅 <span aria-hidden="true">→</span></Link></section>;
}
