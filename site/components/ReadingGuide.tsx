import type { Article } from "../lib/types";
import ArticleNavigation from "./ArticleNavigation";
import { readingGroupLabel } from "../lib/reading-navigation";
export default function ReadingGuide({ article, hasWeek = false }: { article: Article; hasWeek?: boolean }) {
  const guide = article.readingGuide;
  if (article.events) return <nav className="reading-guide event-guide" aria-label="今日最值得看" id={guide?.id || 'reading-guide'}>
    <h2>今日最值得看</h2><ol>{article.events.filter(event=>event.group==='main').map((event,i)=><li key={event.id}>
      <span className="guide-number" aria-hidden="true">{i+1}</span><div><a className="guide-title" href={`#${event.anchor}`}>{event.title}</a>
      {event.judgment && <div className="guide-judgment" dangerouslySetInnerHTML={{__html:event.judgment}} />}
      {event.context.length>0 && <div className="guide-context">{event.context.map((context,i)=><span key={i} dangerouslySetInnerHTML={{__html:context.html}}/>)}</div>}
      </div></li>)}</ol>
    <div className="guide-sections">{(['brief','paper','analysis'] as const).map(group=>{const events=article.events!.filter(event=>event.group===group); const links=events.length===1 && events[0].sections.length>1 ? events[0].sections : events.map(event=>({id:event.anchor,title:event.title})); return !events.length ? null : <div key={group}><a href={`#group-${group}`}>{readingGroupLabel(article,group)}</a>{links.length>1 && <details><summary>展开{readingGroupLabel(article,group)}目录</summary><ul>{links.map(link=><li key={link.id}><a href={`#${link.id}`}>{link.title}</a></li>)}</ul></details>}</div>;})}{hasWeek && <a href="#this-week">本周重要内容</a>}</div>
  </nav>;
  return <section className="reading-guide" id={guide?.id}>{guide && <><h2>今日最值得看</h2><ol>{guide.rows.map((row,i)=><li key={`${row.anchor}:${i}`}><div className="guide-event"><span className="guide-number">{i+1}</span><div><a className="guide-title" href={`#${row.anchor}`}>{row.title}</a></div></div></li>)}</ol></>}<div className="guide-all"><ArticleNavigation toc={article.toc} collapsed/></div></section>;
}
