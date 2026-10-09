"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { calendarDate, type HomeSlide } from "../lib/home";
import Icon from "./Icon";
import SourceImage from "./SourceImage";

const INTERVAL = 8000;

export default function HomeCarousel({ slides }: { slides: HomeSlide[] }) {
  const [active, setActive] = useState(0);
  const [cycle, setCycle] = useState(0);
  const [paused, setPaused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(true);
  const [visible, setVisible] = useState(true);
  const elapsed = useRef({ key: "", value: 0 });
  const pointer = useRef<{ x: number; y: number } | null>(null);
  const swiped = useRef(false);
  const pagers = useRef<(HTMLButtonElement | null)[]>([]);
  const playing = slides.length > 1 && !paused && !hovered && !focused && !reducedMotion && visible;
  const key = `${active}-${cycle}`;

  useEffect(() => {
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updateMotion = () => setReducedMotion(motion.matches);
    const updateVisibility = () => setVisible(document.visibilityState === "visible");
    updateMotion(); updateVisibility();
    motion.addEventListener("change", updateMotion);
    document.addEventListener("visibilitychange", updateVisibility);
    return () => {
      motion.removeEventListener("change", updateMotion);
      document.removeEventListener("visibilitychange", updateVisibility);
    };
  }, []);

  useEffect(() => {
    if (elapsed.current.key !== key) elapsed.current = { key, value: 0 };
    if (!playing) return;
    const started = performance.now();
    const timer = window.setTimeout(() => {
      setActive((current) => (current + 1) % slides.length);
    }, Math.max(0, INTERVAL - elapsed.current.value));
    return () => {
      clearTimeout(timer);
      if (elapsed.current.key === key) elapsed.current.value += performance.now() - started;
    };
  }, [key, playing, slides.length]);

  function select(index: number) {
    setActive((index + slides.length) % slides.length);
    setCycle((current) => current + 1);
  }

  if (!slides.length) return null;
  const slide = slides[active];
  const date = calendarDate(slide.date);
  return <section className="home-hero" aria-label="精选日报" aria-roledescription="轮播">
    <div className="home-carousel" data-active-report={slide.date} data-source-sha256={slide.contentHash}
      data-playing={playing} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      onFocusCapture={() => setFocused(true)} onBlurCapture={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) setFocused(false);
      }}
      onPointerDown={(e) => {
        swiped.current = false;
        if (e.pointerType !== "mouse") pointer.current = { x: e.clientX, y: e.clientY };
      }}
      onPointerUp={(e) => {
        const start = pointer.current; pointer.current = null;
        if (!start) return;
        const dx = e.clientX - start.x, dy = e.clientY - start.y;
        if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.5) {
          swiped.current = true; select(active + (dx < 0 ? 1 : -1));
        }
      }} onPointerCancel={() => { pointer.current = null; }}
      onClickCapture={(e) => { if (swiped.current) { e.preventDefault(); e.stopPropagation(); swiped.current = false; } }}>
      <article className="home-slide" aria-label={`${active + 1} / ${slides.length}`}>
        <div className="home-slide-visual">
          {slide.image ? <SourceImage image={{ ...slide.image, fit: "cover" }} caption={false} previewable={false}
            priority={active === 0} sizes="(max-width: 767px) calc(100vw - 32px), 588px" />
            : <div className="image-unavailable">本期日报</div>}
          <div className="home-slide-date" aria-hidden="true"><span>{date.weekday}</span><strong>{date.day}</strong></div>
        </div>
        <div className="home-slide-copy"><h1>{slide.title}</h1></div>
        <Link className="home-slide-link" href={slide.url} aria-label={`${slide.date} 日报：${slide.title}`}><span className="sr-only">阅读全文</span></Link>
      </article>
      <div className="carousel-controls">
        <div className="carousel-pages" role="group" aria-label="选择日报">{slides.map((item, i) =>
          <button key={item.id} ref={(el) => { pagers.current[i] = el; }} className="carousel-page"
            aria-label={`查看 ${item.date} 日报`} aria-current={active === i ? "true" : undefined}
            onClick={() => select(i)} onKeyDown={(e) => {
              const next = e.key === "ArrowRight" ? (i + 1) % slides.length
                : e.key === "ArrowLeft" ? (i + slides.length - 1) % slides.length
                  : e.key === "Home" ? 0 : e.key === "End" ? slides.length - 1 : -1;
              if (next >= 0) { e.preventDefault(); select(next); pagers.current[next]?.focus(); }
            }}><span className="carousel-track">{active === i && <span key={key} className="carousel-progress" style={{ animationPlayState: playing ? "running" : "paused" }} />}</span></button>,
        )}</div>
        <button className="carousel-play" aria-label={paused ? "播放轮播" : "暂停轮播"} aria-pressed={paused}
          onClick={() => setPaused((current) => !current)}><Icon name={paused ? "play" : "pause"} /></button>
      </div>
      <p className="sr-only" aria-live={playing ? "off" : "polite"}>{slide.date} 日报，{slide.title}</p>
    </div>
  </section>;
}
