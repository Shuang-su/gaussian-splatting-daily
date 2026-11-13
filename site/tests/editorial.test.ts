import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { createHash } from "node:crypto";
import matter from "gray-matter";
import { buildArchive, ROOT, parseArticle } from "../lib/content";
import { TAXONOMY, normalizeTag } from "../lib/taxonomy";
import { weekPicks } from "../lib/week-picks";
import { discussionTerm, discussionFixture } from "../lib/discussions";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import ReadingGuide from "../components/ReadingGuide";
const archive=buildArchive();
test('all migrated bodies retain their exact upstream bytes and map every source block once',async()=>{
 const {articles,index}=await archive;
 assert.equal(articles.length,57);
 for(const a of articles.filter(a=>a.date<='2026-10-03')){
  const md=fs.readFileSync(`${ROOT}/${a.path}`,'utf8');
  const change=a.date<'2026-10-01'?'20261004-daily-article-layout':'20261004-october-sync';
  const record=JSON.parse(fs.readFileSync(`${ROOT}/docs/changes/${change}/migration/${a.date}.json`,'utf8'));
  assert.equal(createHash('sha256').update(md.split('---').slice(2).join('---')).digest('hex'),record.body_sha256,`${a.date}: canonical body changed`);
  const layout=matter(md).data.portal.editorial;
  const ids=[...layout.events.flatMap((e:any)=>e.blocks),...layout.introduction,...layout.archive,...layout.omit];
  assert.equal(ids.length,record.source_blocks);assert.equal(new Set(ids).size,ids.length);
  assert.ok(a.events?.length); assert.ok(!a.bodyHtml.includes('event-summary'));
  const rendered=a.bodyHtml+a.archiveHtml+a.introductionHtml+renderToStaticMarkup(createElement(ReadingGuide,{article:a}));
  const links=(html:string)=>[...html.matchAll(/href="(https:[^"]+)"/g)].map(match=>match[1]);
  for(const source of new Set(links(a.html)))assert.ok(links(rendered).includes(source),`${a.date}: lost source ${source}`);
  for(const target of record.legacy_targets)assert.ok(rendered.includes(`id="${target}"`),`${a.date}: missing old target ${target}`);
  for(const e of a.events!){assert.ok(e.html.trim());if(e.group==='main')assert.ok(e.judgment,`${a.date}: missing judgment ${e.title}`);}
 }
 assert.equal(index.entries.filter(e=>e.id.startsWith('arxiv:') && e.date<'2026-10-01').length,42);
 assert.equal(index.entries.filter(e=>e.id.startsWith('arxiv:')).length,170);
});
test('missing and duplicate source blocks fail instead of silently dropping facts',async()=>{
 const md=fs.readFileSync(`${ROOT}/docs/daily/2026/09/2026-09-30.md`,'utf8');const source=matter(md);source.data.portal.editorial.events[0].blocks.push(source.data.portal.editorial.events[0].blocks[0]);
 await assert.rejects(parseArticle(matter.stringify(source.content,source.data),'test.md'),/repeated source block/);
});
test('tag aliases, parents, old routes and product/format identities remain distinct',()=>{
 assert.equal(normalizeTag('projects','LCC'),'lcc');assert.equal(normalizeTag('projects','Spirula'),'spirula');
 assert.equal(normalizeTag('techniques','.lcc 文件格式'),'format-lcc');assert.equal(normalizeTag('projects','.lcc 文件格式'),undefined);
 for(const tags of Object.values(TAXONOMY)){assert.equal(new Set(tags.map(t=>t.id)).size,tags.length);for(const tag of tags)if(tag.parent)assert.ok(tags.some(t=>t.id===tag.parent));}
});
test('current-week picks never use later dates, duplicate identities or the current expanded event',async()=>{
 const {articles}=await archive;
 for(const a of articles){const picks=weekPicks(a,articles);assert.ok(picks.length<=5);assert.equal(new Set(picks.map(e=>e.id)).size,picks.length);for(const p of picks){assert.ok(p.date<a.date);assert.ok(!a.events!.some(e=>e.id===p.id));}}
 assert.equal(weekPicks(articles.find(a=>a.date==='2026-09-28')!,articles).length,0);
});
test('discussion identity separates events and issues; local fixtures cannot leak to public hosts',()=>{
 assert.notEqual(discussionTerm('day','one'),discussionTerm('day','two'));assert.notEqual(discussionTerm('day'),discussionTerm('day','one'));
 assert.equal(discussionFixture('shuang-su.github.io','populated'),null);assert.equal(discussionFixture('127.0.0.1','populated'),'populated');assert.equal(discussionFixture('127.0.0.1','bad'),null);
});
