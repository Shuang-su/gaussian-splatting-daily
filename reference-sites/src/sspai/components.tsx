import {memo,type ReactNode} from 'react';
import {element,hasClass,type CapturedElement,type CapturedNode} from './markup';
import type {FeedTab} from './state';

type FrameProps={node:CapturedElement;children:ReactNode};
export const Header=memo(function Header({node,children}:FrameProps){return element(node,children);});
export const Footer=memo(function Footer({node,children}:FrameProps){return element(node,children);});
export const DailyArticle=memo(function DailyArticle({node,children}:FrameProps){return element(node,children);});
export const ArticleCard=memo(function ArticleCard({node,children}:FrameProps){return element(node,children);});

export function HomeFeed({node,filter,render}:{node:CapturedElement;filter:FeedTab;render:(node:CapturedNode)=>ReactNode}) {
  const matches=(child:CapturedNode)=>typeof child==='string'||(filter!=='关注'&&(filter!=='话题讨论'||hasClass(child,'comboRecommendCard')||hasClass(child,'shortContentGroup'))&&(filter!=='热门内容'||hasClass(child,'article__card--important')));
  return element(node,<>{node.children.map(child=>typeof child==='string'?child:element(child,child.children.map(render),{hidden:!matches(child)}))}{filter==='关注'?<div className="reference-empty" role="status"><p>还没有关注的内容</p><a href="https://sspai.com/" target="_blank" rel="noopener noreferrer">前往少数派</a></div>:null}</>,{'data-feed-filter':filter});
}

export function DailyArchive({node,loaded,render}:{node:CapturedElement;loaded:number;render:(node:CapturedNode)=>ReactNode}) {
  let index=0;
  return element(node,node.children.map(child=>{
    if(typeof child==='string')return child;
    if(hasClass(child,'articleCard'))return index++<loaded?render(child):null;
    return render(child);
  }),{'data-loaded-count':loaded});
}

export function renderSspai(nodes:CapturedNode[],filter:FeedTab,loaded:number,total:number):ReactNode {
  const render=(node:CapturedNode):ReactNode=>{
    if(typeof node==='string')return node;
    if(node.attrs['data-reference-component']==='feed')return <HomeFeed key={node.key} node={node} filter={filter} render={render}/>;
    if(node.attrs['data-reference-component']==='archive')return <DailyArchive key={node.key} node={node} loaded={loaded} render={render}/>;
    const children=node.children.map(render);
    if(hasClass(node,'ss__loading__btn__load'))return element(node,children,{hidden:loaded>=total});
    if(node.tag==='header')return <Header key={node.key} node={node}>{children}</Header>;
    if(node.tag==='footer')return <Footer key={node.key} node={node}>{children}</Footer>;
    if(node.tag==='article')return hasClass(node,'article__card')?<ArticleCard key={node.key} node={node}>{children}</ArticleCard>:<DailyArticle key={node.key} node={node}>{children}</DailyArticle>;
    return element(node,children);
  };
  return nodes.map(render);
}
