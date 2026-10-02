import {all} from './model';
export function connectCarousels(root:HTMLElement) {
  const cleanups:(()=>void)[]=[];
  for(const swiper of all<HTMLElement>(root,'.swiper-horizontal,.swiper-vertical')){
    const wrapper=swiper.querySelector<HTMLElement>(':scope > .swiper-wrapper');if(!wrapper)continue;
    const slides=all<HTMLElement>(wrapper,':scope > .swiper-slide');if(!slides.length)continue;
    const vertical=swiper.classList.contains('swiper-vertical');let index=Math.max(0,slides.findIndex(s=>s.classList.contains('swiper-slide-active'))),start=0;
    const dots=all<HTMLElement>(swiper,'.swiper-pagination-bullet');
    function show(next:number){index=(next+slides.length)%slides.length;const extent=vertical?swiper.clientHeight:swiper.clientWidth;slides.forEach((slide,i)=>{slide.style[vertical?'height':'width']=extent+'px';slide.classList.toggle('swiper-slide-active',i===index);slide.setAttribute('aria-hidden',String(i!==index));});wrapper!.style.transform=`translate3d(${vertical?0:-index*extent}px,${vertical?-index*extent:0}px,0)`;wrapper!.style.transitionDuration='300ms';dots.forEach((d,i)=>{d.classList.toggle('swiper-pagination-bullet-active',i===index);d.setAttribute('aria-current',String(i===index));});}
    const abort=new AbortController(),signal=abort.signal;
    dots.forEach((dot,i)=>{dot.tabIndex=0;dot.setAttribute('role','button');dot.setAttribute('aria-label',`第 ${i+1} 张`);dot.addEventListener('click',()=>show(i),{signal});dot.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' ')show(i);},{signal});});
    swiper.addEventListener('pointerdown',e=>{start=vertical?e.clientY:e.clientX;},{signal});swiper.addEventListener('pointerup',e=>{const delta=(vertical?e.clientY:e.clientX)-start;if(Math.abs(delta)>45)show(index+(delta<0?1:-1));},{signal});
    const observer=new ResizeObserver(()=>show(index));observer.observe(swiper);show(index);
    cleanups.push(()=>{abort.abort();observer.disconnect();});
  }
  return()=>cleanups.forEach(fn=>fn());
}
