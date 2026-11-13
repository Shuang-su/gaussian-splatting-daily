/** Assign canonical Markdown blocks to explicitly named H2 events; identities are never derived from titles. */
import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import {unified} from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import {sourceBlocks} from "../lib/editorial";
const file=process.argv[2];
if (!file) throw Error("Usage: node --import tsx scripts/map-events.ts <report.md>");
const source=fs.readFileSync(file,"utf8"), parsed=matter(source), layout=parsed.data.portal?.editorial;
if (parsed.data.portal?.layout!=="events" || layout?.version!==1) throw Error("Expected portal.layout: events and editorial.version: 1");
const tree=unified().use(remarkParse).use(remarkGfm).parse(parsed.content), blocks=sourceBlocks(tree.children,parsed.content);
const text=(node:any):string=>node.value || node.children?.map(text).join("") || "";
const headings=blocks.map((b,i)=>({b,i})).filter(({b})=>b.node.type==='heading' && b.node.depth===2);
const claimed=new Set<number>();
for(const event of layout.events){
 const heading=headings.filter(({b})=>text(b.node)===(event.heading || event.title));
 if(heading.length!==1 || claimed.has(heading[0].i))throw Error(`Event ${event.id}: expected one unique H2 matching its heading/title`);
 const start=heading[0].i;claimed.add(start);
 const end=headings.find(h=>h.i>start)?.i ?? blocks.length;
 event.blocks=blocks.slice(start,end).map(b=>b.key);
}
const archive=headings.filter(({b})=>text(b.node)==='来源与纠错');
if(archive.length>1)throw Error('Repeated archive heading');
if(archive.length)claimed.add(archive[0].i);
if(headings.some(h=>!claimed.has(h.i)))throw Error('Every H2 must name an event or 来源与纠错; nothing is silently discarded');
layout.archive=archive.length ? blocks.slice(archive[0].i,headings.find(h=>h.i>archive[0].i)?.i ?? blocks.length).map(b=>b.key) : [];
const intro=blocks.slice(0,headings[0]?.i ?? blocks.length);
layout.omit=intro.filter(b=>b.node.type==='heading' && /深度情报日报/.test(text(b.node))).map(b=>b.key);
layout.introduction=intro.filter(b=>!layout.omit.includes(b.key)).map(b=>b.key);
// Keep the compact JSON form accepted by the stdlib publication validator.
let front=source.slice(0,source.indexOf('\n---',4));
if(!/^  editorial: .+$/m.test(front))throw Error('Keep editorial metadata as one JSON line');
front=front.replace(/^  editorial: .+$/m,`  editorial: ${JSON.stringify(layout)}`);
fs.writeFileSync(file,front+source.slice(source.indexOf('\n---',4)));
console.log(`Mapped ${layout.events.length} events in ${path.basename(file)}; Markdown body unchanged.`);
