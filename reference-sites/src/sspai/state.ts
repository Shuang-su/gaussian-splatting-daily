export const feedTabs=['推荐','全部内容','话题讨论','热门内容','关注'] as const;
export type FeedTab=typeof feedTabs[number];
export type ReadingState={feed:FeedTab;loaded:number;scroll:number};
export const readingKey=(route:string)=>`reference:sspai:reading:v1:${route}`;
export function restoreReading(value:string|null,total:number):ReadingState {
  let saved:Partial<ReadingState>={};
  try{saved=JSON.parse(value||'{}')||{};}catch{/* Invalid local state starts from the first batch. */}
  return {
    feed:feedTabs.includes(saved.feed as FeedTab)?saved.feed as FeedTab:'推荐',
    loaded:Math.min(total,Math.max(12,Number.isFinite(saved.loaded)?Math.floor(saved.loaded!):12)),
    scroll:Number.isFinite(saved.scroll)?Math.max(0,saved.scroll!):0,
  };
}
export function sspaiHref(value:string) {
  if(!value||value.startsWith('#')||/^(mailto:|tel:)/.test(value))return value;
  const url=new URL(value,'https://sspai.com');
  const route=decodeURI(url.pathname).replace(/\/$/,'')||'/';
  if(url.hostname==='sspai.com'&&['/','/post/115197','/tag/派早报'].includes(route))return route+url.search+url.hash;
  return url.href;
}
