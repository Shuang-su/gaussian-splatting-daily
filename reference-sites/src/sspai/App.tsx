import {useEffect,useMemo,useRef,useState} from 'react';
import type {Fixtures,Page} from '../model';
import {variantFor} from '../model';
import {connectSspai} from '../sspai';
import {connectSearch} from '../search';
import {parseSspai,type NavigationCaptures} from './markup';
import {renderSspai} from './components';
import {readingKey,restoreReading,type FeedTab} from './state';

export function SspaiPage({page,data,markup,mobileMarkup,navigation}:{page:Page;data:Fixtures;markup:string;mobileMarkup:string;navigation:NavigationCaptures}) {
  const root=useRef<HTMLDivElement>(null);
  const initial=useMemo(()=>restoreReading(sessionStorage.getItem(readingKey(page.route)),data.extra.daily.length),[page,data]);
  const [feed,setFeed]=useState<FeedTab>(initial.feed);
  const [loaded,setLoaded]=useState(initial.loaded);
  const reading=useRef({feed,loaded,scroll:initial.scroll});
  reading.current={feed,loaded,scroll:reading.current.scroll};
  const nodes=useMemo(()=>parseSspai(markup,mobileMarkup,data.extra.daily,data.fragments['sspai-feed-menu'],navigation),[markup,mobileMarkup,data,navigation]);
  useEffect(()=>{
    const host=root.current!;
    const stopPage=connectSspai(host,page,{initialFeed:initial.feed,selectFeed:setFeed,loadMore:()=>setLoaded(value=>Math.min(value+12,data.extra.daily.length))});
    const stopSearch=connectSearch(host,'sspai',data.catalog);
    const resize=()=>{host.dataset.variant=variantFor('sspai',innerWidth);};
    const save=()=>{reading.current.scroll=scrollY;sessionStorage.setItem(readingKey(page.route),JSON.stringify(reading.current));};
    const submit=(event:Event)=>event.preventDefault();
    resize();host.dataset.ready='true';host.addEventListener('submit',submit);
    addEventListener('resize',resize);addEventListener('pagehide',save);
    const navigationType=(performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming|undefined)?.type;
    const frame=requestAnimationFrame(()=>{
      if(location.hash)document.getElementById(decodeURIComponent(location.hash.slice(1)))?.scrollIntoView();
      else if(navigationType==='back_forward')window.scrollTo({top:initial.scroll,behavior:'instant'});
    });
    return()=>{cancelAnimationFrame(frame);save();stopSearch();stopPage();host.removeEventListener('submit',submit);removeEventListener('resize',resize);removeEventListener('pagehide',save);};
  },[page,data,initial]);
  useEffect(()=>{sessionStorage.setItem(readingKey(page.route),JSON.stringify(reading.current));},[page.route,feed,loaded]);
  return <div ref={root} className="reference-document" data-page={page.id}>{renderSspai(nodes,feed,loaded,data.extra.daily.length)}</div>;
}
