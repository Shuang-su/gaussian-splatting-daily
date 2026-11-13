"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { discussionFixture, sampleThread } from "../lib/discussions";
import type { DiscussionThread, FixtureMode } from "../lib/discussions";

type ThreadUpdate = (current: DiscussionThread) => DiscussionThread;
type State = { mode: FixtureMode | null; threads: Record<string, DiscussionThread>; update: (term: string, fallback: DiscussionThread, action: ThreadUpdate) => void };
const Context = createContext<State>({ mode: null, threads: {}, update: () => {} });
export default function DiscussionProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [mode, setMode] = useState<FixtureMode | null>(null);
  const [threads, setThreads] = useState<Record<string, DiscussionThread>>({});
  useEffect(() => {
    setMode(discussionFixture(location.hostname, new URLSearchParams(location.search).get("commentFixture")));
    setThreads({});
  }, [pathname]);
  const update = useCallback((term: string, fallback: DiscussionThread, action: ThreadUpdate) => {
    setThreads(previous => ({ ...previous, [term]: action(previous[term] || fallback) }));
  }, []);
  const value = useMemo(() => ({ mode, threads, update }), [mode, threads, update]);
  return <Context.Provider value={value}>{mode && <div className="discussion-fixture-banner" role="note"><strong>本地评论样本</strong><span>下方评论与表情均为演示；输入仅保留在当前页面。</span><a href="?">退出样本</a></div>}{children}</Context.Provider>;
}
export function useDiscussionSample(term: string, index = 0, daily = false) {
  const { mode, threads, update } = useContext(Context);
  const fallback = useMemo(() => sampleThread(mode, index, daily), [mode, index, daily]);
  return { mode, thread: threads[term] || fallback, update: (action: ThreadUpdate) => { if (fallback) update(term, fallback, action); } };
}
