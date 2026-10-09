import Link from "next/link";
import { loadArchive } from "../lib/content";
import { TOPICS } from "../lib/catalog";
import { buildHome } from "../lib/home";
import HomeCarousel from "../components/HomeCarousel";
import HomeFeed from "../components/HomeFeed";
import Icon from "../components/Icon";

export default async function Home() {
  const { index } = await loadArchive();
  const { slides, feeds, related } = buildHome(index);
  return <div className="home" data-latest-report={slides[0]?.date} data-source-sha256={slides[0]?.contentHash}>
    <HomeCarousel slides={slides} />
    <HomeFeed feeds={feeds} sidebar={<aside key="related-content" className="home-sidebar" aria-label="相关内容">
      <section><h2>近期动态</h2><div className="home-related">{related.map((item) =>
        <article key={item.id}><h3><Link href={item.url}>{item.title}</Link></h3><p>{item.sourceLabel}</p></article>,
      )}</div></section>
      <section className="home-sidebar-topics"><h2>主题</h2><div className="sidebar-topics">{TOPICS.map((t) =>
        <Link key={t.slug} href={`/topics/${t.slug}/`}>{t.label}</Link>,
      )}</div></section>
      <section className="sidebar-subscribe"><h2>订阅高斯日报</h2><Link href="/subscribe/">订阅方式 <Icon name="arrow" /></Link></section>
    </aside>} />
  </div>;
}
