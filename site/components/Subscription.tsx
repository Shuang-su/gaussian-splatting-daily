import Link from "next/link";
export default function Subscription() {
  return <section className="article-subscribe" aria-label="订阅高斯日报"><div><h2>订阅高斯日报</h2><p>每日简报 · 每周汇总</p></div><Link href="/subscribe/">选择订阅 <span aria-hidden="true">→</span></Link></section>;
}
