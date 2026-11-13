import { unified } from "unified";
import remarkRehype from "remark-rehype";
import rehypeSanitize from "rehype-sanitize";
import rehypeStringify from "rehype-stringify";
import { visit } from "unist-util-visit";
import type { Root } from "mdast";
import { parseMarkdown } from "./markdown";
import type { ArticleRevision } from "./types";

export function validateFootnotes(tree: Root, source: string, file: string) {
  const ids = new Set<string>();
  visit(tree, "footnoteDefinition", node => {
    if (ids.has(node.identifier)) throw Error(`${file}: duplicate footnote ${node.identifier}`);
    if (!node.children.length) throw Error(`${file}: empty footnote ${node.identifier}`);
    ids.add(node.identifier);
  });
  visit(tree, "text", (node, _, parent) => {
    if (parent?.type === "link" || parent?.type === "linkReference" || !node.position) return;
    // remark leaves an unresolved footnote reference as text. Respect escaped examples.
    const raw = source.slice(node.position.start.offset, node.position.end.offset);
    const unresolved = raw.match(/(?:^|[^\\])\[\^([^\]\n]+)\](?!:)/);
    if (unresolved && node.value.includes(`[^${unresolved[1]}]`))
      throw Error(`${file}: undefined footnote ${unresolved[1]}`);
  });
}

function revisionDate(value: unknown) {
  const date = value instanceof Date && Number.isFinite(+value) ? value.toISOString().slice(0, 10) : value;
  if (typeof date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
  const timestamp = Date.parse(date);
  return Number.isFinite(timestamp) && new Date(timestamp).toISOString().slice(0, 10) === date ? date : null;
}

export async function parseRevisions(value: unknown, published: string, file: string): Promise<ArticleRevision[] | undefined> {
  if (value === undefined) return undefined;
  if (!Array.isArray(value)) throw Error(`${file}: revisions must be a list`);
  const ids = new Set<string>();
  const entries = await Promise.all(value.map(async item => {
    const date = revisionDate(item?.date);
    if (typeof item?.id !== "string" || !/^update-[1-9]\d*$/.test(item.id) || ids.has(item.id) || !date || date < published ||
      typeof item.title !== "string" || !item.title.trim() || typeof item.body !== "string" || !item.body.trim())
      throw Error(`${file}: invalid revision ${item?.id || ""}`);
    ids.add(item.id);
    const tree = parseMarkdown(item.body);
    validateFootnotes(tree, item.body, `${file}#${item.id}`);
    const renderer = unified().use(remarkRehype, {
      clobberPrefix: `${item.id}-`, footnoteLabel: "脚注", footnoteBackLabel: "返回正文",
    }).use(rehypeSanitize, { clobberPrefix: "" }).use(rehypeStringify);
    const rendered = await renderer.run(tree);
    visit(rendered, "element", node => {
      if (node.properties.id === "footnote-label") node.properties.id = `${item.id}-footnote-label`;
      if (Array.isArray(node.properties.ariaDescribedBy) && node.properties.ariaDescribedBy.includes("footnote-label"))
        node.properties.ariaDescribedBy = [`${item.id}-footnote-label`];
    });
    return { id: item.id as string, date, title: item.title.trim() as string, html: String(renderer.stringify(rendered)) };
  }));
  return entries.sort((first, second) => second.date.localeCompare(first.date));
}
