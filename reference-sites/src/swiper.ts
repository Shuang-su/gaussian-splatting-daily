import {all} from './model';
import {stepSlide,visibleSelection} from './carousel-state';
export function connectCarousels(root:HTMLElement) {
  const cleanups:(()=>void)[]=[];
  for(const swiper of all<HTMLElement>(root,'.swiper-horizontal,.swiper-vertical')){
    const wrapper=swiper.querySelector<HTMLElement>(':scope > .swiper-wrapper');if(!wrapper)continue;
    const slides=all<HTMLElement>(wrapper,':scope > .swiper-slide');if(!slides.length)continue;
    const vertical=swiper.classList.contains('swiper-vertical');
    let preferred=slides.find(s=>s.classList.contains('swiper-slide-active'))||slides[0],active=preferred,start=0,dragged=false;
    const dots=all<HTMLElement>(swiper,'.swiper-pagination-bullet');
    const visible=()=>slides.filter(slide=>getComputedStyle(slide).display!=='none');
    function show(requested?:HTMLElement){
      if(requested)preferred=requested;
      const shown=visible(),selected=visibleSelection(shown,preferred,active);if(!selected)return;
      active=selected;
      const extent=vertical?swiper.clientHeight:swiper.clientWidth;if(!extent)return;
      slides.forEach(slide=>{slide.style[vertical?'height':'width']=extent+'px';slide.classList.toggle('swiper-slide-active',slide===active);slide.setAttribute('aria-hidden',String(slide!==active));});
      const index=shown.indexOf(active);
      wrapper!.style.transform=`translate3d(${vertical?0:-index*extent}px,${vertical?-index*extent:0}px,0)`;
      wrapper!.style.transitionDuration=matchMedia('(prefers-reduced-motion: reduce)').matches?'0ms':'300ms';
      dots.forEach((dot,i)=>{
        const slide=slides[i],position=shown.indexOf(slide);
        dot.hidden=position<0;dot.style.display=position<0?'none':'';
        dot.classList.toggle('swiper-pagination-bullet-active',slide===active);
        dot.setAttribute('aria-current',String(slide===active));
        dot.setAttribute('aria-label',`第 ${position+1} 张，共 ${shown.length} 张`);
      });
    }
    const abort=new AbortController(),signal=abort.signal;
    dots.forEach((dot,i)=>{dot.tabIndex=0;dot.setAttribute('role','button');dot.addEventListener('click',()=>show(slides[i]),{signal});dot.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();show(slides[i]);}},{signal});});
    swiper.addEventListener('pointerdown',e=>{start=vertical?e.clientY:e.clientX;dragged=false;},{signal});swiper.addEventListener('pointerup',e=>{const delta=(vertical?e.clientY:e.clientX)-start;dragged=Math.abs(delta)>45;if(dragged)show(stepSlide(visible(),active,delta<0?1:-1));},{signal});
    swiper.addEventListener('click',e=>{if(dragged){e.preventDefault();e.stopPropagation();dragged=false;}},{signal,capture:true});
    const observer=new ResizeObserver(()=>show());observer.observe(swiper);show();
    cleanups.push(()=>{abort.abort();observer.disconnect();});
  }
  return()=>cleanups.forEach(fn=>fn());
}
