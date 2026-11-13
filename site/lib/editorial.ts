import { createHash } from "node:crypto";
import type { RootContent } from "mdast";
import type { Root, Element } from "hast";
import { unified } from "unified";
import rehypeStringify from "rehype-stringify";
import type { Article, ArticleEvent, EditorialLayout } from "./types";
import { normalizeTags, validateTags } from "./taxonomy";
import { validImageUrl, assetUrl, imageKey, imageSrcSet } from "./images";

export function sourceBlocks(nodes: RootContent[], content: string) {
  const counts = new Map<string, number>();
  return nodes.map(node => {
    const raw = content.slice(node.position!.start.offset, node.position!.end.offset);
    const hash = createHash("sha256").update(raw).digest("hex").slice(0, 12);
    const count = (counts.get(hash) || 0) + 1; counts.set(hash, count);
    return { key: `b-${hash}-${count}`, node, raw };
  });
}
const serialize = (children: Root["children"]) => String(unified().use(rehypeStringify).stringify({ type: "root", children }));
const text = (node: any): string => node.value || node.children?.map(text).join("") || "";
export const cleanHeading = (title: string) => title.replace(/^\d+\.\s*/, "").replace(/^P[012][+−-]?(?:\s*补录)?\s*[：:—-]\s*/, "");
const category = /^(?:\d+\.\s*)?(?:今日最值得看|SuperSplat\s*\/\s*PlayCanvas 工具链|可实际运行的开源项目|4D\s*\/\s*Dynamic Gaussian|Viewer\s*\/\s*Editor|Compression\s*\/\s*Format|Training\s*\/\s*Reconstruction|Avatar\s*\/\s*Human|软件、硬件[与和]平台厂商|研究论文$|论文与研究|海外开发者社区信号|中文社区信号)/;

export function renderEvents(layout: EditorialLayout, nodes: RootContent[], content: string, rendered: Root["children"], guide: Article["readingGuide"], file: string) {
  const blocks = sourceBlocks(nodes, content);
  const byKey = new Map(blocks.map(block => [block.key, block]));
  const consumed = new Set<string>();
  const allIds = new Set<string>();
  const allocated = new Map<number, Root["children"]>();
  // Whitespace text nodes have no source position. All substantive nodes do.
  for (const node of rendered) {
    const offset = node.position?.start.offset;
    if (offset !== undefined) allocated.set(offset, [...(allocated.get(offset) || []), node]);
  }
  const groups = ["main", "brief", "paper", "analysis"];
  const reservedIds = new Set(layout.events.map(event => event.anchor));
  const reserve = (node: Root["children"][number]) => {
    if (node.type === "element") {
      if (node.properties.id) reservedIds.add(String(node.properties.id));
      node.children.forEach(reserve);
    }
  };
  rendered.forEach(reserve);
  let previousGroup = -1;
  const take = (keys: string[]) => keys.flatMap(key => {
    const block = byKey.get(key);
    if (!block || consumed.has(key)) throw Error(`${file}: missing or repeated source block ${key}`);
    consumed.add(key);
    return allocated.get(block.node.position!.start.offset!) || [];
  });
  const events: ArticleEvent[] = layout.events.map(event => {
    if (!event.id || !/^[a-zA-Z][a-zA-Z0-9_.:-]*$/.test(event.anchor) || allIds.has(event.id) || allIds.has(event.anchor)) throw Error(`${file}: invalid/repeated event identity ${event.id}`);
    allIds.add(event.id); allIds.add(event.anchor);
    if (!event.title.trim() || !event.blocks.length || !groups.includes(event.group)) throw Error(`${file}: incomplete event ${event.id}`);
    const group = groups.indexOf(event.group);
    if (group < previousGroup) throw Error(`${file}: event groups out of reading order`);
    previousGroup = group;
    const tags = normalizeTags(event.tags);
    validateTags(tags, file);
    for (const image of event.images || []) if (!validImageUrl(image.url) || !/^https:\/\//.test(image.source) || !image.alt?.trim() || !image.credit?.trim() || image.originalUrl && !validImageUrl(image.originalUrl)) throw Error(`${file}: invalid event image`);
    const children = take(event.blocks);
    let firstHeading = true;
    const body = children.map(node => {
      if (node.type !== "element" || !/^h[1-6]$/.test(node.tagName)) return node;
      const heading = text(node);
      const hide = category.test(heading) || (firstHeading && event.hideFirstHeading !== false);
      firstHeading = false;
      if (hide) {
        // Keep links carried only by a replaced heading, including primary paper sources.
        const links = (node.children || []).flatMap(function collect(n: any): Element[] { return n.type === "element" && n.tagName === "a" ? [n] : (n.children || []).flatMap(collect); });
        return { ...node, tagName: links.length ? "p" : "span", properties: { ...node.properties, className: [links.length ? "event-original-source" : "legacy-anchor"], ...(links.length ? {} : {ariaHidden:"true"}) }, children: links.map(link=>cleanHeading(text(link))===event.title ? {...link,children:[{type:"text",value:event.group === "paper" ? "论文原文" : "来源"}]} : link) } as Element;
      }
      let firstText = true;
      const stripPrefix = (child: any): any => {
        if (child.type === "text" && firstText) { firstText = false; return {...child,value:cleanHeading(child.value)}; }
        return child.children ? {...child,children:child.children.map(stripPrefix)} : child;
      };
      return { ...node, tagName: "h3", children: node.children.map(stripPrefix) } as Element;
    });
    // Old event anchors follow their source paragraph even after regrouping.
    for (const alias of event.aliases || []) {
      if (!reservedIds.has(alias)) {
        body.unshift({type:"element",tagName:"span",properties:{id:alias,className:["legacy-anchor"],ariaHidden:"true"},children:[]});
        reservedIds.add(alias);
      }
    }
    // Place figures between complete AST blocks, never by splitting HTML strings.
    let paragraph = 0;
    const pending = [...(event.images || [])];
    const figure = (image: import("./types").SourceImage): Element => ({ type: "element", tagName: "figure", properties: { className: ["source-image", "event-figure"] }, children: [
      { type: "element", tagName: "img", properties: { src: assetUrl(image.url), srcSet: imageSrcSet(image), width: image.width, height: image.height, alt: image.alt, loading: "lazy", decoding: "async", dataPreviewKey: imageKey(image), dataImageSource: image.source, dataImageCredit: image.credit, sizes: "(max-width: 767px) calc(100vw - 48px), 680px" }, children: [] },
      { type: "element", tagName: "figcaption", properties: {}, children: [{ type: "text", value: `${image.alt} · ` }, { type: "element", tagName: "a", properties: { href: image.source, target: "_blank", rel: ["noopener", "noreferrer"] }, children: [{ type: "text", value: image.credit }] }] },
    ] });
    const illustrated = body.flatMap(node => {
      if (node.type === "element" && node.tagName === "p" && !node.properties.className?.toString().includes("event-original-source")) paragraph++;
      const placed = pending.filter(image => image.afterParagraph === paragraph && paragraph > 0);
      for (const image of placed) pending.splice(pending.indexOf(image), 1);
      return [node, ...placed.map(figure)];
    });
    illustrated.push(...pending.map(figure));
    const rows = (event.guideRows || []).map(i => guide?.rows[i]).filter(row => Boolean(row));
    return { ...event, tags, sections: body.filter((node): node is Element=>node.type === "element" && node.tagName === "h3" && Boolean(node.properties.id)).map(node=>({id:String(node.properties.id),title:text(node)})), html: serialize(illustrated), judgment: event.judgment ? serialize([{type:"text",value:event.judgment}]) : rows.map(row => row!.details.at(-1)?.html || "").join(" "), context: rows.flatMap(row => row!.details.slice(0,-1)), sourceText: event.blocks.map(key => byKey.get(key)!.raw).join("\n\n") };
  });
  const introductionHtml = serialize(take(layout.introduction || []));
  const archiveHtml = serialize(take(layout.archive || []));
  for (const key of layout.omit || []) {
    const block = byKey.get(key);
    if (!block || block.node.type !== "heading" || !/深度情报日报|今日概览|今日最值得看/.test(text(block.node))) throw Error(`${file}: substantive content cannot be omitted: ${key}`);
  }
  take(layout.omit || []);
  const missing = blocks.filter(block => !consumed.has(block.key));
  if (missing.length) throw Error(`${file}: unassigned source blocks: ${missing.map(b => b.key).join(", ")}`);
  return { events, introductionHtml, archiveHtml };
}
