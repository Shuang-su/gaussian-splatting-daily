import type {Fixtures} from './model';

/** Desktop dropdowns use the captured Framer menu markup and CSS. */
export function connectNavigation(root: HTMLElement, data: Fixtures, signal: AbortSignal) {
  let trigger: HTMLAnchorElement | undefined;
  let panel: HTMLElement | undefined;
  let closeTimer: ReturnType<typeof setTimeout> | undefined;
  const names = ['Learn', 'Tools', 'Services', 'About'];
  function close() {
    clearTimeout(closeTimer);
    trigger?.setAttribute('aria-expanded', 'false');
    trigger?.classList.remove('reference-nav-open');
    panel?.remove(); panel = undefined; trigger = undefined;
  }
  function open(link: HTMLAnchorElement) {
    clearTimeout(closeTimer);
    if (trigger === link) return;
    close(); trigger = link;
    const name = link.textContent!.trim().toLowerCase();
    const html = data.fragments[`rf-nav-${name}`];
    if (!html) return;
    const wrapper = document.createElement('div'); wrapper.innerHTML = html;
    panel = wrapper.firstElementChild as HTMLElement;
    panel.setAttribute('aria-label', `${link.textContent!.trim()} navigation`);
    panel.setAttribute('role', 'navigation');
    panel.style.position = 'fixed'; panel.style.zIndex = '10000';
    root.append(panel);
    const rect = link.getBoundingClientRect();
    const nav = link.closest('nav')!.getBoundingClientRect();
    panel.style.left = `${Math.max(8,Math.min(innerWidth-panel.offsetWidth-8,rect.x+rect.width/2-panel.offsetWidth/2))}px`;
    panel.style.top = `${nav.bottom+4}px`;
    link.setAttribute('aria-expanded', 'true'); link.classList.add('reference-nav-open');
    panel.addEventListener('pointerenter', () => clearTimeout(closeTimer), {signal});
    panel.addEventListener('pointerleave', () => {closeTimer=setTimeout(close,150);}, {signal});
  }
  root.querySelectorAll<HTMLAnchorElement>('nav a').forEach(link => {
    if (!names.includes(link.textContent!.trim())) return;
    link.setAttribute('aria-haspopup','true');link.setAttribute('aria-expanded','false');
    link.addEventListener('pointerenter', () => open(link), {signal});
    link.addEventListener('pointerleave', () => {closeTimer=setTimeout(close,150);}, {signal});
    link.addEventListener('focus', () => open(link), {signal});
    link.addEventListener('keydown', e => {if(e.key==='ArrowDown'){e.preventDefault();open(link);panel?.querySelector('a')?.focus();}}, {signal});
  });
  root.addEventListener('keydown',e=>{if(e.key==='Escape'&&panel){const previous=trigger;close();previous?.focus();close();}},{signal});
  document.addEventListener('pointerdown',e=>{if(panel&&!panel.contains(e.target as Node)&&!trigger?.contains(e.target as Node))close();},{signal});
  document.addEventListener('focusin',e=>{if(panel&&!panel.contains(e.target as Node)&&!trigger?.contains(e.target as Node))close();},{signal});
  window.addEventListener('scroll', close, {signal,passive:true});
  return close;
}
