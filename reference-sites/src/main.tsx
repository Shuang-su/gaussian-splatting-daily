import {createRoot} from 'react-dom/client';
import {useEffect,useRef,useState} from 'react';
import type {Fixtures,Page,Site} from './model';
import {cleanRoute,variantFor} from './model';
import {SspaiPage} from './sspai/App';
import type {NavigationCaptures} from './sspai/markup';
import {connectRadiance} from './radiance';
import {connectSearch} from './search';
import './runtime.css';

declare const __REFERENCE_SITE__: Site;
const site=__REFERENCE_SITE__;
const fixtures = Promise.all(['pages','catalog','fragments','extra'].map(name=>fetch(`/data/${name}.json`).then(r=>r.json())))
  .then(([pages,catalog,fragments,extra])=>({pages,catalog,fragments,extra}) as Fixtures);
const templates=new Map<string,Promise<string>>();
function template(url:string) {if(!templates.has(url)) templates.set(url,fetch(url).then(r=>{if(!r.ok)throw Error(url);return r.text();}));return templates.get(url)!;}

function App() {
  return site==='sspai'?<SspaiApp/>:<RadianceApp/>;
}
function SspaiApp() {
  const [ready,setReady]=useState<{data:Fixtures;page:Page;markup:string;mobileMarkup:string;navigation:NavigationCaptures}>();
  const [error,setError]=useState('');
  useEffect(()=>{
    let cancelled=false;let sheet:HTMLLinkElement|undefined;
    fixtures.then(async data=>{
      const page=data.pages.find(p=>p.site==='sspai'&&cleanRoute(p.route)===cleanRoute(location.pathname));
      if(!page)throw Error('页面未收录');
      sheet=document.createElement('link');sheet.rel='stylesheet';sheet.href=new URL(page.styles,location.href).href;
      const cssReady=new Promise<void>((resolve,reject)=>{sheet!.onload=()=>resolve();sheet!.onerror=()=>reject(Error(page.styles));});document.head.append(sheet);
      const [markup,mobileMarkup,navigation]=await Promise.all([template(page.variants.desktop),template(page.variants.mobile),fetch('/data/sspai-navigation.json').then(r=>{if(!r.ok)throw Error('导航资料加载失败');return r.json();}),cssReady]);
      if(!cancelled){applyPage(page);setReady({data,page,markup,mobileMarkup,navigation});}
    }).catch(e=>{if(!cancelled)setError(String(e));});
    return()=>{cancelled=true;sheet?.remove();};
  },[]);
  if(error)return <main className="reference-error"><h1>{error}</h1><a href="/">首页</a></main>;
  return ready?<SspaiPage {...ready}/>:null;
}
function RadianceApp() {
  const host=useRef<HTMLDivElement>(null);
  const [data,setData]=useState<Fixtures>();
  const [variant,setVariant]=useState(()=>variantFor(site,innerWidth));
  const [error,setError]=useState('');
  useEffect(()=>{fixtures.then(setData).catch(e=>setError(String(e)));const resize=()=>setVariant(variantFor(site,innerWidth));addEventListener('resize',resize);return()=>removeEventListener('resize',resize);},[]);
  useEffect(()=>{
    if(!data||!host.current)return;
    const page=data.pages.find(p=>p.site===site&&cleanRoute(p.route)===cleanRoute(location.pathname));
    if(!page){setError(site==='sspai'?'页面未收录':'Page not included');return;}
    let cancelled=false;let disconnect=()=>{};
    delete host.current.dataset.ready;
    const sheet=document.createElement('link');sheet.rel='stylesheet';sheet.href=new URL(page.styles,location.href).href;
    const cssReady=new Promise<void>((resolve,reject)=>{sheet.onload=()=>resolve();sheet.onerror=()=>reject(Error(page.styles));});document.head.append(sheet);
    Promise.all([template(page.variants[variant]),cssReady]).then(([html])=>{
      if(cancelled||!host.current)return;
      applyPage(page);host.current.innerHTML=html;
      const root=host.current;
      const stopPage=connectRadiance(root,page,data);
      const stopSearch=connectSearch(root,site,data.catalog);
      const preventSubmit=(e:Event)=>e.preventDefault();root.addEventListener('submit',preventSubmit);
      root.dataset.ready='true';root.dataset.page=page.id;root.dataset.variant=variant;
      if(location.hash) document.getElementById(decodeURIComponent(location.hash.slice(1)))?.scrollIntoView();
      disconnect=()=>{stopPage();stopSearch();root.removeEventListener('submit',preventSubmit);};
    }).catch(e=>setError(String(e)));
    return()=>{cancelled=true;disconnect();sheet.remove();};
  },[data,variant]);
  return error?<main className="reference-error"><h1>{error}</h1><a href="/">{site==='sspai'?'首页':'Home'}</a></main>:<div ref={host} className="reference-document"/>;
}
function applyPage(page:Page) {document.title=page.title;document.documentElement.className='';document.body.className='';for(const[k,v]of page.htmlAttrs)document.documentElement.setAttribute(k,v);for(const[k,v]of page.bodyAttrs)document.body.setAttribute(k,v);document.body.dataset.referenceSite=site;}
createRoot(document.getElementById('reference-root')!).render(<App/>);
