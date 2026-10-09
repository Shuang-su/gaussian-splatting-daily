export type IconName = "search" | "menu" | "close" | "theme" | "arrow" | "external" | "comment" | "edit" | "reaction" | "bookmark" | "home" | "paper" | "layers" | "tool" | "check" | "chevron" | "grid" | "play" | "pause";
export default function Icon({ name }: { name: IconName }) {
  const paths = {
    search: <><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 5 5" /></>,
    menu: <path d="M4 6h16M4 12h16M4 18h16" />,
    close: <path d="m6 6 12 12M6 18 18 6" />,
    theme: <><circle cx="12" cy="12" r="8" /><path d="M12 4v16a8 8 0 0 0 0-16" fill="currentColor" stroke="none" /></>,
    arrow: <path d="M4 12h16m-6-6 6 6-6 6" />,
    external: <><path d="M14 4h6v6M20 4l-9 9" /><path d="M10 4H5a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-5" /></>,
    comment: <><path d="M5 4h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-3v4l-5-4H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z"/><path d="M7 9h10M7 13h7"/></>,
    edit: <><path d="m15 4 5 5M4 20l5-1L21 7a2 2 0 0 0-5-5L4 14Z"/><path d="M13 20h8"/></>,
    reaction: <><path d="M20 12a8 8 0 1 0-8 8M8 9h.01M15 9h.01M8 13a4 4 0 0 0 7 0M19 16v6M16 19h6"/></>,
    bookmark: <path d="M6 3h12v18l-6-4-6 4Z"/>,
    home: <><path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1Z"/><path d="M9 21v-7a3 3 0 0 1 6 0v7"/></>,
    paper: <><rect x="5" y="3" width="15" height="18" rx="2"/><path d="M5 7H3v12a2 2 0 0 0 2 2M9 7h7M9 11h7M9 15h5"/></>,
    layers: <><path d="m3 7 9-5 9 5-9 5ZM3 12l9 5 9-5M3 17l9 5 9-5"/></>,
    tool: <path d="M14 4a6 6 0 0 0-7 7l-5 5a3 3 0 0 0 6 6l5-5a6 6 0 0 0 7-7l-4 4-4-4Z"/>,
    check: <path d="m5 12 4 4L19 6"/>,
    chevron: <path d="m7 10 5 5 5-5"/>,
    grid: <>{[5,12,19].flatMap((x) => [5,12,19].map((y) => <circle key={`${x}-${y}`} cx={x} cy={y} r="1.2" fill="currentColor" stroke="none"/>))}</>,
    play: <path d="m8 4 12 8-12 8Z"/>,
    pause: <path d="M8 5v14M16 5v14"/>,
  };
  return <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}
