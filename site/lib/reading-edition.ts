import { createHash } from "node:crypto";
import matter from "gray-matter";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import type { Root, RootContent } from "mdast";
import type { Article, EditorialEvent } from "./types";
import { sourceBlocks } from "./editorial";

type ReaderEvent = Pick<EditorialEvent, "id" | "group" | "judgment">;
type ParseArticle = (markdown: string, file: string) => Promise<Article>;
const headingText = (node: RootContent): string => "value" in node ? node.value : "children" in node ? node.children.map(n => headingText(n as RootContent)).join("") : "";
const idsIn = (html: string) => [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);

/** A reader edition is tied to an exact research record; it never replaces it. */
export async function applyReadingEdition(
  source: Article, sourceMarkdown: string, markdown: string, file: string, parse: ParseArticle,
): Promise<Article> {
  const { data, content } = matter(markdown);
  if (data.version !== 1 || data.report !== source.id || data.sourceHash !== source.contentHash)
    throw Error(`${file}: reading edition does not match its research record`);
  if (!data.headline?.trim() || !data.summary?.trim() || !Array.isArray(data.events) || !data.events.length)
    throw Error(`${file}: incomplete reading edition`);
  const nodes = (unified().use(remarkParse).use(remarkGfm).parse(content) as Root).children;
  const blocks = sourceBlocks(nodes, content);
  const starts = nodes.flatMap((node, index) => node.type === "heading" && node.depth === 2 ? [index] : []);
  if (starts[0] !== 0 || starts.length !== data.events.length || nodes.some(n => n.type === "heading" && n.depth === 1))
    throw Error(`${file}: each reading event needs one second-level heading`);
  const assigned = new Set<string>();
  const summaries = new Map<string, string>();
  const paperSummaries = { ...source.paperSummaries };
  const events: EditorialEvent[] = data.events.map((event: ReaderEvent, index: number) => {
    const original = source.events?.find(e => e.id === event.id);
    if (!original || assigned.has(event.id)) throw Error(`${file}: unknown or duplicate reading event ${event.id}`);
    assigned.add(event.id);
    const start = starts[index], end = starts[index + 1] ?? nodes.length;
    if (end - start < 2 || event.group === "main" && !event.judgment?.trim())
      throw Error(`${file}: reading event needs prose and a main-news judgment`);
    const paragraph = nodes.slice(start + 1, end).find(node => node.type === "paragraph");
    if (!paragraph) throw Error(`${file}: reading event needs a prose summary`);
    summaries.set(event.id, headingText(paragraph));
    const eventSource = blocks.slice(start, end).map(block => block.raw).join("\n");
    for (const match of eventSource.matchAll(/https:\/\/arxiv\.org\/abs\/(\d{4}\.\d{4,5})/g)) {
      if (source.paperSummaries[match[1]]) paperSummaries[match[1]] = headingText(paragraph);
    }
    return {
      id: original.id, anchor: original.anchor, title: headingText(nodes[start]),
      group: event.group, tags: original.tags,
      ...(event.judgment ? { judgment: event.judgment } : {}),
      ...(original.images ? { images: original.images } : {}), hideFirstHeading: true,
      aliases: [...new Set([...(original.aliases || []), ...idsIn(original.html)])],
      blocks: blocks.slice(start, end).map(block => block.key),
    };
  });
  const meta = structuredClone(matter(sourceMarkdown).data);
  meta.portal = {
    ...meta.portal, headline: data.headline, summary: data.summary, highlights: [],
    layout: "events", editorial: { version: 1, events, introduction: [], archive: [], omit: [] },
  };
  const reading = await parse(matter.stringify(content, meta), file);
  const guide = source.readingGuide ? { ...source.readingGuide, rows: [], leadingHtml: "", bodyHtml: "", afterHtml: "" } : undefined;
  const activeIds = new Set([...idsIn(reading.bodyHtml), guide?.id || "reading-guide"]);
  const archiveAliases = (source.events || []).filter(event => !assigned.has(event.id)).flatMap(event => [event.anchor, `group-${event.group}`]);
  // A legacy link opens the research details when its subject was not retained
  // in the reader body. Remove only duplicate IDs, preserving every source word.
  const archiveHtml = [...new Set(archiveAliases)].filter(id => !activeIds.has(id) && !idsIn(source.html).includes(id))
    .map(id => `<span id="${id}" class="legacy-anchor" aria-hidden="true"></span>`).join("") +
    source.html.replace(/ id="([^"]+)"/g, (attribute, id: string) => activeIds.has(id) ? "" : attribute);
  const paperTitles: Record<string, string> = data.paperTitles || {};
  for (const [id, title] of Object.entries(paperTitles)) {
    if (!source.paperSummaries[id] || typeof title !== "string" || !title.trim())
      throw Error(`${file}: invalid paper title correction ${id}`);
  }
  const sourceCorrections: Record<string, string> = data.sourceCorrections || {};
  for (const [id, url] of Object.entries(sourceCorrections)) {
    if (!source.highlights.some(e => e.id === id) || typeof url !== "string" || !/^https:\/\//.test(url))
      throw Error(`${file}: invalid source correction ${id}`);
  }
  return {
    ...source, headline: reading.headline, summary: reading.summary,
    events: reading.events, bodyHtml: reading.bodyHtml, text: reading.text,
    readingMinutes: reading.readingMinutes, introductionHtml: "", archiveHtml,
    readingGuide: guide, paperTitles, paperSummaries,
    highlights: source.highlights.map(entry => ({
      ...entry,
      ...(summaries.has(entry.id) ? { title: events.find(event => event.id === entry.id)!.title, summary: summaries.get(entry.id)! } : {}),
      ...(sourceCorrections[entry.id] ? { source: sourceCorrections[entry.id] } : {}),
    })),
    targets: [...new Set([...source.targets, ...reading.targets, ...archiveAliases])],
    readingEdition: { path: file, contentHash: createHash("sha256").update(markdown).digest("hex") },
  };
}
