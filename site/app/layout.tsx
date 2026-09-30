import type { Metadata } from "next";
import { BASE, REPO } from "../lib/catalog";
import "./globals.css";
import Header from "../components/Header";
import BrandMark from "../components/BrandMark";
export const metadata: Metadata = {
  metadataBase: new URL("https://shuang-su.github.io"),
  title: { default: "高斯日报", template: "%s · 高斯日报" },
  description: "3DGS、4DGS 与辐射场相关的论文、工具和技术动态。",
  icons: { icon: `${BASE}/icon.svg` },
  openGraph: { siteName: "高斯日报", locale: "zh_CN", type: "website", images: [{ url: `${BASE}/share/default.png`, width: 1200, height: 630, alt: "高斯日报" }] },
  twitter: { card: "summary_large_image" },
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return <html lang="zh-CN" data-scroll-behavior="smooth" suppressHydrationWarning>
    <head><script dangerouslySetInnerHTML={{ __html: "try{const t=localStorage.getItem('gsd-theme');document.documentElement.dataset.theme=['system','light','dark'].includes(t)?t:'system'}catch{}" }} /></head>
    <body><a className="skip-link" href="#main">跳至内容</a><Header /><main id="main">{children}</main>
      <footer className="site-footer"><a className="footer-brand" href={`${BASE}/`}><BrandMark />高斯日报</a><div><a href={`${REPO}/blob/main/docs/corrections.md`}>纠错记录</a><a href={REPO}>GitHub</a></div></footer>
    </body>
  </html>;
}
