export type Site = 'sspai' | 'radiance';
export type Page = {id:string;site:Site;route:string;title:string;styles:string;sourceUrl:string;variants:Record<string,string>;htmlAttrs:[string,string][];bodyAttrs:[string,string][]};
export type Entry = {title:string;href:string;site:Site;type:string;image:string;sourceUrl:string};
export type Fixtures = {pages:Page[];catalog:Entry[];fragments:Record<string,string>;extra:Record<string,string[]>};
export function variantFor(site:Site,width:number) {return width < (site==='sspai'?768:810)?'mobile':width<1200?'tablet':'desktop';}
export function matches(text:string,query:string) {return query.trim().toLocaleLowerCase().split(/\s+/).every(word=>text.toLocaleLowerCase().includes(word));}
export function cleanRoute(path:string) {return decodeURI(path).replace(/\/$/,'')||'/';}
export const all = <T extends Element = HTMLElement>(root:ParentNode,selector:string) => Array.from(root.querySelectorAll<T>(selector));
