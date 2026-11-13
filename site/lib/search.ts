import type { PortalIndex } from "./types";
export function searchItems(
  items: PortalIndex["search"],
  query: string,
  kind: string,
  topic: string,
) {
  const words = query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
  return items.filter(
    (item) =>
      (!kind || item.kind === kind || item.column === kind) &&
      (!topic || item.topics.includes(topic)) &&
      words.every((w) =>
        `${item.title} ${item.text}`.toLocaleLowerCase().includes(w),
      ),
  );
}
