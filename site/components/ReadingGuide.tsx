import type { Article } from "../lib/types";
import ArticleNavigation from "./ArticleNavigation";
export default function ReadingGuide({ article }: { article: Article }) {
  const guide = article.readingGuide;
  return (
    <section className="reading-guide" id={guide?.id}>
      {guide && <h2>今日最值得看</h2>}
      {guide && (
        <ol>
          {guide.rows.map((row, i) => (
            <li key={`${row.anchor}:${i}`}>
              <div className="guide-event">
                <span className="guide-number" aria-hidden="true">{i + 1}</span>
                <div>
                  {row.anchor ? (
                    <a className="guide-title" href={`#${row.anchor}`}>{row.title}</a>
                  ) : (
                    <span className="guide-title">{row.title}</span>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ol>
      )}
      <div className="guide-all">
        <ArticleNavigation toc={article.toc} collapsed />
      </div>
    </section>
  );
}
