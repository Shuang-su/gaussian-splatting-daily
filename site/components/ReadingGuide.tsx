import type { Article } from "../lib/types";
import ArticleNavigation from "./ArticleNavigation";
import ArticleBody from "./ArticleBody";
export default function ReadingGuide({ article }: { article: Article }) {
  const guide = article.readingGuide;
  return (
    <section className="reading-guide" id={guide?.id}>
      <p className="eyebrow">本期导读</p>
      <h2>{guide ? "今日最值得看" : "本期目录"}</h2>
      {guide && (
        <ol>
          {guide.rows.map((row, i) => (
            <li key={i}>
              <div className="guide-event">
                <span className="guide-number">{i + 1}</span>
                <div>
                  <span className="guide-priority">{row.priority}</span>
                  {row.anchor ? (
                    <a className="guide-title" href={`#${row.anchor}`}>
                      {row.title}
                      <span aria-hidden="true"> ↘</span>
                    </a>
                  ) : (
                    <span className="guide-title">{row.title}</span>
                  )}
                  {(row.details.length > 0 || row.sources.length > 0) && (
                    <details className="guide-evidence">
                      <summary>证据与影响</summary>
                      <div>
                        {row.details.map((d, j) => (
                          <p key={j}>
                            <strong>{d.label}</strong>
                            <span
                              dangerouslySetInnerHTML={{ __html: d.html }}
                            />
                          </p>
                        ))}
                        {row.sources.length > 0 && (
                          <p className="guide-sources">
                            <strong>第一手来源</strong>
                            {row.sources.map((url, j) => (
                              <a
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                key={url}
                              >
                                来源 {j + 1} ↗
                              </a>
                            ))}
                          </p>
                        )}
                      </div>
                    </details>
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
      {guide?.afterHtml && <ArticleBody html={guide.afterHtml} />}
    </section>
  );
}
