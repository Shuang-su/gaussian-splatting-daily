"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { editorialBackHref } from "../lib/reading-hierarchy";
import { useCardNavigation } from "./CardNavigation";
import Icon from "./Icon";

export default function ArticleBack() {
  const navigation = useCardNavigation();
  const pathname = usePathname();
  const parent = editorialBackHref(pathname, navigation?.contextPath);
  const href = navigation?.hasSource ? navigation.returnHref : parent || "/daily/";
  const label = navigation?.hasSource || parent ? "返回来源" : "返回日报列表";
  return <Link className="article-back reader-chrome-control" data-glass-surface href={href} aria-label={label} title={label} onClick={event => { if (navigation?.hasSource || parent) navigation?.back(event); }}>
    <Icon name="arrow" /><span className="sr-only">{label}</span>
  </Link>;
}
