// Run explicitly to refresh the editable templates from the locally captured evidence.
// Normal development/builds do not overwrite edited templates.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { load } from 'cheerio';
import sharp from 'sharp';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const evidence = path.resolve(root, '../.codex-work/references');
const publicRoot = path.join(root, 'public');
for (const name of ['assets', 'pages', 'styles', 'data']) fs.mkdirSync(path.join(publicRoot, name), { recursive: true });
const assets = JSON.parse(fs.readFileSync(path.join(evidence, 'assets.json')));
const map = new Map(assets.filter(x => x.file).map(x => [x.url, '/'+x.file]));
const missing = new Set();
const specs = [
  ['sspai-home', 'sspai', '/', 'https://sspai.com/'],
  ['sspai-list', 'sspai', '/tag/派早报', 'https://sspai.com/tag/%E6%B4%BE%E6%97%A9%E6%8A%A5'],
  ['sspai-daily', 'sspai', '/post/115197', 'https://sspai.com/post/115197'],
  ['rf-home', 'radiance', '/', 'https://radiancefields.com/'],
  ['rf-article', 'radiance', '/spirula-studio-v2026.9.30-trains-large-scenes-in-parts-and-merges-them', 'https://radiancefields.com/spirula-studio-v2026.9.30-trains-large-scenes-in-parts-and-merges-them'],
  ['rf-papers', 'radiance', '/papers', 'https://radiancefields.com/papers'],
  ['rf-tools', 'radiance', '/platforms', 'https://radiancefields.com/platforms'],
];
const pages = [];
const catalog = new Map();
const hash = value => createHash('sha256').update(value).digest('hex');
const read = name => JSON.parse(fs.readFileSync(path.join(evidence, 'source', name+'.json'), 'utf8'));
const cleanPath = p => decodeURI(p).replace(/\/$/, '') || '/';

function assetUrl(value, base) {
  if (!value || /^(data:|blob:|#)/.test(value)) return value;
  let absolute;
  try { absolute = new URL(value, base).href; } catch { return value; }
  if (map.has(absolute)) return map.get(absolute);
  // URL serialization escapes spaces and Unicode; retain the captured key for provenance.
  const original = [...map.keys()].find(u => { try { return new URL(u).href === absolute; } catch { return false; } });
  if (original) return map.get(original);
  missing.add(absolute);
  return value;
}
function css(text, base) {
  return text.replace(/url\(\s*(['"]?)(.*?)\1\s*\)/g, (_, quote, u) => `url("${assetUrl(u, base)}")`)
    .replace(/@import\s+(['"])(.*?)\1/g, (_, q, u) => `@import "${assetUrl(u, base)}"`);
}
for (const a of assets.filter(x => x.file)) {
  const source = path.join(evidence, a.file), dest = path.join(publicRoot, a.file);
  if (a.file.endsWith('.css')) fs.writeFileSync(dest, css(fs.readFileSync(source, 'utf8'), a.url));
  else fs.copyFileSync(source, dest);
}

function normalizeMarkup(markup, spec) {
  const [id, site, route, url] = spec;
  if (/\[truncated\]|\.\.\. truncated/i.test(markup)) throw new Error('Truncated capture: '+id);
  const $ = load(markup, { decodeEntities: false });
  $('script, style, noscript, link, meta, ins.adsbygoogle, amp-ad, [id^="codex-browser"], [data-browser-comment-root]').remove();
  // Public reading controls remain; account-specific menus, forms and drafts are omitted.
  $('.ss__user__menu__default__wrapper, .ss__custom__header__user__menu a, .ss__custom__header__user__menu button:contains("登出")').remove();
  $('.ss__custom__header__user__avatar').html('<i data-v-2790f63a="" data-v-6f875124="" class="ssCommunityIcon__appearance"></i>').attr({'aria-label':'外观','title':'外观'});
  $('[role="dialog"], .ss__login__dialog, .ss__customer__service__item__wrapper').each((_, el) => {
    if ($(el).closest('.comp__Directory__wrapper').length === 0) $(el).remove();
  });
  $('iframe').each((_, el) => {
    // Preserve the measured embedded slot without loading advertising/subscription services.
    $(el).attr('data-original-src', $(el).attr('src') || '').removeAttr('src srcdoc').attr('title', $(el).attr('title') || 'Embedded content');
  });
  $('*').each((_, el) => {
    for (const [name, value] of Object.entries(el.attribs || {})) {
      if (/^on/i.test(name) || /nonce|integrity|crossorigin/.test(name)) $(el).removeAttr(name);
      if (name === 'style') $(el).attr(name, css(value, url));
    }
  });
  $('img, source, video, image').each((_, el) => {
    const node = $(el);
    for (const attr of ['src', 'poster', 'data-src', 'data-original', 'href', 'xlink:href']) {
      if (node.attr(attr)) node.attr(attr, assetUrl(node.attr(attr), url));
    }
    if (node.attr('srcset')) node.attr('srcset', node.attr('srcset').split(',').map(item => {
      const [u, ...rest] = item.trim().split(/\s+/); return [assetUrl(u, url), ...rest].join(' ');
    }).join(', '));
    if (el.name === 'img') node.attr('draggable', 'false');
  });
  $('a[href]').each((_, el) => {
    const node = $(el), href = node.attr('href');
    if (/^javascript:/i.test(href)) { node.attr('href','#'); return; }
    if (href.startsWith('#') || /^(mailto:|tel:)/.test(href)) return;
    let target = new URL(href, url);
    if (target.hostname === 'sspai.com' && target.pathname === '/link' && target.searchParams.get('target')) target = new URL(target.searchParams.get('target'));
    const local = specs.find(x => x[1]===site && cleanPath(new URL(x[3]).pathname)===cleanPath(target.pathname) && new URL(x[3]).hostname===target.hostname);
    node.attr('href', local ? local[2]+target.hash : target.href);
    if (local) node.removeAttr('target');
    else node.attr({'target':'_blank',rel:'noopener noreferrer'});
    const title = (node.find('h1,h2,h3,h4,.title,.rf-title').first().text() || node.find('p').first().text() || node.text()).trim().replace(/\s+/g,' ');
    if (title.length > 12 && title.length < 240 && /\/(post|papers|platforms)\/|studio|splat|gaussian/i.test(target.href)) {
      const key = site+target.href;
      if (!catalog.has(key)) catalog.set(key, {title,href:local?local[2]:target.href,sourceUrl:target.href,site,type:target.pathname.startsWith('/papers/')?'paper':target.pathname.startsWith('/platforms/')?'tool':'article',image:node.find('img').first().attr('src') || ''});
    }
  });
  if (site === 'sspai') {
    $('.ss__user__menu__wrapper, .ss__appearance__setting__wrapper').css('display','none');
    $('.ss__dialog2__wrapper--visible').removeClass('ss__dialog2__wrapper--visible');
    $('.ss__custom__header__menu__wrapper--visible').removeClass('ss__custom__header__menu__wrapper--visible');
    $('.ss__user__menu__setting__appearance').attr('data-local-theme','');
    $('article h2').each((i,el) => $(el).attr('id', `ss-hId-${i+1}`));
    for (const selector of ['.article__directory li', '.morning__paper__abstract__list li']) $(selector).each((i,el) => $(el).attr({'data-anchor':`ss-hId-${i+1}`,'tabindex':'0','role':'link'}));
    $('.ss-img-wrapper img').each((i,el) => {
      const node=$(el); node.attr({'data-gallery':'daily','data-gallery-index':String(i),'tabindex':'0','role':'button','aria-label':`查看图片 ${i+1}`});
    });
    $('.ss-article-card-wrapper').each((i,el)=>$(el).attr('data-list-index',String(i)));
  }
  if (id === 'rf-papers') $('.rf-row').each((i,el)=>$(el).attr('data-paper-id', $(el).find('h3 a').attr('href') || String(i)));
  if (id === 'rf-tools') $('[data-framer-name="Card"]').has('h4').each((i,el)=>{
    const node=$(el),href=node.find('a').first().attr('href')||String(i);node.attr('data-tool-id',href);
    const title=node.find('h4').text().trim();if(title)catalog.set(site+href,{title,href,sourceUrl:href,site,type:'tool',image:node.find('img').first().attr('src')||''});
  });
  // Animation-only start styles must not leave below-the-fold content invisible without Framer.
  $('[data-framer-appear-id]').each((_,el)=>{
    const node=$(el);node.removeAttr('data-framer-appear-id');
    node.css('opacity','1');
    if (/translate|scale/.test(node.attr('style') || '')) node.css('transform','none');
  });
  // Preserve text-node whitespace: Framer uses white-space: pre-wrap in rich text.
  let body = $('body').html().replace(/<!--[^]*?-->/g,'');
  if ($('.ss__custom__header__user__avatar img, .ss__user__menu__main a').length) throw new Error('Account controls remain: '+id);
  return body;
}

for (const spec of specs) {
  const [id, site, route, url] = spec;
  const desktop = read(id+'-1440');
  const mobile = read(id+'-390');
  const tablet = read(id+'-1024');
  const folder = path.join(publicRoot,'pages',id); fs.mkdirSync(folder,{recursive:true});
  const variants = {};
  for (const [variant, source] of Object.entries({desktop,tablet,mobile})) {
    const html = normalizeMarkup(source.html,spec);
    fs.writeFileSync(path.join(folder,variant+'.html'),html);
    variants[variant] = `/pages/${id}/${variant}.html`;
  }
  const sheet = desktop.stylesheets.map(u=>fs.readFileSync(path.join(publicRoot,assetUrl(u,url)), 'utf8')).join('\n') + '\n' + desktop.styles.map(s=>css(s,url)).join('\n');
  fs.writeFileSync(path.join(publicRoot,'styles',id+'.css'),sheet+(site==='radiance'?'\n'+fs.readFileSync(path.join(evidence,'source/rf-navigation.css'),'utf8'):''));
  pages.push({id,site,route,sourceUrl:url,title:desktop.title,styles:`/styles/${id}.css`,variants,htmlAttrs:desktop.htmlAttrs.filter(([k])=>['lang','id','class'].includes(k)),bodyAttrs:desktop.bodyAttrs.filter(([k])=>['class','data-framer-page','data-framer-component-type'].includes(k)),capturedAt:desktop.capturedAt||fs.statSync(path.join(evidence,'source',id+'-1440.json')).mtime.toISOString(),sourceHash:hash(desktop.html)});
}

// Preserve complete observed menu and list states as editable fragments.
const fragments = {};
for (const [key, filename, selector, specId] of [
  ['rf-mobile-menu','rf-mobile-menu','nav','rf-home'],
  ['rf-nav-learn','rf-nav-learn','.framer-Umiih','rf-home'],
  ['rf-nav-tools','rf-nav-tools','.framer-3cphA','rf-home'],
  ['rf-nav-services','rf-nav-services','.framer-2O0nD','rf-home'],
  ['rf-nav-about','rf-nav-about','.framer-qACnL','rf-home'],
  ['sspai-mobile-menu','sspai-mobile-menu','.ss__custom__header__mobile__menu','sspai-home'],
  ['sspai-feed-menu','sspai-feed-menu','.mobile-feed-dropdown__menu','sspai-home'],
]) {
  const source=read(filename); const raw=load(source.html)(selector).first().prop('outerHTML')||'';
  const $=load(normalizeMarkup(raw,specs.find(s=>s[0]===specId)));
  fragments[key]=$(selector).first().prop('outerHTML')||'';
}
const extra = {};
for(const [key,name,selector,specId] of [
  ['papers','rf-papers-more','.rf-row','rf-papers'],
  ['daily','sspai-list-more-1440','.articleCard:has(.ss-article-card-wrapper)','sspai-list'],
  ['tools','rf-tools-1440','[data-tool-id]','rf-tools'],
  ['news','rf-home-more','.framer-1bl4ymu > a','rf-home'],
]) {
  const $=load(normalizeMarkup(read(name).html,specs.find(s=>s[0]===specId)));
  extra[key]=$(selector).map((_,e)=>$(e).prop('outerHTML')).get();
}
const assetManifest=await Promise.all(assets.filter(a=>a.file).map(async a=>{
  const localFile=path.join(publicRoot,a.file);let dimensions={};
  if(a.mime?.startsWith('image/')){try{const m=await sharp(localFile).metadata();dimensions={width:m.width,height:m.height,format:m.format};}catch{}}
  return {...a,...dimensions,file:'/'+a.file,localSha256:hash(fs.readFileSync(localFile)),capturedAt:fs.statSync(path.join(evidence,a.file)).mtime.toISOString()};
}));
for(const [name,value] of Object.entries({pages,catalog:[...catalog.values()],fragments,extra,assets:assetManifest})) fs.writeFileSync(path.join(publicRoot,'data',name+'.json'),JSON.stringify(value,null,2));
fs.writeFileSync(path.join(root,'source-gaps.json'),JSON.stringify([...missing],null,2));
console.log(JSON.stringify({pages:pages.length,assets:map.size,catalog:catalog.size,missing:missing.size}));
