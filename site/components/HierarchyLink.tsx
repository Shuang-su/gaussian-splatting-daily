"use client";

import Link from "next/link";
import type { ComponentProps } from "react";
import { useCardNavigation } from "./CardNavigation";

export default function HierarchyLink({ parent, ...props }: ComponentProps<typeof Link> & { parent?: string }) {
  const navigation = useCardNavigation();
  return <Link {...props} onClick={event => navigation?.navigateHierarchy(event, parent)} />;
}
