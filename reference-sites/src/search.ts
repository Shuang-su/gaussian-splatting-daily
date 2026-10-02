import type {Entry,Site} from './model';
import {all,matches} from './model';
export function connectSearch(root:HTMLElement,site:Site,catalog:Entry[]) {
  const abort=new AbortController(),signal=abort.signal;
  const selector=site==='sspai'?'input[placeholder="搜索少数派…"]':'input[type="search"]:not([aria-label="Search papers"])';
  const inputs=()=>all<HTMLInputElement>(root,selector);
  const results=document.createElement('div');results.className='reference-search-results';results.setAttribute('role','region');results.setAttribute('aria-label',site==='sspai'?'搜索结果':'Search results');results.hidden=true;root.append(results);
  let active:HTMLInputElement|undefined;
  document.addEventListener('keydown',e=>{if(site==='radiance'&&e.key==='/'&&!(e.target instanceof HTMLInputElement)&&!(e.target instanceof HTMLTextAreaElement)){e.preventDefault();inputs().find(i=>i.getBoundingClientRect().width>0)?.focus();}},{signal});
  function update(input:HTMLInputElement) {
    active=input;results.replaceChildren();const query=input.value.trim();results.hidden=!query;if(!query)return;
    const rect=input.getBoundingClientRect();results.style.top=`${rect.bottom+8}px`;results.style.left=`${Math.max(12,Math.min(rect.left,innerWidth-452))}px`;results.style.width=`${Math.min(440,innerWidth-24)}px`;
    const found=catalog.filter(e=>e.site===site&&matches(e.title,query)).slice(0,12);
    if(!found.length){const p=document.createElement('p');p.textContent=site==='sspai'?'没有找到相关内容':'No results found';results.append(p);return;}
    for(const entry of found){const a=document.createElement('a');a.href=entry.href;a.textContent=entry.title;if(entry.href.startsWith('https:')){a.target='_blank';a.rel='noopener noreferrer';}results.append(a);}
  }
  root.addEventListener('input',e=>{const input=e.target as HTMLInputElement;if(input.matches(selector))update(input);},{signal});
  root.addEventListener('focusin',e=>{const input=e.target as HTMLInputElement;if(input.matches(selector))update(input);},{signal});
  root.addEventListener('keydown',e=>{const input=e.target as HTMLInputElement;if(!input.matches(selector))return;if(e.key==='ArrowDown'){e.preventDefault();results.querySelector('a')?.focus();}if(e.key==='Enter'){e.preventDefault();results.querySelector('a')?.click();}if(e.key==='Escape'){results.hidden=true;input.blur();}},{signal});
  root.addEventListener('click',e=>{if((e.target as HTMLElement).closest('[aria-label="Search Icon"]'))inputs().find(i=>i.getBoundingClientRect().width>0)?.focus();},{signal});
  results.addEventListener('keydown',e=>{const links=all<HTMLAnchorElement>(results,'a'),i=links.indexOf(document.activeElement as HTMLAnchorElement);if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();links[(i+(e.key==='ArrowDown'?1:-1)+links.length)%links.length]?.focus();}if(e.key==='Escape'){results.hidden=true;active?.focus();}},{signal});
  document.addEventListener('pointerdown',e=>{if(!results.contains(e.target as Node)&&!inputs().includes(e.target as HTMLInputElement))results.hidden=true;},{signal});
  return()=>{abort.abort();results.remove();};
}
