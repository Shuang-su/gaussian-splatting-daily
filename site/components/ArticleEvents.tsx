import type { Article, ArticleEvent } from "../lib/types";
import ArticleBody from "./ArticleBody";
import Discussion from "./Discussion";
import EventTags from "./EventTags";
import { readingGroupLabel } from "../lib/reading-navigation";
export const EVENT_GROUPS = { main: "主要新闻", brief: "简讯", paper: "论文", analysis: "分析与实践" };
export default function ArticleEvents({ article }: { article: Article }) {
  return <div className="article-events">{(Object.keys(EVENT_GROUPS) as ArticleEvent["group"][]).map(group => {
    const events = article.events?.filter(event => event.group === group) || [];
    if (!events.length) return null;
    const List = article.readingEdition && group === "brief" ? "ul" : "div";
    const Item = List === "ul" ? "li" : "section";
    const Heading = article.readingEdition && group !== "main" ? "h3" : "h2";
    return <section key={group} className={`event-group group-${group}`} id={`group-${group}`}>
      {group !== "main" && <h2 className="event-group-title">{readingGroupLabel(article, group)}</h2>}
      {group === "analysis" && article.introductionHtml && <div className="analysis-introduction"><ArticleBody html={article.introductionHtml}/></div>}
      <List className={List === "ul" ? "brief-news-list" : "event-list"}>{events.map(event => <Item className="news-event" key={event.id} id={event.anchor} data-event-id={event.id}>
        {!(group === "analysis" && events.length === 1 && event.title === EVENT_GROUPS.analysis) && <Heading className="event-title">{event.title}</Heading>}
        <ArticleBody html={event.html}/>
        {(!article.readingEdition || group === "main") && <EventTags tags={event.tags}/>}
        <Discussion dailyId={article.id} date={article.date} eventId={event.id} anchor={event.anchor} sampleIndex={article.events!.indexOf(event)}/>
      </Item>)}</List>
    </section>;
  })}</div>;
}
