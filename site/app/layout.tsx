import type { Metadata } from "next";
import { BASE, REPO } from "../lib/catalog";
import "./globals.css";
import Header from "../components/Header";
export const metadata: Metadata = {
  metadataBase: new URL(`https://shuang-su.github.io${BASE}/`),
  title: {
    default: "高斯日报 · Gaussian Splatting Daily",
    template: "%s · 高斯日报",
  },
  description:
    "关注高斯泼溅与辐射场的研究、工具与实际应用。完整中文日报、论文索引和第一手来源。",
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" data-scroll-behavior="smooth" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html:
              "try{document.documentElement.dataset.theme=localStorage.getItem('gsd-theme')||'system'}catch{}",
          }}
        />
      </head>
      <body>
        <a className="skip-link" href="#main">
          跳至内容
        </a>
        <Header />
        <main id="main">{children}</main>
        <footer className="site-footer">
          <p>
            高斯日报 <span>·</span> 关注高斯泼溅与辐射场的研究与应用
          </p>
          <div>
            <a href={`${REPO}/blob/main/docs/corrections.md`}>纠错记录</a>
            <a href={`${REPO}/blob/main/docs/history-audit.md`}>归档核验</a>
            <a href={REPO}>GitHub ↗</a>
          </div>
          <small>
            内容来自公开研究与项目；图片归属原论文作者或项目，证据与可运行程度以正文说明为准。
          </small>
        </footer>
      </body>
    </html>
  );
}
