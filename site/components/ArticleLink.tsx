"use client";
import Link from "next/link";
import type { ComponentProps } from "react";
import { useCardNavigation } from "./CardNavigation";

/** A normal Next link, progressively enhanced only inside an identified article card. */
export default function ArticleLink({ onClick, ...props }: ComponentProps<typeof Link>) {
  const navigation = useCardNavigation();
  return <Link {...props} onClick={event => { onClick?.(event); navigation?.navigate(event); }} />;
}
