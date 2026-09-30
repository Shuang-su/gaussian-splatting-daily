"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { REPO } from "../lib/catalog";
import BrandMark from "./BrandMark";
import Icon from "./Icon";
export default function Header() {
  const [open, setOpen] = useState(false);
  const [theme, setTheme] = useState("system");
  const pathname = usePathname();
  const menuButton = useRef<HTMLButtonElement>(null);
  useEffect(() => { setOpen(false); }, [pathname]);
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
    <header className="site-header" onKeyDown={(event) => {
      if (event.key === "Escape" && open) {
        setOpen(false);
        menuButton.current?.focus();
      }
    }}>
      <div className="header-inner">
        <Link href="/" className="brand" onClick={() => setOpen(false)}>
          <BrandMark />
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
                pathname === href || pathname === href.slice(0, -1) || (href !== "/" && pathname.startsWith(href))
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
            <Icon name="theme" />
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
          <Link href="/search/" className="search-link" aria-label="搜索" onClick={() => setOpen(false)}>
            <Icon name="search" />
            <span>搜索</span>
          </Link>
          <a
            className="github-link"
            href={REPO}
            target="_blank"
            rel="noopener noreferrer"
          >
            GitHub
          </a>
          <button
            ref={menuButton}
            className="menu-toggle"
            aria-label={open ? "关闭导航" : "打开导航"}
            aria-expanded={open}
            aria-controls="main-nav"
            onClick={() => setOpen(!open)}
          >
            <Icon name={open ? "close" : "menu"} />
          </button>
        </div>
      </div>
    </header>
  );
}
