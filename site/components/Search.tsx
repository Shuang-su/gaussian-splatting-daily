"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { BASE, TOPICS } from "../lib/catalog";
import { searchItems } from "../lib/search";
import type { PortalIndex } from "../lib/types";
import Icon from "./Icon";
export default function Search() {
  const [index, setIndex] = useState<PortalIndex>();
  const [error, setError] = useState(false);
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState("");
  const [topic, setTopic] = useState("");
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    setQuery(params.get("q") || "");
    const savedKind = params.get("kind") || "";
    setKind(["daily", "paper", "tool", "news"].includes(savedKind) ? savedKind : "");
    const savedTopic = params.get("topic") || "";
    setTopic(TOPICS.some((item) => item.slug === savedTopic) ? savedTopic : "");
    fetch(`${BASE}/content-index.json`)
      .then((r) => {
        if (!r.ok) throw Error();
        return r.json();
      })
      .then(setIndex)
      .catch(() => setError(true));
  }, []);
  const results = index ? searchItems(index.search, query, kind, topic) : [];
  return (
    <>
      <form
        className="search-form"
        onSubmit={(e) => {
          e.preventDefault();
          const params = new URLSearchParams();
          if (query) params.set("q", query);
          if (kind) params.set("kind", kind);
          if (topic) params.set("topic", topic);
          const suffix = params.toString();
          history.replaceState(null, "", `${location.pathname}${suffix ? "?" + suffix : ""}`);
        }}
      >
        <label htmlFor="query">关键词</label>
        <div>
          <input
            id="query"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="搜索中文关键词、项目名或论文标题"
            type="search"
          />
          <button type="submit">搜索 <Icon name="arrow" /></button>
        </div>
        <div className="search-filters">
          <label>
            内容类型
            <select value={kind} onChange={(e) => setKind(e.target.value)}>
              <option value="">全部内容</option>
              <option value="daily">日报</option>
              <option value="paper">论文</option>
              <option value="tool">工具</option>
              <option value="news">动态</option>
            </select>
          </label>
          <label>
            主题
            <select value={topic} onChange={(e) => setTopic(e.target.value)}>
              <option value="">全部主题</option>
              {TOPICS.map((t) => (
                <option key={t.slug} value={t.slug}>
                  {t.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </form>
      <p aria-live="polite" className="search-status">
        {error
          ? "搜索索引暂不可用，请稍后刷新。"
          : index
            ? `找到 ${results.length} 条结果${query ? `，关键词「${query}」` : ""}`
            : "正在加载搜索索引…"}
      </p>
      <div className="search-results">
        {results.map((r) => (
          <article key={r.id}>
            <p className="eyebrow">
              {r.date} ·{" "}
              {
                { daily: "日报", paper: "论文", tool: "工具", news: "动态" }[
                  r.kind
                ]
              }
            </p>
            <h2>
              <Link href={r.url}>{r.title}</Link>
            </h2>
            <p>{r.summary}</p>
          </article>
        ))}
        {index && !results.length && (
          <p>没有匹配结果。可减少关键词，或清除内容类型与主题筛选。</p>
        )}
      </div>
    </>
  );
}
