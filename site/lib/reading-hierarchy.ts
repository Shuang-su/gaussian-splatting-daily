import { BASE, TOPICS } from "./catalog";

export const topicIndex = "/topics/";
const topicPaths = new Set(TOPICS.map(topic => `/topics/${topic.slug}/`));
const cataloguePaths = new Set([ ...topicPaths, "/papers/", "/tools/", "/articles/", "/features/", "/apps/" ]);

export function hierarchyPath(path: string) {
  const local = path.startsWith(`${BASE}/`) ? path.slice(BASE.length) : path;
  const pathname = local.split(/[?#]/)[0];
  return pathname.endsWith("/") ? pathname : `${pathname}/`;
}

export function isHierarchyLink(from: string, to: string) {
  const source = hierarchyPath(from), destination = hierarchyPath(to);
  return (source === topicIndex && topicPaths.has(destination)) ||
    (cataloguePaths.has(source) && /^\/articles\/[^/]+\/$/.test(destination));
}

export function hierarchyParent(path: string, contextPath?: string) {
  const current = hierarchyPath(path);
  if (topicPaths.has(current)) return topicIndex;
  if (contextPath && isHierarchyLink(contextPath, current)) return contextPath;
  return null;
}

export function editorialBackHref(path: string, contextPath?: string) {
  return /^\/articles\/[^/]+\/$/.test(hierarchyPath(path)) ? hierarchyParent(path, contextPath) : null;
}
