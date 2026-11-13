import type {Page} from './model';
import {all} from './model';
import {connectGallery} from './gallery';
import {connectCarousels} from './swiper';
import {feedTabs,type FeedTab} from './sspai/state';

type Actions={initialFeed:FeedTab;selectFeed:(feed:FeedTab)=>void;loadMore:()=>void};
const menuNames=['create','prime','matrix','series','store'];
const focusables='a[href],button,input,[tabindex="0"]';
const visible=(el:HTMLElement)=>!el.hidden&&el.getBoundingClientRect().width>0;

export function connectSspai(root:HTMLElement,_page:Page,actions:Actions) {
  const abort=new AbortController(),signal=abort.signal;
  const q=(selector:string)=>root.querySelector<HTMLElement>(selector);
  const header=q('header'),footer=q('footer');
  const syncFooter=()=>{document.documentElement.style.setProperty('--vh',`${innerHeight/100}px`);document.documentElement.style.setProperty('--height-SsCustomFooter',`${footer?.getBoundingClientRect().height||0}px`);};
  const footerObserver=new ResizeObserver(syncFooter);if(footer)footerObserver.observe(footer);syncFooter();window.addEventListener('resize',syncFooter,{signal});
  const appearance=q('.ss__appearance__setting__wrapper');
  const media=matchMedia('(prefers-color-scheme: dark)');
  let theme=localStorage.getItem('reference:sspai:appearance')||'0';
  function setTheme(value:string){theme=value;document.documentElement.classList.toggle('theme-dark',theme==='2'||(theme==='0'&&media.matches));localStorage.setItem('reference:sspai:appearance',theme);q('.ss__appearance__setting')?.style.setProperty('--SsAppearanceSettingCheckedIndex',theme);all<HTMLInputElement>(root,'input[name="ssAppearanceSetting"]').forEach(input=>{input.checked=input.value===theme;const label=input.closest('label');label?.classList.toggle('ss__appearance__radio__item--checked',input.checked);label?.setAttribute('role','radio');label?.setAttribute('aria-label',label.querySelector('span')?.textContent||'');label?.setAttribute('aria-checked',String(input.checked));if(label)label.tabIndex=input.checked?0:-1;});}
  q('.ss__appearance__setting')?.setAttribute('role','radiogroup');q('.ss__appearance__setting')?.setAttribute('aria-label','外观');
  setTheme(theme);media.addEventListener('change',()=>setTheme(theme),{signal});

  const directory=q('.comp__Directory__overlay'),menu=q('.ss__custom__header__mobile__menu');
  const rootMenu=q('.comp__SsMobileMenu > .ss__mobile__menu:not(.comp__SsMobileSubmenu__wrapper)');
  const mobileSearch=q('.comp__SsMobileMenu > .comp__SsInput__wrapper');
  const mobileSubmenus=q('.comp__SsMobileSubmenu__wrapper');
  const desktopSubmenus=q('.ss__desktop__submenu__transition__wrapper');
  const desktopTriggers=all<HTMLElement>(root,'.ss__custom__header__desktop__menu__item');
  const mobileTriggers=all<HTMLElement>(root,'.ss__mobile__menu__item');
  let menuTrigger:HTMLElement|null=null,submenuTrigger:HTMLElement|null=null,directoryTrigger:HTMLElement|null=null;
  let menuOpen=false,mobileName='',desktopName='',directoryOpen=false;
  function mobileSubmenu(name:string){
    mobileName=name;
    if(rootMenu)rootMenu.style.display=name?'none':'';
    if(mobileSearch)mobileSearch.style.display=name?'none':'';
    if(mobileSubmenus){mobileSubmenus.style.display=name?'':'none';all<HTMLElement>(mobileSubmenus,'[data-reference-menu]').forEach(el=>el.hidden=el.dataset.referenceMenu!==name);}
    mobileTriggers.forEach((el,i)=>el.setAttribute('aria-expanded',String(menuNames[i]===name)));
  }
  function toggleMenu(open:boolean){
    menuOpen=open;menu?.classList.toggle('ss__dialog2__wrapper--visible',open);
    if(menu)all<HTMLElement>(menu,':scope > div').forEach(el=>el.style.display=open?'':'none');
    q('.ss__custom__header__menu__wrapper')?.classList.toggle('ss__custom__header__menu__wrapper--visible',open);
    const trigger=q('.ss__custom__header__menu__btn__toogle');trigger?.setAttribute('aria-expanded',String(open));
    const icon=trigger?.querySelector('i');if(icon)icon.className=open?'ssCommunityIcon__cancel':'ssCommunityIcon__menu';
    mobileSubmenu('');header?.classList.remove('translate');
    if(open)menu?.querySelector<HTMLInputElement>('input')?.focus({preventScroll:true});else menuTrigger?.focus({preventScroll:true});
  }
  function desktopSubmenu(name:string){
    desktopName=name;
    if(desktopSubmenus){
      all<HTMLElement>(desktopSubmenus,'[data-reference-menu]').forEach(el=>el.hidden=el.dataset.referenceMenu!==name);
      const mask=desktopSubmenus.querySelector<HTMLElement>('.ss__desktop__submenu__mask');if(mask)mask.style.display=name?'':'none';
    }
    desktopTriggers.forEach((el,i)=>el.setAttribute('aria-expanded',String(menuNames[i]===name)));
    if(name)header?.classList.remove('translate');
  }
  desktopTriggers.forEach((trigger,index)=>{
    trigger.dataset.referenceTrigger=menuNames[index];trigger.setAttribute('aria-haspopup','true');trigger.setAttribute('aria-expanded','false');
    if(trigger.tagName!=='A'){trigger.tabIndex=0;trigger.setAttribute('role','button');}
    trigger.addEventListener('pointerenter',()=>desktopSubmenu(menuNames[index]),{signal});
    trigger.addEventListener('focus',()=>desktopSubmenu(menuNames[index]),{signal});
    trigger.addEventListener('keydown',event=>{if(event.key==='ArrowDown'||(trigger.tagName!=='A'&&['Enter',' '].includes(event.key))){event.preventDefault();desktopSubmenu(menuNames[index]);desktopSubmenus?.querySelector<HTMLElement>(`[data-reference-menu="${menuNames[index]}"] ${focusables}`)?.focus();}},{signal});
  });
  mobileTriggers.forEach((el,index)=>{el.dataset.referenceTrigger=menuNames[index];el.setAttribute('aria-haspopup','true');el.setAttribute('aria-expanded','false');});
  header?.addEventListener('pointerleave',event=>{if(!(event.relatedTarget instanceof Node)||!desktopSubmenus?.contains(event.relatedTarget))desktopSubmenu('');},{signal});
  q('.ss__desktop__submenu__mask')?.addEventListener('pointerenter',()=>desktopSubmenu(''),{signal});

  function toggleDirectory(open:boolean,restoreFocus=true){
    directoryOpen=open;directory?.classList.toggle('reference-directory-open',open);
    directory?.classList.toggle('is-dialog',open);directory?.classList.toggle('is-dialog-open',open);
    if(open){directory?.setAttribute('role','dialog');directory?.setAttribute('aria-modal','true');directory?.setAttribute('aria-label','文章目录');directory?.querySelector<HTMLElement>('[data-anchor]')?.focus({preventScroll:true});}
    else{directory?.removeAttribute('role');directory?.removeAttribute('aria-modal');if(restoreFocus)directoryTrigger?.focus({preventScroll:true});}
  }
  function responsive(){
    q('.mobile-feed-dropdown')?.classList.toggle('mobile-feed-dropdown--active',innerWidth<768);
    if(directory){const desktop=innerWidth>=1200;directory.classList.add('reference-directory');directory.classList.toggle('reference-directory-desktop',desktop);directory.classList.toggle('visible',desktop);if(desktop&&directoryOpen)toggleDirectory(false,false);}
    if(innerWidth>=768&&menuOpen)toggleMenu(false);
    if(innerWidth<768)desktopSubmenu('');
  }
  responsive();window.addEventListener('resize',responsive,{signal});
  q('.ss__custom__header__menu__btn__toogle')?.setAttribute('aria-label','菜单');
  q('.ss__custon__header__btn__search')?.setAttribute('aria-label','搜索');
  q('.ss__backtop__button')?.setAttribute('aria-label','返回顶部');
  q('.article__bar__action--catalog')?.setAttribute('data-local-directory','');
  q('.article__bar__action--catalog')?.setAttribute('aria-label','目录');

  const dropdown=q('.mobile-feed-dropdown');
  function feedLabel(label:FeedTab,scroll=false){
    actions.selectFeed(label);
    all(root,'.home__sidebar__btn').forEach(button=>button.classList.toggle('home__sidebar__btn--active',button.textContent!.includes(label)));
    const text=q('.mobile-feed-dropdown__toggle__label');if(text)text.textContent=label;
    all(root,'.mobile-feed-dropdown__menu__item').forEach(button=>{const checked=button.textContent!.includes(label);button.classList.toggle('mobile-feed-dropdown__menu__item--checked',checked);const check=button.querySelector<HTMLElement>('.mobile-feed-dropdown__menu__check');if(check)check.hidden=!checked;});
    const list=q('.mobile-feed-dropdown__menu');if(list)list.hidden=true;dropdown?.classList.remove('mobile-feed-dropdown--open');
    if(scroll)q('.feed__main')?.scrollIntoView({behavior:'smooth',block:'start'});
  }
  feedLabel(actions.initialFeed);
  let lastScroll=scrollY,frame=0;
  window.addEventListener('scroll',()=>{
    if(frame)return;
    frame=requestAnimationFrame(()=>{
      const delta=scrollY-lastScroll;
      const modal=menuOpen||desktopName||directoryOpen||q('.ss__custom__header__search__input__wrapper')?.style.display==='block';
      if(!modal&&Math.abs(delta)>5)header?.classList.toggle('translate',delta>0&&scrollY>56);
      if(scrollY<56)header?.classList.remove('translate');lastScroll=scrollY;frame=0;
    });
  },{signal,passive:true});
  root.addEventListener('change',event=>{const input=event.target as HTMLInputElement;if(input.name==='ssAppearanceSetting')setTheme(input.value);},{signal});
  root.addEventListener('click',event=>{
    const target=event.target as HTMLElement,button=target.closest<HTMLElement>('button');
    if(button?.matches('.mobile-feed-dropdown__toggle')){const list=q('.mobile-feed-dropdown__menu')!;list.hidden=!list.hidden;dropdown?.classList.toggle('mobile-feed-dropdown--open',!list.hidden);return;}
    if(button?.matches('.mobile-feed-dropdown__menu__item,.home__sidebar__btn')){const label=feedTabs.find(tab=>button.textContent!.includes(tab))||'推荐';feedLabel(label,true);return;}
    const anchor=target.closest<HTMLElement>('[data-anchor]');
    if(anchor){const id=anchor.dataset.anchor!,heading=document.getElementById(id);event.preventDefault();toggleDirectory(false,false);history.replaceState(null,'',`#${id}`);heading?.scrollIntoView({behavior:'smooth',block:'start'});return;}
    if(target.closest('.ss__custom__header__menu__btn__toogle')){menuTrigger=button;toggleMenu(!menuOpen);return;}
    if(button?.matches('.ss__mobile__menu__item')){submenuTrigger=button;mobileSubmenu(button.dataset.referenceTrigger!);mobileSubmenus?.querySelector<HTMLElement>(`[data-reference-menu="${mobileName}"] .btn__back`)?.focus({preventScroll:true});return;}
    if(target.closest('.comp__SsMobileSubmenu .btn__back')){mobileSubmenu('');submenuTrigger?.focus({preventScroll:true});return;}
    if(target.matches('.ss__dialog2__mask')){toggleMenu(false);return;}
    if(target.closest('.ss__custom__header__user__avatar,[data-local-theme]')){
      if(appearance){const open=appearance.style.display==='none';Object.assign(appearance.style,{display:open?'block':'none',position:'fixed',right:'24px',top:'66px',left:'auto',zIndex:'20000'});if(open)appearance.querySelector<HTMLElement>('[role="radio"][aria-checked="true"]')?.focus({preventScroll:true});}return;
    }
    if(target.closest('[data-local-directory]')){directoryTrigger=button;toggleDirectory(!directoryOpen);return;}
    if(target.closest('.comp__Directory__wrapper .btn__close')||target===directory){toggleDirectory(false);return;}
    if(target.closest('.article__directory__pin')){q('.comp__Directory__wrapper')?.classList.toggle('pinned');return;}
    if(target.closest('.ss__backtop__button')){window.scrollTo({top:0,behavior:'smooth'});return;}
    if(target.closest('.article__bar__action--comment,.btn__comment')){q('#article-comment-box')?.scrollIntoView({behavior:'smooth'});return;}
    if(button?.matches('.ss__loading__btn__load')){actions.loadMore();return;}
    if(target.closest('.advertisement__card__close')){const box=target.closest<HTMLElement>('.advertisement__box');if(box)box.hidden=true;return;}
    if(button?.matches('[href]')&&button.getAttribute('href')){window.open(button.getAttribute('href')!,'_blank','noopener');}
  },{signal});
  root.addEventListener('keydown',event=>{
    const radio=(event.target as HTMLElement).closest<HTMLElement>('.ss__appearance__radio__item');
    if(radio&&['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Enter',' '].includes(event.key)){
      event.preventDefault();const direction=event.key==='ArrowLeft'||event.key==='ArrowUp'?-1:event.key==='ArrowRight'||event.key==='ArrowDown'?1:0;const value=String((Number(radio.querySelector<HTMLInputElement>('input')!.value)+direction+3)%3);setTheme(value);appearance?.querySelector<HTMLElement>('[aria-checked="true"]')?.focus();
    }
    if((event.target as HTMLElement).matches('[data-anchor]')&&['Enter',' '].includes(event.key)){event.preventDefault();(event.target as HTMLElement).click();}
    if(event.defaultPrevented)return;
    if(event.key==='Escape'){
      if(mobileName){mobileSubmenu('');submenuTrigger?.focus({preventScroll:true});}
      else if(menuOpen)toggleMenu(false);
      else if(directoryOpen)toggleDirectory(false);
      else if(desktopName){const trigger=desktopTriggers[menuNames.indexOf(desktopName)];desktopSubmenu('');trigger?.focus({preventScroll:true});desktopSubmenu('');}
      else if(appearance){appearance.style.display='none';q('.ss__custom__header__user__avatar')?.focus({preventScroll:true});}
    }
    if(event.key==='Tab'){
      const dialog=directoryOpen?directory:menuOpen?menu:null;if(!dialog)return;
      const controls=all<HTMLElement>(dialog,focusables).filter(visible);const first=controls[0],last=controls.at(-1);
      if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}
      else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}
    }
  },{signal});
  document.addEventListener('pointerdown',event=>{const target=event.target as Node;if(appearance&&appearance.style.display!=='none'&&!appearance.contains(target)&&!(target as Element).closest?.('.ss__custom__header__user__avatar,[data-local-theme]'))appearance.style.display='none';},{signal});
  const gallery=connectGallery(root),carousels=connectCarousels(root);
  return()=>{abort.abort();cancelAnimationFrame(frame);footerObserver.disconnect();document.documentElement.style.removeProperty('--height-SsCustomFooter');document.documentElement.style.removeProperty('--vh');gallery();carousels();};
}
