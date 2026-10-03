// Import the bounded navigation captures without refreshing the article snapshots.
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {load} from 'cheerio';
import sharp from 'sharp';

const publicRoot=path.resolve('public');
const sourceRoot=path.resolve('../.codex-work/references/source/sspai-navigation');
const assetsFile=path.join(publicRoot,'data/assets.json');
const assets=JSON.parse(fs.readFileSync(assetsFile,'utf8'));
const byUrl=new Map(assets.map(a=>[a.url,a]));
const names=['create','prime','matrix','series','store'];
const captures=names.flatMap(name=>['mobile','desktop'].map(kind=>({name,kind,...JSON.parse(fs.readFileSync(path.join(sourceRoot,`${name}-${kind}.json`),'utf8'))})));
const hash=value=>createHash('sha256').update(value).digest('hex');
const urls=new Set();
for(const capture of captures){
  const $=load(capture.html);
  $('img').each((_,el)=>{const u=$(el).attr('src');if(u&&/^https:/.test(u))urls.add(u);});
}
let added=0;
for(const url of urls){
  if(byUrl.has(url))continue;
  const response=await fetch(url,{headers:{Referer:'https://sspai.com/'}});if(!response.ok)throw Error(`Asset ${response.status}: ${url}`);
  const bytes=Buffer.from(await response.arrayBuffer());
  const mime=response.headers.get('content-type')?.split(';')[0]||'';
  const meta=await sharp(bytes).metadata();
  const ext=meta.format==='jpeg'?'jpg':meta.format;
  const file=`/assets/${hash(url).slice(0,20)}.${ext}`;
  fs.writeFileSync(path.join(publicRoot,file),bytes);
  const asset={url,file,bytes:bytes.length,mime,sha256:hash(bytes),localSha256:hash(bytes),width:meta.width,height:meta.height,format:meta.format,capturedAt:new Date().toISOString()};
  assets.push(asset);byUrl.set(url,asset);added++;
}
const navigation={mobile:{},desktop:{}};
for(const capture of captures){
  const $=load(capture.html);
  $('img').each((_,el)=>{const u=$(el).attr('src');if(u)$(el).attr('src',byUrl.get(u)?.file||u);$(el).removeAttr('srcset').attr('draggable','false');});
  $('a[href],button[href]').each((_,el)=>{const u=$(el).attr('href');if(u)$(el).attr('href',new URL(u,'https://sspai.com').href);});
  $('[class]').each((_,el)=>{$(el).attr('class',$(el).attr('class').split(/\s+/).filter(c=>!/^submenu__fade-|^menu__fade-/.test(c)).join(' '));});
  const selector=capture.kind==='mobile'?'.comp__SsMobileSubmenu':'.ss__desktop__submenu__wrapper';
  const node=$(selector).first();if(!node.length)throw Error(`Missing ${selector}: ${capture.name}`);
  navigation[capture.kind][capture.name]={html:node.prop('outerHTML'),sourceUrl:capture.url,capturedAt:capture.capturedAt,viewport:[capture.width,capture.height],sourceHash:hash(capture.html)};
}
fs.writeFileSync(assetsFile,JSON.stringify(assets,null,2)+'\n');
fs.writeFileSync(path.join(publicRoot,'data/sspai-navigation.json'),JSON.stringify(navigation,null,2)+'\n');
console.log(JSON.stringify({captures:captures.length,assets:assets.length,newAssets:added}));
