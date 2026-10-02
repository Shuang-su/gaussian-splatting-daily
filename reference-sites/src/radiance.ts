import type {Fixtures,Page} from './model';
import {all,matches} from './model';
import {connectNavigation} from './navigation';
export function connectRadiance(root:HTMLElement,page:Page,data:Fixtures) {
  const abort=new AbortController(),signal=abort.signal;
  let savedNav='',open=false;
  function menuControl(){const img=root.querySelector<HTMLElement>('nav img[alt="Menu"],nav img[alt="X"]');const button=img?.parentElement;if(button){button.setAttribute('role','button');button.setAttribute('tabindex','0');button.setAttribute('aria-label',img!.getAttribute('alt')==='X'?'Close menu':'Menu');button.setAttribute('aria-expanded',String(open));}}
  menuControl();
  const stopNavigation=connectNavigation(root,data,signal);
  const newsHost=root.querySelector('.framer-1bl4ymu');
  root.addEventListener('click',e=>{
    const target=e.target as HTMLElement;
    const more=target.closest('button');if(more?.textContent?.trim()==='Load More'){
      if(newsHost?.contains(more)){const shown=all(newsHost,':scope > a').length;data.extra.news.slice(shown,shown+4).forEach(html=>more.parentElement!.insertAdjacentHTML('beforebegin',html));if(shown+4>=data.extra.news.length)more.hidden=true;}
      else window.open('https://radiancefields.com/job-board','_blank','noopener');return;
    }
    if(target.closest('img[alt="Menu"],img[alt="X"],[aria-label="Menu"],[aria-label="Close menu"]')){const nav=root.querySelector('nav');if(!nav)return;if(!open){savedNav=nav.outerHTML;nav.outerHTML=data.fragments['rf-mobile-menu'];}else nav.outerHTML=savedNav;open=!open;menuControl();root.querySelector<HTMLElement>(open?'[aria-label="Close menu"]':'[aria-label="Menu"]')?.focus({preventScroll:true});return;}
  },{signal});
  root.addEventListener('keydown',e=>{if((e.key==='Enter'||e.key===' ')&&(e.target as HTMLElement).matches('[aria-label="Menu"],[aria-label="Close menu"]')){e.preventDefault();(e.target as HTMLElement).click();}if(e.key==='Escape'&&open){const nav=root.querySelector('nav');if(nav)nav.outerHTML=savedNav;open=false;menuControl();root.querySelector<HTMLElement>('[aria-label="Menu"]')?.focus({preventScroll:true});}},{signal});
  const cleanup=page.id==='rf-papers'?papers(root,data,signal):page.id==='rf-tools'?tools(root,data,signal):()=>{};
  return()=>{abort.abort();cleanup();stopNavigation();};
}
function papers(root:HTMLElement,data:Fixtures,signal:AbortSignal) {
  const search=root.querySelector<HTMLInputElement>('input[aria-label="Search papers"]')!;
  const year=root.querySelector<HTMLSelectElement>('select[aria-label="Year filter"]')!;
  const sort=root.querySelector<HTMLSelectElement>('select[aria-label="Sort"]')!;
  const host=root.querySelector('.rf-group')?.parentElement;if(!host)return()=>{};
  const load=root.querySelector<HTMLButtonElement>('.rf-loadMore')!;
  const parse=document.createElement('div');parse.innerHTML=data.extra.papers.join('');
  const records=all<HTMLElement>(parse,'.rf-row').map((node,index)=>({node,index,title:node.querySelector('h3')!.textContent!,text:node.textContent!,tags:all(node,'.rf-chip').map(c=>c.textContent!.trim()),date:node.querySelector('.rf-metaCol > div')!.textContent!.trim()}));
  let topic='All',limit=24,density='Compact';
  const topicButtons=all<HTMLButtonElement>(root,'.rf-topicTab');
  const empty=document.createElement('div');empty.className='reference-empty';empty.textContent='No papers match your filters';empty.hidden=true;load.parentElement!.before(empty);
  function render(){
    let result=records.filter(r=>matches(r.text,search.value)&&(topic==='All'||r.tags.includes(topic))&&(!year.value||year.value==='all'||year.value==='All'||r.date.startsWith(year.value)));
    const selected=sort.selectedOptions[0]?.textContent||'';
    if(selected.includes('Oldest'))result=[...result].reverse();else if(selected.includes('A–Z')||selected.includes('A-Z'))result=[...result].sort((a,b)=>a.title.localeCompare(b.title));
    all(root,'.rf-group').forEach(e=>e.remove());
    let group:HTMLElement|undefined,month='';
    for(const r of result.slice(0,limit)){const m=r.date.replace(/\d+日$/,'');if(m!==month){group=document.createElement('section');group.className='rf-group';const heading=document.createElement('div');heading.className='rf-grouphead';heading.textContent=m;group.append(heading);empty.before(group);month=m;}const row=r.node.cloneNode(true) as HTMLElement;const abstract=row.querySelector<HTMLElement>('.rf-abstract');if(abstract)abstract.style.webkitLineClamp=density==='Compact'?'2':'3';group!.append(row);}
    empty.hidden=!!result.length;load.hidden=result.length<=limit;
    const status=root.querySelector('.rf-result');if(status){status.textContent=`${result.length} indexed results · ${topic==='All'?'All published records':`Filtered by topic ${topic}`}`;}
    topicButtons.forEach(b=>b.setAttribute('aria-pressed',String(b.textContent?.trim()===topic)));
  }
  search.addEventListener('input',()=>{limit=24;render();},{signal});year.addEventListener('change',()=>{limit=24;render();},{signal});sort.addEventListener('change',render,{signal});
  root.addEventListener('click',e=>{const b=(e.target as HTMLElement).closest('button');if(!b)return;const text=b.textContent?.trim();if(b.matches('.rf-topicTab')){topic=text!;limit=24;render();}else if(text==='Compact'||text==='Comfortable'){density=text;all(root,'.rf-btn').filter(el=>['Compact','Comfortable'].includes(el.textContent!.trim())).forEach(el=>el.setAttribute('aria-pressed',String(el===b)));render();}else if(text==='Clear filters'){search.value='';year.selectedIndex=0;sort.selectedIndex=0;topic='All';limit=24;render();}else if(b===load){limit+=24;render();}},{signal});
  render();return()=>{};
}
function tools(root:HTMLElement,data:Fixtures,signal:AbortSignal) {
  const original=all<HTMLElement>(root,'[data-tool-id]');if(!original.length)return()=>{};
  const host=original[0].parentElement!;const parse=document.createElement('div');parse.innerHTML=data.extra.tools.join('');
  const records=all<HTMLElement>(parse,'[data-tool-id]').map(node=>({node,text:node.textContent!,tags:all(node,'[data-framer-name="Tag"] p').map(c=>c.textContent!.trim())}));
  const search=all<HTMLInputElement>(root,'input').find(i=>i.placeholder.trim()==='Search')!;
  const groups=all<HTMLElement>(root,'[data-framer-name="Chips"]').filter(g=>g.querySelector('button'));
  const selections=groups.map(()=> 'All');let limit=24;
  const active=groups[0]?.querySelector('button');const inactive=groups[0]?.querySelectorAll('button')[1];
  const activeStyle=active?.getAttribute('style')||'',inactiveStyle=inactive?.getAttribute('style')||'';
  const count=all<HTMLElement>(root,'div').find(e=>e.children.length===0&&/^Showing \d+ of/.test(e.textContent||''));
  const sentinel=document.createElement('div');sentinel.className='reference-tool-sentinel';sentinel.style.height='1px';host.after(sentinel);
  function render(){const result=records.filter(r=>matches(r.text,search.value)&&selections.every(s=>s==='All'||r.tags.includes(s)));host.replaceChildren(...result.slice(0,limit).map(r=>r.node.cloneNode(true)));if(!result.length){const empty=document.createElement('div');empty.className='reference-empty';empty.innerHTML='<p>No platforms match your filters</p><p>Try clearing a filter or adjusting your search.</p>';host.append(empty);}if(count)count.textContent=`Showing ${Math.min(limit,result.length)} of ${result.length}`;groups.forEach((g,i)=>all<HTMLButtonElement>(g,'button').forEach(b=>{const on=b.textContent?.trim()===selections[i];b.setAttribute('aria-pressed',String(on));b.setAttribute('style',on?activeStyle:inactiveStyle);b.classList.toggle('framer-v-pwe84l',on);b.classList.toggle('framer-v-hp1a32',!on);}));sentinel.hidden=limit>=result.length;}
  groups.forEach((g,i)=>g.addEventListener('click',e=>{const b=(e.target as HTMLElement).closest('button');if(!b)return;selections[i]=b.textContent!.trim();limit=24;render();},{signal}));
  search?.addEventListener('input',()=>{limit=24;render();},{signal});
  root.addEventListener('click',e=>{const b=(e.target as HTMLElement).closest('button');if(b?.textContent?.trim()==='Clear filters'){selections.fill('All');search.value='';limit=24;render();}},{signal});
  const loadNext=()=>{if(!sentinel.hidden&&sentinel.getBoundingClientRect().top<innerHeight+300){limit+=24;render();}};
  const observer=new IntersectionObserver(entries=>{if(entries.some(e=>e.isIntersecting))loadNext();},{rootMargin:'300px'});observer.observe(sentinel);window.addEventListener('scroll',loadNext,{signal,passive:true});render();return()=>observer.disconnect();
}
