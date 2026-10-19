import { createHash } from "node:crypto";
import matter from "gray-matter";
import type { Root, RootContent } from "mdast";
import type { Article, EditorialEvent, Entry } from "./types";
import { sourceBlocks } from "./editorial";
import { parseMarkdown } from "./markdown";
import { imageKey } from "./images";

type ReaderEvent = Pick<EditorialEvent, "id" | "group" | "judgment"> & Partial<Pick<EditorialEvent, "anchor" | "tags" | "images">> & { source?: string; kind?: Entry["kind"]; sourceRefs?: string[] };
type ParseArticle = (markdown: string, file: string) => Promise<Article>;
const headingText = (node: RootContent): string => "value" in node ? node.value : "children" in node ? node.children.map(n => headingText(n as RootContent)).join("") : "";
const idsIn = (html: string) => [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);

/** A reader edition is tied to an exact research record; it never replaces it. */
export async function applyReadingEdition(
  source: Article, sourceMarkdown: string, markdown: string, file: string, parse: ParseArticle,
): Promise<Article> {
  const { data, content } = matter(markdown);
  if (![1, 2].includes(data.version) || data.report !== source.id || data.sourceHash !== source.contentHash)
    throw Error(`${file}: reading edition does not match its research record`);
  if (!data.headline?.trim() || !data.summary?.trim() || !Array.isArray(data.events) || !data.events.length)
    throw Error(`${file}: incomplete reading edition`);
  if (data.version === 2 && (typeof data.disclosure !== "string" || !data.disclosure.trim()))
    throw Error(`${file}: reading edition needs an editorial disclosure`);
  const nodes = parseMarkdown(content).children;
  const researchContent = matter(sourceMarkdown).content;
  const researchBlocks = new Map(sourceBlocks(parseMarkdown(researchContent).children, researchContent).map(block => [block.key, block.raw]));
  const blocks = sourceBlocks(nodes, content);
  const starts = nodes.flatMap((node, index) => node.type === "heading" && node.depth === 2 ? [index] : []);
  if (starts[0] !== 0 || starts.length !== data.events.length || nodes.some(n => n.type === "heading" && n.depth === 1))
    throw Error(`${file}: each reading event needs one second-level heading`);
  const assigned = new Set<string>();
  const summaries = new Map<string, string>();
  const paperSummaries = { ...source.paperSummaries };
  const events: EditorialEvent[] = data.events.map((event: ReaderEvent, index: number) => {
    const original = source.events?.find(e => e.id === event.id);
    if ((!original && data.version === 1) || assigned.has(event.id)) throw Error(`${file}: unknown or duplicate reading event ${event.id}`);
    if (data.version === 2) {
      if (!event.sourceRefs?.length || event.sourceRefs.some(ref => !researchBlocks.has(ref))) throw Error(`${file}: missing or stale research block mapping for ${event.id}`);
      if (!event.source || !/^https:\/\//.test(event.source) || !sourceMarkdown.includes(event.source) || !["paper", "tool", "news"].includes(event.kind || "")) throw Error(`${file}: invalid primary source for ${event.id}`);
      if (!original && (!event.anchor || !event.tags)) throw Error(`${file}: new reading event needs an anchor and tags`);
    }
    assigned.add(event.id);
    const start = starts[index], end = starts[index + 1] ?? nodes.length;
    if (end - start < 2 || event.group === "main" && !event.judgment?.trim())
      throw Error(`${file}: reading event needs prose and a main-news judgment`);
    const paragraph = nodes.slice(start + 1, end).find(node => node.type === "paragraph");
    if (!paragraph) throw Error(`${file}: reading event needs a prose summary`);
    summaries.set(event.id, headingText(paragraph));
    const eventSource = blocks.slice(start, end).map(block => block.raw).join("\n");
    for (const match of eventSource.matchAll(/https:\/\/arxiv\.org\/abs\/(\d{4}\.\d{4,5})/g)) {
      if (sourceMarkdown.includes(`arxiv:${match[1]}`)) paperSummaries[match[1]] = headingText(paragraph);
    }
    return {
      id: original?.id || event.id, anchor: original?.anchor || event.anchor!, title: headingText(nodes[start]),
      group: event.group, tags: original?.tags || event.tags!,
      ...(event.judgment ? { judgment: event.judgment } : {}),
      ...((event.images || original?.images) ? { images: event.images || original?.images } : {}), hideFirstHeading: true,
      aliases: [...new Set([...(original?.aliases || []), ...idsIn(original?.html || "")])],
      blocks: blocks.slice(start, end).map(block => block.key),
    };
  });
  const meta = structuredClone(matter(sourceMarkdown).data);
  meta.portal = {
    ...meta.portal, headline: data.headline, summary: data.summary, highlights: [],
    ...(data.image ? { image: data.image } : {}),
    layout: "events", editorial: { version: 1, events, introduction: [], archive: [], omit: [] },
  };
  const reading = await parse(matter.stringify(content, meta), file);
  const guide = source.readingGuide ? { ...source.readingGuide, rows: [], leadingHtml: "", bodyHtml: "", afterHtml: "" } : undefined;
  // Group wrappers are rendered by ArticleEvents, not stored in bodyHtml.
  const activeIds = new Set([...idsIn(reading.bodyHtml), ...(reading.events || []).map(event => `group-${event.group}`), guide?.id || "reading-guide"]);
  const archiveAliases = (source.events || []).filter(event => !assigned.has(event.id)).flatMap(event => [event.anchor, `group-${event.group}`]);
  // A legacy link opens the research details when its subject was not retained
  // in the reader body. Remove only duplicate IDs, preserving every source word.
  const archiveHtml = [...new Set(archiveAliases)].filter(id => !activeIds.has(id) && !idsIn(source.html).includes(id))
    .map(id => `<span id="${id}" class="legacy-anchor" aria-hidden="true"></span>`).join("") +
    source.html.replace(/ id="([^"]+)"/g, (attribute, id: string) => activeIds.has(id) ? "" : attribute);
  const paperTitles: Record<string, string> = data.paperTitles || {};
  for (const [id, title] of Object.entries(paperTitles)) {
    if (!sourceMarkdown.includes(`arxiv:${id}`) || typeof title !== "string" || !title.trim())
      throw Error(`${file}: invalid paper title correction ${id}`);
  }
  const sourceCorrections: Record<string, string> = data.sourceCorrections || {};
  for (const [id, url] of Object.entries(sourceCorrections)) {
    if (!source.highlights.some(e => e.id === id) || typeof url !== "string" || !/^https:\/\//.test(url))
      throw Error(`${file}: invalid source correction ${id}`);
  }
  const highlights = source.highlights.map(entry => ({
    ...entry,
    ...(summaries.has(entry.id) ? { title: events.find(event => event.id === entry.id)!.title, summary: summaries.get(entry.id)! } : {}),
    ...(sourceCorrections[entry.id] ? { source: sourceCorrections[entry.id] } : {}),
  }));
  if (data.version === 2) for (const event of events) {
    if (highlights.some(entry => entry.id === event.id)) continue;
    const mapping = data.events.find((entry: ReaderEvent) => entry.id === event.id) as ReaderEvent;
    highlights.push({ id: event.id, anchor: event.anchor, kind: mapping.kind!, source: mapping.source!, title: event.title, summary: summaries.get(event.id)!, date: source.date, topics: source.topics, image: event.images?.[0] });
  }
  return {
    ...source, headline: reading.headline, summary: reading.summary,
    events: reading.events, bodyHtml: reading.bodyHtml, text: reading.text,
    readingMinutes: reading.readingMinutes, introductionHtml: "", archiveHtml,
    readingGuide: guide, paperTitles, paperOriginalTitles: data.paperOriginalTitles || {}, paperSummaries, highlights,
    image: reading.image,
    images: [...new Map([...source.images, ...reading.images].map(image => [imageKey(image), image])).values()],
    editorialDisclosure: data.disclosure,
    targets: [...new Set([...source.targets, ...reading.targets, ...archiveAliases])],
    readingEdition: { path: file, contentHash: createHash("sha256").update(markdown).digest("hex") },
  };
}
