"use client";
import Link from "next/link";
import { useCardNavigation } from "./CardNavigation";
import Icon from "./Icon";

export default function ArticleBack() {
  const navigation = useCardNavigation();
  const label = navigation?.hasSource ? "返回来源" : "返回日报列表";
  return <Link className="article-back" href={navigation?.returnHref || "/daily/"} aria-label={label} title={label} onClick={event => navigation?.back(event)}>
    <Icon name="arrow" /><span className="sr-only">{label}</span>
  </Link>;
}
