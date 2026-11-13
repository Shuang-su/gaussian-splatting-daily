import type { Metadata } from "next";
import { BASE, REPO } from "../lib/catalog";
import { loadArchive } from "../lib/content";
import { loadReadLaterCatalogue } from "../lib/read-later-catalogue";
import "./globals.css";
import "./home.css";
import "./card-navigation.css";
import "./editorial.css";
import "./reader.css";
import "./read-later.css";
import "./glass.css";
import "./reader-chrome.css";
import "./reading-hierarchy.css";
import "./reading-experience.css";
import ReaderProvider from "../components/ReaderProvider";
import DiscussionProvider from "../components/DiscussionProvider";
import GlassChrome from "../components/GlassChrome";
import CardNavigation from "../components/CardNavigation";
import ReadingHierarchy from "../components/ReadingHierarchy";
import ReadingExperience from "../components/ReadingExperience";
import Header from "../components/Header";
import BrandMark from "../components/BrandMark";
import { FEEDS } from "../lib/feeds";
export const metadata: Metadata = {
  metadataBase: new URL("https://metaflow.shuang-su.com"),
  title: { default: "metaflow horizon", template: "%s · metaflow horizon" },
  description: "高斯、空间 AI 与三维创作的新闻、研究、应用和作品。",
  icons: { icon: `${BASE}/icon.svg` },
  openGraph: { siteName: "metaflow horizon", locale: "zh_CN", type: "website", images: [{ url: `${BASE}/share/default.png`, width: 1200, height: 630, alt: "metaflow horizon" }] },
  twitter: { card: "summary_large_image" },
};
export default async function Layout({ children }: { children: React.ReactNode }) {
  const [{ index }, catalogue] = await Promise.all([loadArchive(), loadReadLaterCatalogue()]);
  return <html lang="zh-CN" suppressHydrationWarning>
    <head>{Object.values(FEEDS).map(feed => <link key={feed.path} rel="alternate" type="application/rss+xml" title={`metaflow horizon · ${feed.title}`} href={feed.url} />)}<script dangerouslySetInnerHTML={{ __html: "try{const t=localStorage.getItem('gsd-theme');document.documentElement.dataset.theme=['system','light','dark'].includes(t)?t:'system'}catch{}" }} /></head>
    <body><DiscussionProvider><ReaderProvider catalogue={catalogue}><CardNavigation><a className="skip-link" href="#main">跳至内容</a><GlassChrome><Header /></GlassChrome><ReadingExperience/><ReadingHierarchy articles={index.articles ?? []}><main id="main">{children}</main></ReadingHierarchy>
      <footer className="site-footer"><a className="footer-brand" href={`${BASE}/`}><BrandMark />metaflow horizon</a><div><a href={`${BASE}/subscribe/`}>订阅 metaflow horizon</a><a href={`${REPO}/blob/main/docs/corrections.md`}>纠错记录</a><a href={REPO}>GitHub</a></div></footer>
    </CardNavigation></ReaderProvider></DiscussionProvider></body>
  </html>;
}
