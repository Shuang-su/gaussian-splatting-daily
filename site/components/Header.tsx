"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { REPO } from "../lib/catalog";
export default function Header() {
  const [open, setOpen] = useState(false);
  const [theme, setTheme] = useState("system");
  const pathname = usePathname();
  useEffect(() => {
    try {
      const saved = localStorage.getItem("gsd-theme");
      if (saved && ["system", "light", "dark"].includes(saved)) setTheme(saved);
    } catch {}
  }, []);
  function changeTheme(value: string) {
    setTheme(value);
    document.documentElement.dataset.theme = value;
    try {
      localStorage.setItem("gsd-theme", value);
    } catch {}
  }
  return (
    <header className="site-header">
      <div className="header-inner">
        <Link href="/" className="brand" onClick={() => setOpen(false)}>
          <span className="brand-mark" aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
          高斯日报
        </Link>
        <nav
          className={open ? "is-open" : ""}
          aria-label="主导航"
          id="main-nav"
        >
          {[
            ["/", "首页"],
            ["/daily/", "日报"],
            ["/papers/", "论文"],
            ["/tools/", "工具"],
            ["/topics/", "主题"],
          ].map(([href, label]) => (
            <Link
              key={href}
              href={href}
              aria-current={
                pathname === href || pathname === href.slice(0, -1)
                  ? "page"
                  : undefined
              }
              onClick={() => setOpen(false)}
            >
              {label}
            </Link>
          ))}
        </nav>
        <div className="header-actions">
          <label className="theme-select">
            <span aria-hidden="true">◐</span>
            <select
              aria-label="显示主题"
              value={theme}
              onChange={(e) => changeTheme(e.target.value)}
            >
              <option value="system">系统</option>
              <option value="light">浅色</option>
              <option value="dark">暗色</option>
            </select>
          </label>
          <Link href="/search/" className="search-link" aria-label="搜索">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="10.5" cy="10.5" r="6.5" />
              <path d="m16 16 5 5" />
            </svg>
            <span>搜索</span>
          </Link>
          <a
            className="github-link"
            href={REPO}
            target="_blank"
            rel="noopener noreferrer"
          >
            GitHub ↗
          </a>
          <button
            className="menu-toggle"
            aria-label={open ? "关闭导航" : "打开导航"}
            aria-expanded={open}
            aria-controls="main-nav"
            onClick={() => setOpen(!open)}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path
                d={open ? "M5 5l14 14M5 19 19 5" : "M4 6h16M4 12h16M4 18h16"}
              />
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
}
