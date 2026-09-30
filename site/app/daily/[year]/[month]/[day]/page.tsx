import Link from "next/link";
import { notFound } from "next/navigation";
import { loadArchive } from "../../../../../lib/content";
import { REPO } from "../../../../../lib/catalog";
import SourceImage from "../../../../../components/SourceImage";
import ReadingGuide from "../../../../../components/ReadingGuide";
import ImageGallery from "../../../../../components/ImageGallery";
import ArticleBody from "../../../../../components/ArticleBody";
import { TopicLinks } from "../../../../../components/Cards";
export const dynamicParams = false;
export async function generateStaticParams() {
  return (await loadArchive()).articles.map((a) => ({
    year: a.date.slice(0, 4),
    month: a.date.slice(5, 7),
    day: a.date.slice(8),
  }));
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ year: string; month: string; day: string }>;
}) {
  const p = await params;
  const a = (await loadArchive()).articles.find(
    (a) => a.date === `${p.year}-${p.month}-${p.day}`,
  );
  return { title: a?.headline, description: a?.summary };
}
export default async function Page({
  params,
}: {
  params: Promise<{ year: string; month: string; day: string }>;
}) {
  const p = await params;
  const a = (await loadArchive()).articles.find(
    (a) => a.date === `${p.year}-${p.month}-${p.day}`,
  );
  if (!a) notFound();
  const images = [
    ...new Map(
      [...(a.image ? [a.image] : []), ...a.images].map((img) => [img.url, img]),
    ).values(),
  ];
  return (
    <ImageGallery images={images}>
      <div className="article-shell" data-report-id={a.id} data-source-sha256={a.contentHash}>
        <div className="article-cover">
          {a.image && <SourceImage image={a.image} caption />}
          <div className="article-date">
            <span>{a.date.slice(0, 7)}</span>
            <strong>{a.date.slice(8)}</strong>
          </div>
        </div>
        <header className="article-header">
          <Link className="eyebrow" href="/daily/">
            日报归档 / {a.date}
          </Link>
          <h1>{a.headline}</h1>
          <p className="article-deck">{a.summary}</p>
          <div className="article-meta">
            <time>{a.date}</time>
            <span>{a.readingMinutes} 分钟阅读</span>
            <span>{a.status === "corrected" ? "已记录纠错" : "完整日报"}</span>
          </div>
        </header>
        <div className="article-layout">
          <aside className="toc">
            <a href={`${REPO}/blob/main/${a.path}`}>GitHub 原文 ↗</a>
            {a.issue && (
              <a href={`${REPO}/issues/${a.issue}`}>追踪 Issue #{a.issue} ↗</a>
            )}
            {a.prs.map((n) => (
              <a key={n} href={`${REPO}/pull/${n}`}>
                归档 PR #{n} ↗
              </a>
            ))}
          </aside>
          <div>
            {a.unresolvedSources > 0 && (
              <div className="source-notice">
                本期保留 {a.unresolvedSources}{" "}
                处原聊天内部引用，已标为待复核；可恢复的公开链接与纠错见正文及
                <a href={`${REPO}/blob/main/docs/history-audit.md`}>核验记录</a>
                。
              </div>
            )}
            {a.readingGuide?.leadingHtml && (
              <ArticleBody html={a.readingGuide.leadingHtml} />
            )}
            <ReadingGuide article={a} />
            <ArticleBody html={a.readingGuide?.bodyHtml || a.html} />
            <div className="article-topics">
              <span>继续探索</span>
              <TopicLinks topics={a.topics} />
            </div>
            <div className="article-end">
              <p>发现遗漏或事实错误？</p>
              <a href={`${REPO}/issues/new?template=correction.yml`}>
                提交纠错 ↗
              </a>
              <Link href="/daily/">返回日报归档 →</Link>
            </div>
          </div>
        </div>
      </div>
    </ImageGallery>
  );
}
