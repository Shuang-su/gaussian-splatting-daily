import {test} from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import matter from 'gray-matter';import {buildArchive,parseArticle,ROOT} from '../lib/content';import {applyReadingEdition} from '../lib/reading-edition';import {buildFeeds} from '../lib/feeds';import {buildHome} from '../lib/home';
const read=(p:string)=>fs.readFileSync(`${ROOT}/${p}`,'utf8');
test('supplement tampering, traversal and foreign report identities fail',async()=>{
 const date='2026-10-21',raw=read(`docs/daily/2026/10/${date}.md`),source=await parseArticle(raw,'source.md'),reader=structuredClone(matter(read(`docs/reading/${date}.md`)));
 const good=await applyReadingEdition(source,raw,matter.stringify(reader.content,reader.data),'reader.md',parseArticle,{readSupplement:read});assert.ok(good.events!.length);
 await assert.rejects(applyReadingEdition(source,raw,matter.stringify(reader.content,reader.data),'reader.md',parseArticle,{readSupplement:p=>read(p)+'changed'}),/stale supplement/);
 reader.data.supplements[0].path='../../outside.md';await assert.rejects(applyReadingEdition(source,raw,matter.stringify(reader.content,reader.data),'reader.md',parseArticle,{readSupplement:read}),/invalid.*supplement/);
});
test('new domain keeps old RSS identities and newsroom articles appear on homepage',async()=>{
 const a=await buildArchive(),f=buildFeeds(a.articles,a.weeks);assert.match(f.daily,/<guid isPermaLink="false">https:\/\/shuang-su.github.io\/gaussian-splatting-daily\/daily\/2026\/11\/13\//);assert.match(f.daily,/<link>https:\/\/metaflow.shuang-su.com\/horizon\//);
 const home=buildHome(a.index);assert.ok(home.feeds.app.length);assert.ok(home.feeds.feature.length);for(const article of a.editorials)assert.ok(home.feeds.recommended.some(x=>x.id===article.id));
});
test('every important discovered event has a visible reading destination',async()=>{
 const {articles}=await buildArchive();for(const f of fs.readdirSync(`${ROOT}/data/research`)){const r=JSON.parse(read('data/research/'+f));for(const c of r.candidates.filter((c:any)=>c.importance==='important'))assert.ok(articles.find(a=>a.date===r.date)?.events?.some(e=>e.id===c.eventId),c.title);}
});
