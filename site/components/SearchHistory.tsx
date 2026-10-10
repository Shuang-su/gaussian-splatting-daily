"use client";
import { BASE } from "../lib/catalog";
import { rememberSearch } from "../lib/search-history";
import Icon from "./Icon";

export default function SearchHistory({ items, onClear, onNavigate }: { items: string[]; onClear: () => void; onNavigate?: () => void }) {
  if (!items.length) return null;
  return <section className="search-history" aria-label="搜索历史">
    <div className="search-history-label"><span>搜索历史</span><button type="button" aria-label="清空搜索历史" onClick={onClear}><Icon name="trash" /></button></div>
    <div className="search-history-items">{items.map((term) => <a key={term} href={`${BASE}/search/?${new URLSearchParams({ q: term })}`} onClick={() => { rememberSearch(term); onNavigate?.(); }}>{term}</a>)}</div>
  </section>;
}
