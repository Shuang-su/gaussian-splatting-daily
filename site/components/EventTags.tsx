import Link from "next/link";
import { TAXONOMY, type TagDimension } from "../lib/taxonomy";
import type { EventTags as Tags } from "../lib/types";
export default function EventTags({tags}:{tags:Tags}) {
  return <div className="event-tags" aria-label="事件标签">{(["projects","techniques","content","sources"] as TagDimension[]).flatMap(dimension => tags[dimension].map(id => {const tag=TAXONOMY[dimension].find(t=>t.id===id)!; return tag.topic ? <Link key={`${dimension}:${id}`} href={`/topics/${tag.topic}/`}>{tag.name}</Link> : <span key={`${dimension}:${id}`} data-dimension={dimension}>{tag.name}</span>;}))}</div>;
}
