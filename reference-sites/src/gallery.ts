import {Fancybox} from '@fancyapps/ui/dist/fancybox/fancybox.js';
import {zh_CN} from '@fancyapps/ui/dist/fancybox/l10n/zh_CN.js';
import '@fancyapps/ui/dist/fancybox/fancybox.css';
import {all} from './model';
export function connectGallery(root:HTMLElement) {
  const images=all<HTMLImageElement>(root,'[data-gallery]');
  for(const image of images){image.dataset.fancybox='daily';image.dataset.src=image.dataset.original||image.src;image.dataset.thumbSrc=image.src;}
  let trigger:HTMLElement|undefined,position=0;
  Fancybox.bind(root,'[data-fancybox]',{l10n:{...zh_CN,ROTATE_CCW:'向左旋转',ROTATE_CW:'向右旋转'},theme:'dark',idle:false,placeFocusBack:false,on:{init:api=>{trigger=api.getOptions().triggerEl;position=scrollY;},destroy:()=>{trigger?.focus({preventScroll:true});window.scrollTo({top:position,behavior:'instant'});}},Carousel:{Toolbar:{display:{left:['counter'],middle:[],right:['rotateCCW','rotateCW','download','thumbs','close']}},Thumbs:{type:'modern'}}});
  const key=(e:KeyboardEvent)=>{if((e.key==='Enter'||e.key===' ')&&(e.target as HTMLElement).matches('[data-fancybox]')){e.preventDefault();(e.target as HTMLElement).click();}};root.addEventListener('keydown',key);
  return()=>{root.removeEventListener('keydown',key);Fancybox.unbind(root);Fancybox.close();};
}
