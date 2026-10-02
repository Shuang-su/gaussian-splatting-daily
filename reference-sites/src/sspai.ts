import type {Fixtures,Page} from './model';
import {all} from './model';
import {connectGallery} from './gallery';
import {connectCarousels} from './swiper';
export function connectSspai(root:HTMLElement,page:Page,data:Fixtures) {
  const abort=new AbortController(),signal=abort.signal;
  const q=(s:string)=>root.querySelector<HTMLElement>(s);
  // The original app reserves space for its absolutely positioned footer.
  const footer=q('footer');
  const syncFooter=()=>{document.documentElement.style.setProperty('--vh',`${innerHeight/100}px`);document.documentElement.style.setProperty('--height-SsCustomFooter',`${footer?.getBoundingClientRect().height||0}px`);};
  const footerObserver=new ResizeObserver(syncFooter);if(footer)footerObserver.observe(footer);syncFooter();window.addEventListener('resize',syncFooter,{signal});
  const appearance=q('.ss__appearance__setting__wrapper');
  if(appearance)root.append(appearance);
  const media=matchMedia('(prefers-color-scheme: dark)');
  let theme=localStorage.getItem('reference:sspai:appearance')||'0';
  function setTheme(value:string){theme=value;document.documentElement.classList.toggle('theme-dark',theme==='2'||(theme==='0'&&media.matches));localStorage.setItem('reference:sspai:appearance',theme);q('.ss__appearance__setting')?.style.setProperty('--SsAppearanceSettingCheckedIndex',theme);all<HTMLInputElement>(root,'input[name="ssAppearanceSetting"]').forEach(i=>{i.checked=i.value===theme;i.closest('label')?.classList.toggle('ss__appearance__radio__item--checked',i.checked);});}
  setTheme(theme);media.addEventListener('change',()=>setTheme(theme),{signal});
  const directory=q('.comp__Directory__overlay');
  if(directory){directory.classList.add('reference-directory');if(innerWidth>=1200)directory.classList.add('reference-directory-desktop','visible');else directory.classList.remove('visible');}
  const gallery=connectGallery(root);const carousels=connectCarousels(root);
  const menu=q('.ss__custom__header__mobile__menu');
  let menuTrigger:HTMLElement|null=null,directoryTrigger:HTMLElement|null=null;
  function toggleMenu(open:boolean){menu?.classList.toggle('ss__dialog2__wrapper--visible',open);if(menu)all<HTMLElement>(menu,':scope > div').forEach(el=>el.style.display=open?'':'none');q('.ss__custom__header__menu__wrapper')?.classList.toggle('ss__custom__header__menu__wrapper--visible',open);q('.ss__custom__header__menu__btn__toogle')?.setAttribute('aria-expanded',String(open));if(!open)menuTrigger?.focus();}
  function toggleDirectory(open:boolean){directory?.classList.toggle('reference-directory-open',open);directory?.classList.toggle('is-dialog',open);directory?.classList.toggle('is-dialog-open',open);if(open)directory?.querySelector<HTMLElement>('[data-anchor]')?.focus({preventScroll:true});else directoryTrigger?.focus({preventScroll:true});}
  q('.ss__custom__header__menu__btn__toogle')?.setAttribute('aria-label','菜单');q('.ss__custon__header__btn__search')?.setAttribute('aria-label','搜索');q('.ss__backtop__button')?.setAttribute('aria-label','返回顶部');
  q('.article__bar__action--catalog')?.setAttribute('data-local-directory','');q('.article__bar__action--catalog')?.setAttribute('aria-label','目录');
  const cards=page.id==='sspai-list'?all<HTMLElement>(root,'.ss-article-card-wrapper'):[];
  const feed=q('.feed__main');const feedItems=feed?all<HTMLElement>(feed,':scope > *'):[];
  const dropdown=q('.mobile-feed-dropdown');if(dropdown){dropdown.insertAdjacentHTML('beforeend',data.fragments['sspai-feed-menu']);q('.mobile-feed-dropdown__menu')!.hidden=true;}
  function filterFeed(label:string){feedItems.forEach(el=>{el.hidden=label==='关注'||(label==='话题讨论'&&!el.matches('.comboRecommendCard,.short__content'))||(label==='热门内容'&&!el.matches('.article__card--important'));});all(root,'.home__sidebar__btn').forEach(b=>b.classList.toggle('home__sidebar__btn--active',b.textContent!.includes(label)));if(dropdown){q('.mobile-feed-dropdown__toggle__label')!.textContent=label;q('.mobile-feed-dropdown__menu')!.hidden=true;dropdown.classList.remove('mobile-feed-dropdown--open');}if(feed)feed.scrollIntoView({behavior:'smooth',block:'start'});}
  const listParent=cards[0]?.parentElement?.parentElement;
  if(listParent){all(listParent,':scope > .articleCard').forEach(el=>el.remove());listParent.insertAdjacentHTML('afterbegin',data.extra.daily.slice(0,12).join(''));}
  root.addEventListener('change',e=>{const input=e.target as HTMLInputElement;if(input.name==='ssAppearanceSetting')setTheme(input.value);},{signal});
  root.addEventListener('click',e=>{
    const target=e.target as HTMLElement,button=target.closest<HTMLElement>('button');
    if(button?.matches('.mobile-feed-dropdown__toggle')){const list=q('.mobile-feed-dropdown__menu')!;list.hidden=!list.hidden;dropdown?.classList.toggle('mobile-feed-dropdown--open',!list.hidden);return;}
    if(button?.matches('.mobile-feed-dropdown__menu__item')){filterFeed(button.querySelector('.mobile-feed-dropdown__menu__label')!.textContent!);return;}
    if(button?.matches('.home__sidebar__btn')){filterFeed(button.textContent!.includes('讨论')?'话题讨论':button.textContent!.includes('热门')?'热门内容':button.textContent!.includes('关注')?'关注':button.textContent!.includes('全部')?'全部内容':'推荐');return;}
    const anchor=target.closest<HTMLElement>('[data-anchor]');if(anchor){const id=anchor.dataset.anchor!;document.getElementById(id)?.scrollIntoView({behavior:'smooth',block:'start'});history.replaceState(null,'',`#${id}`);toggleDirectory(false);return;}
    if(target.closest('.ss__custom__header__menu__btn__toogle')){menuTrigger=button;toggleMenu(!menu?.classList.contains('ss__dialog2__wrapper--visible'));return;}
    if(target.closest('.ss__custom__header__user__avatar,[data-local-theme]')){if(appearance){const open=appearance.style.display==='none';appearance.style.display=open?'block':'none';appearance.style.position='fixed';appearance.style.right='24px';appearance.style.top='66px';appearance.style.left='auto';appearance.style.zIndex='20000';}return;}
    if(target.closest('.ss__custon__header__btn__search')){q('.ss__custom__header__search__input__wrapper')!.style.display='block';q('.ss__custom__header__search__input__wrapper input')?.focus();return;}
    if(target.closest('.btn__search__clear')){const input=button?.parentElement?.querySelector('input');if(input){input.value='';input.dispatchEvent(new Event('input',{bubbles:true}));input.focus();}return;}
    if(target.closest('[data-local-directory]')){directoryTrigger=button;toggleDirectory(!directory?.classList.contains('reference-directory-open'));return;}
    if(target.closest('.comp__Directory__wrapper .btn__close')){toggleDirectory(false);return;}
    if(target.closest('.article__directory__pin')){q('.comp__Directory__wrapper')?.classList.toggle('pinned');return;}
    if(target.closest('.ss__backtop__button')){window.scrollTo({top:0,behavior:'smooth'});return;}
    if(target.closest('.article__bar__action--comment,.btn__comment')){q('#article-comment-box')?.scrollIntoView({behavior:'smooth'});return;}
    if(target.closest('.advertisement__card__close')){target.closest('.advertisement__box')?.remove();return;}
    if(button?.matches('.ss__mobile__menu__item[href]')){window.open(button.getAttribute('href')!,'_blank','noopener');return;}
    if(page.id==='sspai-list'&&button?.matches('.ss__loading__btn__load')){const current=all(root,'.ss-article-card-wrapper');const next=data.extra.daily.slice(current.length,current.length+12);button.closest('.ss__loading__wrapepr')!.insertAdjacentHTML('beforebegin',next.join(''));if(current.length+next.length>=data.extra.daily.length)button.hidden=true;return;}
  },{signal});
  root.addEventListener('keydown',e=>{if(e.key==='Enter'&&(e.target as HTMLElement).matches('[data-anchor]'))(e.target as HTMLElement).click();if(e.key==='Escape'){toggleMenu(false);toggleDirectory(false);if(appearance)appearance.style.display='none';}},{signal});
  return()=>{abort.abort();footerObserver.disconnect();document.documentElement.style.removeProperty("--height-SsCustomFooter");document.documentElement.style.removeProperty("--vh");gallery();carousels();};
}
