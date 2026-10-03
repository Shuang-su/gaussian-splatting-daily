import {createElement,type CSSProperties,type ReactNode} from 'react';
import {sspaiHref} from './state';

export type CapturedNode=string|{tag:string;attrs:Record<string,string>;children:CapturedNode[];key:string};
export type CapturedElement=Exclude<CapturedNode,string>;
export type NavigationCaptures=Record<'mobile'|'desktop',Record<string,{html:string;sourceUrl:string;capturedAt:string}>>;
export const hasClass=(node:CapturedElement,name:string)=>(node.attrs.class||'').split(/\s+/).includes(name);

const aliases:Record<string,string>={class:'className',for:'htmlFor',tabindex:'tabIndex',readonly:'readOnly',maxlength:'maxLength',colspan:'colSpan',rowspan:'rowSpan',srcset:'srcSet',crossorigin:'crossOrigin',allowfullscreen:'allowFullScreen',frameborder:'frameBorder',viewbox:'viewBox',preserveaspectratio:'preserveAspectRatio','xlink:href':'xlinkHref','xml:space':'xmlSpace',xmlns:'xmlns','xmlns:xlink':'xmlnsXlink'};
const booleanAttributes=new Set(['disabled','checked','selected','multiple','autofocus','readonly','required','hidden','allowfullscreen','controls','loop','muted']);
const voidElements=new Set(['area','base','br','col','embed','hr','img','input','link','meta','param','source','track','wbr']);

export function nodeProps(node:CapturedElement):Record<string,unknown> {
  const props:Record<string,unknown>={key:node.key};
  for(const [name,value]of Object.entries(node.attrs)){
    if((name==='href'||name==='src')&&!value)continue;
    if(name==='style'){
      const style=document.createElement('span').style;style.cssText=value;
      const parsed:Record<string,string>={};
      for(const property of style){const key=property.startsWith('--')?property:property.replace(/-([a-z])/g,(_,c:string)=>c.toUpperCase()).replace(/^ms-/,'ms');parsed[key]=style.getPropertyValue(property);}
      props.style=parsed as CSSProperties;
    }else if(name==='checked')props.defaultChecked=true;
    else if(name==='value'&&['input','textarea','select'].includes(node.tag))props.defaultValue=value;
    else if(name==='contenteditable')props.contentEditable=value==='true';
    else if(name==='draggable')props.draggable=value==='true';
    else if(name==='autofocus')props.autoFocus=true;
    else if(!name.startsWith('on')){
      const key=aliases[name]||(/^(stroke|fill|clip|font|text|marker|stop|vector|color)-/.test(name)?name.replace(/-([a-z])/g,(_,c:string)=>c.toUpperCase()):name);
      props[key]=booleanAttributes.has(name)?true:value;
    }
  }
  if(node.tag==='button'&&props.type==='text')props.type='button';
  return props;
}

export function element(node:CapturedElement,children:ReactNode,overrides:Record<string,unknown>={}) {
  const props={...nodeProps(node),...overrides};
  if(voidElements.has(node.tag))return createElement(node.tag,props);
  if(node.tag==='textarea'){props.defaultValue=node.children.filter(c=>typeof c==='string').join('');return createElement(node.tag,props);}
  return createElement(node.tag,props,children);
}

export function parseSspai(markup:string,mobileMarkup:string,dailyCards:string[],feedMenu:string,navigation:NavigationCaptures):CapturedNode[] {
  const doc=new DOMParser().parseFromString(markup,'text/html');
  const mobileDoc=new DOMParser().parseFromString(mobileMarkup,'text/html');
  const catalog=mobileDoc.querySelector('.article__bar__action--catalog');
  if(catalog&&!doc.querySelector('.article__bar__action--catalog'))doc.querySelector('.article__bar__actions')?.append(doc.importNode(catalog,true));
  const feed=doc.querySelector('.feed__main');if(feed)feed.setAttribute('data-reference-component','feed');
  const archive=doc.querySelector('.ss-article-card-wrapper')?.parentElement?.parentElement;
  if(archive){archive.setAttribute('data-reference-component','archive');archive.querySelectorAll(':scope > .articleCard').forEach(x=>x.remove());const fragment=doc.createElement('template');fragment.innerHTML=dailyCards.join('');archive.prepend(fragment.content);}
  const dropdown=doc.querySelector('.mobile-feed-dropdown');
  if(dropdown){const fragment=doc.createElement('template');fragment.innerHTML=feedMenu;dropdown.append(fragment.content);dropdown.querySelector('.mobile-feed-dropdown__menu')?.setAttribute('hidden','');}
  const check=dropdown?.querySelector('.mobile-feed-dropdown__menu__check');
  if(check)dropdown?.querySelectorAll('.mobile-feed-dropdown__menu__item').forEach(item=>{if(!item.querySelector('.mobile-feed-dropdown__menu__check'))item.append(check.cloneNode(true));});
  const appearance=doc.querySelector('.ss__appearance__setting__wrapper');if(appearance)doc.body.append(appearance);
  for(const selector of ['.ss__custom__header__search__mask','.ss__custom__header__search__input__wrapper']){const overlay=doc.querySelector(selector);if(overlay)doc.body.append(overlay);}
  const desktop=doc.querySelector('.ss__desktop__submenu__transition__wrapper');
  if(desktop){desktop.querySelector('.ss__desktop__submenu__wrapper')?.remove();for(const[name,capture]of Object.entries(navigation.desktop)){const fragment=doc.createElement('template');fragment.innerHTML=capture.html;const menu=fragment.content.firstElementChild!;menu.setAttribute('data-reference-menu',name);menu.setAttribute('hidden','');desktop.prepend(menu);}}
  const mobile=doc.querySelector('.comp__SsMobileSubmenu__wrapper');
  if(mobile){mobile.replaceChildren();for(const[name,capture]of Object.entries(navigation.mobile)){const fragment=doc.createElement('template');fragment.innerHTML=capture.html;const menu=fragment.content.firstElementChild!;menu.setAttribute('data-reference-menu',name);menu.setAttribute('hidden','');mobile.append(menu);}}
  doc.querySelectorAll('a[href],button[href]').forEach(x=>{const href=x.getAttribute('href');if(href)x.setAttribute('href',sspaiHref(href));});
  // Source CSS governs all widths; carousel dimensions are measured after mount.
  doc.querySelectorAll('.swiper-slide').forEach(x=>{(x as HTMLElement).style.removeProperty('width');(x as HTMLElement).style.removeProperty('height');});
  function convert(node:Node,key:string):CapturedNode|null {
    if(node.nodeType===Node.TEXT_NODE)return node.textContent||'';
    if(node.nodeType!==Node.ELEMENT_NODE)return null;
    const el=node as Element;
    return {tag:el.localName,attrs:Object.fromEntries([...el.attributes].map(a=>[a.name,a.value])),key,children:[...el.childNodes].map((c,i)=>convert(c,`${key}.${i}`)).filter((c):c is CapturedNode=>c!==null)};
  }
  return [...doc.body.childNodes].map((n,i)=>convert(n,String(i))).filter((n):n is CapturedNode=>n!==null);
}
