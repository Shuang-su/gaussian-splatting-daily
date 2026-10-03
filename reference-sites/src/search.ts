import type {Entry,Site} from './model';
import {all,matches} from './model';

export function connectSearch(root:HTMLElement,site:Site,catalog:Entry[]) {
  const abort=new AbortController(),signal=abort.signal;
  const selector=site==='sspai'?'input[placeholder="搜索少数派…"]':'input[type="search"]:not([aria-label="Search papers"])';
  const inputs=()=>all<HTMLInputElement>(root,selector);
  const wrapper=root.querySelector<HTMLElement>('.ss__custom__header__search__input__wrapper');
  const mask=root.querySelector<HTMLElement>('.ss__custom__header__search__mask');
  const results=document.createElement('div');results.className='reference-search-results';results.setAttribute('role','region');results.setAttribute('aria-label',site==='sspai'?'搜索结果':'Search results');results.hidden=true;root.append(results);
  let active:HTMLInputElement|undefined,trigger:HTMLElement|undefined,suppressFocus=false;
  const popupOpen=()=>!!wrapper&&wrapper.style.display==='block';
  function close(restore=true){
    results.hidden=true;
    if(popupOpen()){wrapper!.style.display='none';if(mask)mask.style.display='none';if(restore)trigger?.focus({preventScroll:true});}
    else if(restore&&active){suppressFocus=true;active.focus({preventScroll:true});suppressFocus=false;}
  }
  function position(){
    if(!active)return;const rect=active.getBoundingClientRect();
    const container=active.closest<HTMLElement>('.ss__custom__header__search__input__wrapper')?.getBoundingClientRect();
    const width=container?.width||Math.min(440,innerWidth-24);
    results.style.top=`${(container?.bottom||rect.bottom)+8}px`;results.style.left=`${Math.max(12,Math.min(container?.left??rect.left,innerWidth-width-12))}px`;results.style.width=`${width}px`;
  }
  function update(input:HTMLInputElement){
    active=input;results.replaceChildren();const query=input.value.trim();results.hidden=!query;if(!query)return;position();
    const found=catalog.filter(entry=>entry.site===site&&matches(entry.title,query)).slice(0,12);
    if(!found.length){const p=document.createElement('p');p.textContent=site==='sspai'?'没有找到相关内容':'No results found';results.append(p);return;}
    for(const entry of found){const link=document.createElement('a');link.href=entry.href;link.textContent=entry.title;if(entry.href.startsWith('https:')){link.target='_blank';link.rel='noopener noreferrer';}results.append(link);}
  }
  document.addEventListener('keydown',event=>{if(site==='radiance'&&event.key==='/'&&!(event.target instanceof HTMLInputElement)&&!(event.target instanceof HTMLTextAreaElement)){event.preventDefault();inputs().find(input=>input.getBoundingClientRect().width>0)?.focus();}},{signal});
  root.addEventListener('input',event=>{const input=event.target as HTMLInputElement;if(input.matches(selector))update(input);},{signal});
  root.addEventListener('focusin',event=>{const input=event.target as HTMLInputElement;if(input.matches(selector)&&!suppressFocus)update(input);},{signal});
  root.addEventListener('keydown',event=>{
    const input=event.target as HTMLInputElement;
    if(event.key==='Escape'&&(!results.hidden||popupOpen())){event.preventDefault();event.stopPropagation();close();return;}
    if(!input.matches(selector))return;
    if(event.key==='ArrowDown'){event.preventDefault();results.querySelector('a')?.focus();}
    if(event.key==='Enter'){event.preventDefault();results.querySelector('a')?.click();}
  },{signal,capture:true});
  root.addEventListener('click',event=>{
    const target=event.target as HTMLElement;
    if(target.closest('.ss__custon__header__btn__search')){
      trigger=target.closest<HTMLElement>('button')!;
      if(wrapper){wrapper.style.display='block';if(mask)mask.style.display='';root.querySelector('header')?.classList.remove('translate');wrapper.querySelector<HTMLInputElement>('input')?.focus();}
    }
    if(target.closest('[aria-label="Search Icon"]'))inputs().find(input=>input.getBoundingClientRect().width>0)?.focus();
    if(target.closest('.btn__search__clear')){const input=target.closest('.ss__input__wrapper')?.querySelector<HTMLInputElement>('input');if(input){input.value='';update(input);input.focus();}}
    if(target===mask)close();
  },{signal});
  results.addEventListener('keydown',event=>{const links=all<HTMLAnchorElement>(results,'a'),index=links.indexOf(document.activeElement as HTMLAnchorElement);if(event.key==='ArrowDown'||event.key==='ArrowUp'){event.preventDefault();links[(index+(event.key==='ArrowDown'?1:-1)+links.length)%links.length]?.focus();}},{signal});
  document.addEventListener('pointerdown',event=>{
    const target=event.target as Node;
    if(results.hidden&&!popupOpen())return;
    if(!results.contains(target)&&!wrapper?.contains(target)&&!inputs().includes(target as HTMLInputElement)&&!(target as Element).closest?.('.ss__custon__header__btn__search'))close(false);
  },{signal});
  addEventListener('resize',position,{signal});addEventListener('scroll',position,{signal,passive:true});
  return()=>{abort.abort();results.remove();};
}
