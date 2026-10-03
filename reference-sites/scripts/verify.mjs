import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {load} from 'cheerio';
const publicRoot=path.resolve('public');
const pages=JSON.parse(fs.readFileSync('public/data/pages.json'));
const assets=JSON.parse(fs.readFileSync('public/data/assets.json'));
const extra=JSON.parse(fs.readFileSync('public/data/extra.json'));
const navigation=JSON.parse(fs.readFileSync('public/data/sspai-navigation.json'));
const failures=[];let references=0;
const check=u=>{if(!u||u.startsWith('data:')||u.startsWith('#'))return;references++;if(/^https?:/.test(u))failures.push('External resource: '+u);else if(!fs.existsSync(path.join(publicRoot,u.split('#')[0])))failures.push('Missing resource: '+u);};
for(const asset of assets){const bytes=fs.readFileSync(path.join(publicRoot,asset.file));assert.equal(createHash('sha256').update(bytes).digest('hex'),asset.localSha256);}
for(const kind of ['mobile','desktop']){
  assert.deepEqual(Object.keys(navigation[kind]).sort(),['create','matrix','prime','series','store']);
  for(const capture of Object.values(navigation[kind])){
    const $=load(capture.html);assert(capture.sourceUrl&&capture.capturedAt&&capture.sourceHash);
    assert.equal($('script,iframe,form[action]').length,0);
    $('img').each((_,el)=>check($(el).attr('src')));
    $('a[href],button[href]').each((_,el)=>assert.match($(el).attr('href'),/^https:\/\//));
  }
}
for(const p of pages){for(const file of Object.values(p.variants)){const html=fs.readFileSync(path.join(publicRoot,file),'utf8'),$=load(html);assert.equal($('.ss__custom__header__user__avatar img, .ss__user__menu__main a').length,0);assert.equal($('script,iframe[src],form[action]').length,0);$('img,source,video,image').each((_,e)=>{for(const attr of ['src','poster','href','data-original','data-src'])if($(e).attr(attr))check($(e).attr(attr));});assert($('footer,[data-framer-name="Footer"]').length||/All rights reserved/.test(html)||(p.id==='sspai-home'&&$('a[href="https://sspai.com/page/about-us"]').length),'Footer missing: '+p.id);}
  const css=fs.readFileSync(path.join(publicRoot,p.styles),'utf8');for(const [,u]of css.matchAll(/url\(["']?([^"')]+)["']?\)/g))check(u);
  const output=path.join('dist',p.site==='sspai'?'sspai':'radiance',p.route,'index.html');assert(fs.existsSync(output),'Exported route missing: '+output);
}
assert.equal(pages.length,7);assert(extra.daily.length>=24);assert(extra.papers.length>=48);assert(extra.news.length>=8);assert(extra.tools.length>=48);assert.deepEqual(failures,[]);
console.log(JSON.stringify({pages:pages.length,templates:pages.length*3,assets:assets.length,resourceReferences:references,samples:Object.fromEntries(Object.entries(extra).map(([k,v])=>[k,v.length])),failures:0},null,2));
