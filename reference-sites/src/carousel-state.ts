// Preserve the requested content while a breakpoint temporarily hides its slide.
export function visibleSelection<T>(visible:T[], preferred:T, fallback:T):T|undefined {
  return visible.includes(preferred)?preferred:visible.includes(fallback)?fallback:visible[0];
}
export function stepSlide<T>(visible:T[], current:T, step:number):T|undefined {
  if(!visible.length)return undefined;
  const index=Math.max(0,visible.indexOf(current));
  return visible[((index+step)%visible.length+visible.length)%visible.length];
}
