export default function Icon({ name }: { name: "search" | "menu" | "close" | "theme" | "arrow" | "external" | "comment" | "edit" | "reaction" | "bookmark" }) {
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
  };
  return <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}
