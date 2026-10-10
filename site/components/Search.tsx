"use client";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { BASE, TOPICS } from "../lib/catalog";
import { searchItems } from "../lib/search";
import { clearSearchHistory, readSearchHistory, rememberSearch, searchTerm } from "../lib/search-history";
import type { PortalIndex } from "../lib/types";
import Icon from "./Icon";
import SearchHistory from "./SearchHistory";
import SourceImage from "./SourceImage";

const kinds = [["", "全部"], ["daily", "日报"], ["paper", "论文"], ["tool", "工具"], ["news", "动态"]] as const;
const kindLabel = { daily: "日报", paper: "论文", tool: "工具", news: "动态" };

export default function Search() {
  const [index, setIndex] = useState<PortalIndex>();
  const [error, setError] = useState(false);
  const [draft, setDraft] = useState("");
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState("");
  const [topic, setTopic] = useState("");
  const [recent, setRecent] = useState<string[]>([]);
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const sync = () => {
      const params = new URLSearchParams(location.search), term = searchTerm(params.get("q") || "");
      setDraft(term); setQuery(term);
      const savedKind = params.get("kind") || "", savedTopic = params.get("topic") || "";
      setKind(kinds.some(([value]) => value === savedKind) ? savedKind : "");
      setTopic(TOPICS.some((item) => item.slug === savedTopic) ? savedTopic : "");
      setRecent(readSearchHistory());
    };
    sync(); window.addEventListener("popstate", sync);
    const controller = new AbortController();
    fetch(`${BASE}/content-index.json`, { signal: controller.signal })
      .then((r) => { if (!r.ok) throw Error(); return r.json(); })
      .then(setIndex)
      .catch((reason) => { if (reason.name !== "AbortError") setError(true); });
    return () => { controller.abort(); window.removeEventListener("popstate", sync); };
  }, []);

  function commit(nextQuery: string, nextKind = kind, nextTopic = topic) {
    const term = searchTerm(nextQuery), params = new URLSearchParams();
    setQuery(term); setDraft(term); setKind(nextKind); setTopic(nextTopic);
    if (term) params.set("q", term);
    if (nextKind) params.set("kind", nextKind);
    if (nextTopic) params.set("topic", nextTopic);
    const suffix = params.toString();
    history.replaceState(history.state, "", `${location.pathname}${suffix ? "?" + suffix : ""}`);
  }

  const results = index ? searchItems(index.search, query, kind, topic) : [];
  const images = useMemo(() => new Map([...(index?.daily || []), ...(index?.entries || [])].map((item) => [item.id, item.image])), [index]);
  const hasSearch = Boolean(query || kind || topic);
  return <>
    <form className="search-query-bar search-page-query" role="search" onSubmit={(event) => {
      event.preventDefault();
      const term = searchTerm(draft);
      if (!term) { input.current?.focus(); return; }
      setRecent(rememberSearch(term)); commit(term);
    }}>
      <Icon name="search" /><input ref={input} value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="搜索高斯日报…" type="search" maxLength={160} aria-label="搜索高斯日报" />
      {draft && <button type="button" className="search-clear" aria-label="清空关键词" onClick={() => { commit(""); input.current?.focus(); }}><Icon name="close" /></button>}
      <button type="submit" aria-label="提交搜索"><Icon name="arrow" /></button>
    </form>
    <div className="search-toolbar">
      <div className="search-kind-options" role="group" aria-label="内容类型">{kinds.map(([value, label]) => <button key={value} type="button" aria-pressed={kind === value} onClick={() => commit(query, value)}>{label}</button>)}</div>
      <label className="search-topic-filter"><span className="search-visually-hidden">主题</span><select value={topic} onChange={(event) => commit(query, kind, event.target.value)}><option value="">全部主题</option>{TOPICS.map((item) => <option key={item.slug} value={item.slug}>{item.label}</option>)}</select></label>
    </div>
    <div className="search-layout">
      <div className="search-main">
        {hasSearch ? <>
          <p aria-live="polite" className="search-status">{error ? "搜索索引暂不可用，请稍后刷新。" : index ? `找到 ${results.length} 条结果${query ? `，关键词「${query}」` : ""}` : "正在加载搜索索引…"}</p>
          <div className="search-results">{results.map((result) => <article key={result.id}>
            <div className="search-result-copy"><p className="eyebrow">{result.kind === "daily" && <span>Metaflow · </span>}{result.date} · {kindLabel[result.kind]}</p><h2><Link href={result.url}>{result.title}</Link></h2><p className="search-result-summary">{result.summary}</p></div>
            {images.get(result.id) && <div className="search-result-image"><SourceImage image={images.get(result.id)} href={result.url} label={`阅读：${result.title}`} sizes="(max-width: 767px) 28vw, 164px" /></div>}
          </article>)}{index && !error && !results.length && <p className="search-empty">没有匹配结果。可减少关键词，或清除内容类型与主题筛选。</p>}</div>
        </> : <div className="search-start"><SearchHistory items={recent} onClear={() => { clearSearchHistory(); setRecent([]); input.current?.focus(); }} /><p className="search-empty">输入关键词，搜索日报、论文、工具和技术动态。</p></div>}
      </div>
      <aside className="search-topic-aside" aria-label="按主题搜索"><h2>相关主题</h2><div>{TOPICS.map((item) => <button key={item.slug} type="button" aria-pressed={topic === item.slug} onClick={() => commit(query, kind, topic === item.slug ? "" : item.slug)}>{item.label}</button>)}</div></aside>
    </div>
  </>;
}
