import fs from "node:fs";
import { createHash } from "node:crypto";
import path from "node:path";
import matter from "gray-matter";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import rehypeSlug from "rehype-slug";
import rehypeStringify from "rehype-stringify";
import { visit } from "unist-util-visit";
import type { Root as HastRoot, Element } from "hast";
import type { Root as MdRoot, RootContent } from "mdast";
import type { Article, Daily, Entry, PortalIndex, SourceImage } from "./types";
import { assetUrl, imageKey, imageSrcSet, validImageUrl } from "./images";

import { renderEvents } from "./editorial";
import { applyReadingEdition } from "./reading-edition";
import { parseMarkdown } from "./markdown";
import { parseRevisions, validateFootnotes } from "./revisions";
import { loadLongform, loadWeeklyEditorial } from "./longform";
import { buildWeekly } from "./feeds";
import { REPO, BASE, TOPICS, dailyUrl, entryUrl } from "./catalog";
export { REPO, BASE, TOPICS, dailyUrl, entryUrl } from "./catalog";
export { SITE_URL } from "./catalog";
export const ROOT = path.resolve(
  process.cwd(),
  process.cwd().endsWith("/site") ? ".." : ".",
);
export function plain(node: unknown): string {
  if (!node || typeof node !== "object") return "";
  const n = node as { type?: string; value?: string; children?: unknown[] };
  if (n.type === "html") return "";
  return n.value ?? n.children?.map(plain).join("") ?? "";
}
function topicsFor(text: string) {
  return TOPICS.filter((t) => t.pattern.test(text)).map((t) => t.slug);
}
type ImageManifest = Record<string, SourceImage>;
const NON_CATALOGUE_FIGURES = new Set([
  "https://arxiv.org/html/2609.36969v1/figures/ladybug6.jpg",
  "https://arxiv.org/html/2609.35619v1/figures/pr_curve-new.png",
]);
// These legacy section headings are editorial labels; catalogue titles use the
// paper names already recorded in their canonical report, without changing IDs.
const LEGACY_PAPER_TITLES: Record<string, string> = {
  "COSA-GS：今天最值得看的论文+代码压缩路线": "COSA-GS",
  "φ-RIE：这条对“从实景到可交互世界”很值得关注": "φ-RIE: From Photorealistic Reconstruction to Interactive Environments",
  "Dynamic Thermal Gaussians：本轮最值得看的 4DGS 项目": "Dynamic Thermal Gaussians: Multimodal 4D Gaussian Splatting",
  "EliGSiR：很值得加入 Continual GS Mapping 监控": "EliGSiR: Continual RGB-D Mapping with Gaussian Splatting under Bounded Compute",
  "PlenoCI：变化检测不是比较 Gaussian primitive": "PlenoCI: Plenoptic CharacterIstics for View Dependence Aware Change Classification",
  "GaussPDE：把 Gaussian 本身当 PDE 离散域": "GaussPDE: Graph-Based Partial Differential Equation-Driven Rendering for 3D Gaussian Splatting",
  "GS-PI：把 baked-radiance GS 变成 PBR Gaussian Asset": "GS-PI: An Optimization-Decoupled Appearance Decomposition Approach for Generating PBR Gaussian Assets",
  "BayesianGS-SLAM：代码真正放出来了": "BayesianGS-SLAM: Uncertainty-Aware Neural Rendering SLAM via Probabilistic Formulation",
  "Cube-Splat：360° Gaussian SLAM 值得加入固定监控": "Cube-Splat: High-Fidelity 360° Gaussian Splatting SLAM via Cubemap Factorization and Adjoint-Consistent Optimization",
};
function loadImageManifest(root: string): ImageManifest {
  const file = path.join(root, "site/public/media/manifest.json");
  const read = (file: string) => (JSON.parse(fs.readFileSync(file,"utf8")) as {images?:ImageManifest}).images || {};
  const images = fs.existsSync(file) ? read(file) : {};
  const dailyRoot = path.join(root,"site/public/daily-media");
  if (fs.existsSync(dailyRoot)) for (const date of fs.readdirSync(dailyRoot).sort()) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw Error(`Invalid daily-media directory: ${date}`);
    Object.assign(images, read(path.join(dailyRoot,date,"manifest.json")));
  }
  return images;
}
function resolveImage(image: SourceImage, media: ImageManifest): SourceImage {
  const mapped = media[image.originalUrl || image.url];
  return mapped ? { ...image, ...mapped, alt: mapped.alt || image.alt } : image;
}
function imageFromNode(node: RootContent, media: ImageManifest): SourceImage | undefined {
  let image: SourceImage | undefined;
  visit(node, "image", (n) => {
    // Equipment photos and benchmark plots stay in the article, not its listing.
    if (!image && /^https:\/\//.test(n.url) && !NON_CATALOGUE_FIGURES.has(n.url))
      image = resolveImage({
        url: n.url,
        alt: n.alt || "论文或项目官方图示",
        source: n.url,
        credit: "原论文作者",
      }, media);
  });
  return image;
}
export async function parseArticle(
  markdown: string,
  filePath: string,
  media: ImageManifest = loadImageManifest(ROOT),
): Promise<Article> {
  const { data: meta, content } = matter(markdown);
  const tree = parseMarkdown(content);
  validateFootnotes(tree, content, filePath);
  const reportIndex = tree.children.findIndex(
    (n) => n.type === "heading" && /深度情报日报|今日概览/.test(plain(n)),
  );
  const bodyNodes = tree.children.filter((_, i) => i !== reportIndex);
  const text = bodyNodes.map(plain).join("\n");
  const date =
    typeof meta.date === "string"
      ? meta.date
      : meta.date.toISOString().slice(0, 10);
  const portal = meta.portal || {};
  const revisions = await parseRevisions(meta.revisions, date, filePath);
  const paperSummaries: Record<string, string> = portal.paperSummaries || {};
  for (const [id, summary] of Object.entries(paperSummaries)) {
    if (!/^\d{4}\.\d{4,5}$/.test(id) || typeof summary !== "string" || !summary.trim())
      throw Error(`${filePath}: invalid paper summary ${id}`);
  }
  const toc: Article["toc"] = [];
  const images: SourceImage[] = [];
  const targets = new Set<string>();
  const eventAnchors = new Map<string, string>();
  let introductionHtml = "";
  let archiveHtml = "";
  let readingGuide: Article["readingGuide"];
  let events: Article["events"];
  const serialize = (children: HastRoot["children"]) =>
    String(
      unified().use(rehypeStringify).stringify({ type: "root", children }),
    );
  let tableIndex = 0;
  let bodyHtml = "";
  let footnotesHtml: string | undefined;
  const rawHighlights = (portal.highlights || []) as (Entry & { section?: string })[];
  const collect = () => (root: HastRoot) => {
    visit(root, "element", (node: Element) => {
      if (/^h[1-6]$/.test(node.tagName) && !String(node.properties.id).endsWith("footnote-label")) {
        const depth = Number(node.tagName[1]);
        // Keep every historical heading ID, including the afternoon increment.
        if (depth === 1) node.tagName = "h2";
        const id = String(node.properties.id);
        targets.add(id);
        toc.push({ id, title: plain(node), depth: Math.max(2, depth) });
      }
      if (node.tagName === "a" && typeof node.properties.href === "string") {
        if (/^https?:/.test(node.properties.href)) node.properties.rel = ["noopener", "noreferrer"];
        if (/\.md(?:#.*)?$/.test(node.properties.href) && !/^https?:/.test(node.properties.href)) {
          node.properties.href = `${REPO}/blob/main/${path.posix.normalize(path.posix.join(path.posix.dirname(filePath), node.properties.href))}`;
        }
      }
      if (node.tagName === "img") {
        const url = String(node.properties.src || "");
        const paper = url.match(/arxiv\.org\/html\/(\d{4}\.\d{4,5})/)?.[1];
        if (/^https:\/\//.test(url)) {
          const image = resolveImage({
            url,
            alt: String(node.properties.alt || "原文图示"),
            source: paper ? `https://arxiv.org/abs/${paper}` : url,
            credit: paper ? `论文 ${paper} 作者` : "原文图片",
          }, media);
          images.push(image);
          if (image.alt !== node.properties.alt) node.properties.dataOriginalAlt = String(node.properties.alt || "");
          node.properties.alt = image.alt;
          node.properties.src = assetUrl(image.url);
          node.properties.srcSet = imageSrcSet(image);
          node.properties.sizes = "(max-width: 780px) calc(100vw - 48px), 680px";
          node.properties.width = image.width;
          node.properties.height = image.height;
          node.properties.dataPreviewKey = imageKey(image);
          node.properties.dataImageSource = image.source;
          node.properties.dataImageCredit = image.credit;
        }
        node.properties.loading = "lazy";
        node.properties.decoding = "async";
      }
      if (node.tagName === "table" && tableIndex++ === 0) {
        node.properties.className = ["overview-table"];
        const labels: string[] = [];
        visit(node, "element", (cell: Element) => { if (cell.tagName === "th") labels.push(plain(cell)); });
        visit(node, "element", (row: Element) => {
          if (row.tagName !== "tr") return;
          let column = 0;
          for (const child of row.children) if (child.type === "element" && child.tagName === "td") child.properties.dataLabel = labels[column++] || "";
        });
      }
    });

    const headingOffset = reportIndex < 0 ? -1 : tree.children[reportIndex].position?.start.offset ?? -1;
    const prefix = new Set(root.children.filter((node) => node.position?.start.offset !== undefined && node.position.start.offset < headingOffset));
    const start = root.children.findIndex((node) => node.type === "element" && node.tagName === "h2" && /今日最值得看/.test(plain(node)));
    let end = start < 0 ? 0 : start + 1;
    while (end < root.children.length && !(root.children[end].type === "element" && (root.children[end] as Element).tagName === "h2")) end++;
    const section = start < 0 ? [] : root.children.slice(start + 1, end);
    const table = section.find((node) => node.type === "element" && node.tagName === "table") as Element | undefined;
    const labels: string[] = [];
    const rows: NonNullable<Article["readingGuide"]>["rows"] = [];
    const overview = new Set(start < 0 ? [] : root.children.slice(start, end));
    const archivedSections = new Set<HastRoot["children"][number]>();
    for (let index = 0; index < root.children.length; index++) {
      const node = root.children[index];
      if (node.type !== "element" || !/^h[2-6]$/.test(node.tagName) || plain(node) !== "记录与校验口径") continue;
      const depth = Number(node.tagName[1]);
      let stop = index + 1;
      while (stop < root.children.length) {
        const next = root.children[stop];
        if (next.type === "element" && /^h[2-6]$/.test(next.tagName) && Number(next.tagName[1]) <= depth) break;
        stop++;
      }
      for (const archived of root.children.slice(index, stop)) archivedSections.add(archived);
    }
    const contentNodes = root.children.filter((node, index) => !prefix.has(node) && !overview.has(node) && !archivedSections.has(node) && (start < 0 || index >= end));
    const candidates = contentNodes.filter((node): node is Element => node.type === "element");
    const additions = new Map<HastRoot["children"][number], Element[]>();
    const notes = new Map<HastRoot["children"][number], Element[]>();
    const targetNodes = new Map<string, HastRoot["children"][number]>();
    function sourceKey(url: string): string {
      const paper = url.match(/^https:\/\/(?:www\.)?arxiv\.org\/abs\/(\d{4}\.\d{4,5})(?:v\d+)?(?:[#?].*)?$/);
      return paper ? `arxiv:${paper[1]}` : url.replace(/#.*$/, "").replace(/\/$/, "");
    }
    function findTarget(sources: string[], title: string, sectionTitle?: string): Element | undefined {
      const keys = sources.map(sourceKey);
      const repository = sources.map((source) => source.match(/^https:\/\/github\.com\/[^/]+\/([^/#?]+)\/?(?:#.*)?$/)?.[1]).find(Boolean);
      if (repository) {
        const name = repository.toLowerCase().replace(/[^a-z0-9]/g, "");
        const named = candidates.find((candidate) => candidate.tagName === "p" && candidate.children.some((child) => child.type === "element" && child.tagName === "strong" && plain(child).toLowerCase().replace(/[^a-z0-9]/g, "").startsWith(name)));
        if (named) return named;
      }
      const linked = candidates.find((candidate) => {
        let found = false;
        visit(candidate, "element", (node: Element) => {
          if (node.tagName === "a" && keys.includes(sourceKey(String(node.properties.href || "")))) found = true;
        });
        return found;
      });
      if (linked) return linked;
      const ticket = title.match(/#(\d+)/)?.[1];
      if (ticket) {
        const numbered = candidates.find((node) => /^h[2-6]$/.test(node.tagName) && new RegExp(`#${ticket}(?!\\d)`).test(plain(node)));
        if (numbered) return numbered;
      }
      const named = sectionTitle && candidates.find((node) => /^h[2-6]$/.test(node.tagName) && plain(node) === sectionTitle.replace(/[*`]/g, ""));
      return named || candidates.find((node) => /^h[2-6]$/.test(node.tagName)) || candidates[0];
    }
    function bindEvent(identity: string, sources: string[], title: string, sectionTitle?: string, explicit?: string): string {
      if (explicit && targets.has(explicit)) {
        const node = candidates.find((node) => node.properties.id === explicit);
        if (node) targetNodes.set(explicit, node);
        return explicit;
      }
      const node = findTarget(sources, title, sectionTitle);
      if (!node) return "";
      const id = explicit || `event-${createHash("sha256").update(identity).digest("hex").slice(0, 12)}`;
      if (!/^[a-zA-Z][a-zA-Z0-9_.:-]*$/.test(id)) throw Error(`${filePath}: invalid event anchor ${id}`);
      if (!targets.has(id)) {
        const marker: Element = { type: "element", tagName: "span", properties: { id, className: ["event-anchor"], ariaHidden: "true" }, children: [] };
        additions.set(node, [...(additions.get(node) || []), marker]);
        targets.add(id);
      }
      targetNodes.set(id, node);
      return id;
    }
    for (const entry of rawHighlights) {
      eventAnchors.set(entry.id, bindEvent(entry.id, [entry.source], entry.title, entry.section, entry.anchor));
    }
    if (table) visit(table, "element", (node: Element) => {
      if (node.tagName === "th") labels.push(plain(node));
      if (node.tagName !== "tr") return;
      const cells = node.children.filter((child): child is Element => child.type === "element" && child.tagName === "td");
      if (cells.length < 2) return;
      const sources: string[] = [];
      visit(cells[1], "element", (link: Element) => { if (link.tagName === "a" && /^https:\/\//.test(String(link.properties.href))) sources.push(String(link.properties.href)); });
      const entry = rawHighlights.find((entry) => sources.some((source) => sourceKey(source) === sourceKey(entry.source)));
      const title = entry?.title || plain(cells[1]);
      const anchor = entry ? eventAnchors.get(entry.id) || "" : bindEvent(`overview:${sources[0] || title}`, sources, title);
      rows.push({
        priority: plain(cells[0]), title, anchor, sources,
        details: cells.slice(2).map((cell, i) => ({ label: labels[i + 2] || "说明", html: serialize(cell.children) })),
      });
      const target = targetNodes.get(anchor);
      if (target) {
        // Preserve every overview-cell statement at the corresponding event.
        // The short guide itself only needs the editorial title and the target.
        const context: Element = { type: "element", tagName: "div", properties: { className: ["event-summary"] }, children: [
          { type: "element", tagName: "p", properties: {}, children: [
            ...cells[1].children,
            { type: "text", value: " " },
            { type: "element", tagName: "small", properties: { className: ["event-priority"] }, children: cells[0].children },
          ] },
          ...cells.slice(2).map((cell) => ({ type: "element" as const, tagName: "p", properties: {}, children: cell.children })),
        ] };
        notes.set(target, [...(notes.get(target) || []), context]);
      }
    });
    const hasGuide = Boolean(table && rows.length && /优先级/.test(labels[0] || ""));
    const leading = hasGuide ? root.children.slice(0, start).filter((node) => !prefix.has(node)) : [];
    const introduction: HastRoot["children"] = [];
    const archive: HastRoot["children"] = [...prefix];
    function splitProcessParagraph(node: HastRoot["children"][number]): HastRoot["children"][number] | undefined {
      if (node.type !== "element" || node.tagName !== "p") return node;
      const kept: Element["children"] = [];
      const moved: Element["children"] = [];
      for (const child of node.children) {
        if (child.type !== "text") { kept.push(child); continue; }
        // Only these existing publication-process sentences move to the archive.
        for (const sentence of child.value.split(/(?<=[。！？])/)) {
          const destination = ["原自动化已于今日上午", "此版在同一日期正文里", "以下保留 PR #30 原始 canonical arXiv ID"].some((text) => sentence.trim().startsWith(text)) ? moved : kept;
          if (sentence) destination.push({ type: "text", value: sentence });
        }
      }
      if (!moved.length) return node;
      archive.push({ ...node, children: moved });
      return kept.some((child) => child.type !== "text" || child.value.trim()) ? { ...node, children: kept } : undefined;
    }
    for (const node of leading) {
      const retained = splitProcessParagraph(node);
      if (retained) introduction.push(retained);
    }
    introductionHtml = serialize([...introduction, ...(hasGuide ? section.filter((node) => node !== table) : [])]);
    const displayed = root.children.filter((node, index) => (!hasGuide || index >= end) && !prefix.has(node) && !archivedSections.has(node));
    bodyHtml = serialize(displayed.flatMap((node) => {
      const retained = splitProcessParagraph(node);
      // Keep the original heading ID while removing its publishing-process suffix.
      const rendered = retained?.type === "element" && /^h[2-6]$/.test(retained.tagName) && plain(retained) === "10. 论文与研究：保留上午自动归档的 12 条"
        ? { ...retained, children: [{ type: "text" as const, value: "10. 论文与研究" }] }
        : retained;
      return [...(additions.get(node) || []), ...(rendered ? [rendered] : []), ...(hasGuide ? notes.get(node) || [] : [])];
    }));
    archiveHtml = serialize([...archive, ...archivedSections]);
    if (hasGuide) {
      const heading = root.children[start] as Element;
      readingGuide = { id: String(heading.properties.id), title: "今日最值得看", rows, leadingHtml: "", bodyHtml, afterHtml: "" };
    }
    if (portal.layout === "events") {
      if (!portal.editorial || portal.editorial.version !== 1) throw Error(`${filePath}: invalid editorial layout`);
      const footnotes = root.children.filter(node => node.type === "element" && Object.hasOwn(node.properties, "dataFootnotes"));
      if (footnotes.length) footnotesHtml = serialize(footnotes);
      const eventNodes = root.children.filter(node => !footnotes.includes(node)).map(splitProcessParagraph).filter((node): node is HastRoot["children"][number] => Boolean(node));
      const layout = renderEvents({ ...portal.editorial, events: portal.editorial.events.map((event: import("./types").EditorialEvent) => ({ ...event, images: event.images?.map(image => resolveImage(image, media)) })) }, tree.children, content, eventNodes, readingGuide, filePath);
      events = layout.events;
      introductionHtml = layout.introductionHtml;
      archiveHtml = layout.archiveHtml + serialize([...new Map(archive.filter(node => !prefix.has(node)).map(node => [serialize([node]), node])).values()]);
      for (const event of events) { targets.add(event.anchor); for (const alias of event.aliases || []) targets.add(alias); }
      bodyHtml = events.map(event => `<section id="${event.anchor}">${event.html}</section>`).join("\n");
    }
    root.children = root.children.flatMap((node) => [...(additions.get(node) || []), node]);
  };
  const renderer = unified()
.use(remarkRehype, {
      clobberPrefix: filePath.startsWith("docs/reading/") ? "reader-" : "user-content-",
      footnoteLabel: "脚注", footnoteBackLabel: "返回正文",
    })
    .use(rehypeSanitize, { ...defaultSchema, clobberPrefix: "", tagNames: [...defaultSchema.tagNames!, "details", "summary"], attributes: { ...defaultSchema.attributes, details: ["className"] } })
    .use(() => (root: HastRoot) => {
      if (!filePath.startsWith("docs/reading/")) return;
      visit(root, "element", node => {
        if (node.properties.id === "footnote-label") node.properties.id = "reader-footnote-label";
        if (Array.isArray(node.properties.ariaDescribedBy) && node.properties.ariaDescribedBy.includes("footnote-label"))
          node.properties.ariaDescribedBy = ["reader-footnote-label"];
      });
    })
    .use(rehypeSlug, { prefix: "section-" })
    .use(collect)
    .use(rehypeStringify);
  const rendered = await renderer.run({ type: "root", children: bodyNodes } as MdRoot);
  const html = String(renderer.stringify(rendered));
  const highlights: Entry[] = rawHighlights.map(
    (e: Entry & { section?: string }) => ({
      ...e,
      date,
      anchor:
        e.anchor ||
        eventAnchors.get(e.id) ||
        toc.find((t) => t.title === e.section?.replace(/[*`]/g, ""))?.id ||
        toc[0]?.id ||
        "",
      topics: e.topics || topicsFor(`${e.title} ${e.summary}`),
      image: e.image ? resolveImage(e.image, media) : undefined,
    }),
  );
  for (const revision of revisions || []) {
    if (targets.has(revision.id)) throw Error(`${filePath}: duplicate revision anchor ${revision.id}`);
    targets.add(revision.id);
  }
  for (const e of highlights) {
    if (
      !e.id ||
      !e.title ||
      !e.summary ||
      !["paper", "tool", "news"].includes(e.kind) ||
      !/^https:\/\//.test(e.source)
    )
      throw Error(`${filePath}: invalid portal entry ${e.id}`);
    if (!targets.has(e.anchor))
      throw Error(`${filePath}: missing entry anchor ${e.anchor}`);
    if (e.topics.some((t) => !TOPICS.some((known) => known.slug === t)))
      throw Error(`${filePath}: unknown entry topic`);
    if (
      e.image &&
      (!e.image.alt ||
        !e.image.credit ||
        !validImageUrl(e.image.url) ||
        (e.image.originalUrl && !validImageUrl(e.image.originalUrl)) ||
        !/^https:\/\//.test(e.image.source))
    )
      throw Error(`${filePath}: invalid image attribution`);
  }
  // Cover selection is editorial metadata. A paper's first figure is not a daily cover.
  const image = portal.image ? resolveImage(portal.image, media) : undefined;
  if (
    image &&
    (!image.alt ||
      !image.credit ||
      !validImageUrl(image.url) ||
      (image.originalUrl && !validImageUrl(image.originalUrl)) ||
      !/^https:\/\//.test(image.source))
  )
    throw Error(`${filePath}: invalid cover attribution`);
  if (
    portal.topics?.some((slug: string) => !TOPICS.some((t) => t.slug === slug))
  )
    throw Error(`${filePath}: unknown daily topic`);
  const title = String(meta.title);
  const headline =
    portal.headline ||
    title.replace(/^.*日报\s*[—｜-]\s*\d{4}-\d{2}-\d{2}\s*/, "") ||
    title;
  const summary =
    portal.summary ||
    text
      .split("\n")
      .find((s) => s.length > 30)
      ?.slice(0, 160) ||
    title;
  return {
    id: meta.id,
    contentHash: createHash("sha256").update(markdown, "utf8").digest("hex"),
    date,
    title,
    headline,
    summary,
    status: meta.status,
    path: filePath,
    sourceCount: Number(meta.source_count),
    topics: portal.topics || topicsFor(text),
    highlights,
    image,
    issue: portal.issue,
    prs: portal.prs || [],
    readingMinutes: Math.max(
      1,
      Math.ceil(
        (text.match(/[\u4e00-\u9fff]/g)?.length || 0) / 500 +
          (text.match(/[a-zA-Z]+/g)?.length || 0) / 220,
      ),
    ),
    unresolvedSources: (content.match(/原始聊天工具引用，需补一手链接|原始引用待复核/g) || [])
      .length,
    html,
    bodyHtml,
    text,
    toc,
    targets: [...targets],
    images,
    introductionHtml,
    archiveHtml,
    footnotesHtml,
    revisions,
    paperSummaries,
    readingGuide,
    events,
  };
}
let archivePromise: ReturnType<typeof buildArchive> | undefined;
export function loadArchive() {
  if (process.env.NODE_ENV === "development") return buildArchive();
  return (archivePromise ||= buildArchive());
}
export async function buildArchive(root = ROOT) {
  const media = loadImageManifest(root);
  const dailyRoot = path.join(root, "docs/daily");
  const files = fs
    .readdirSync(dailyRoot, { recursive: true })
    .map(String)
    .filter((p) => /^\d{4}\/\d{2}\/\d{4}-\d{2}-\d{2}\.md$/.test(p))
    .sort();
  const articles = await Promise.all(
    files.map(async (p) => {
      const markdown = fs.readFileSync(path.join(dailyRoot, p), "utf8");
      const article = await parseArticle(markdown, `docs/daily/${p}`, media);
      const readerPath = `docs/reading/${article.date}.md`;
      if (!fs.existsSync(path.join(root, readerPath))) return article;
      return applyReadingEdition(article, markdown, fs.readFileSync(path.join(root, readerPath), "utf8"), readerPath,
        (md, file) => parseArticle(md, file, media));
    }),
  );
  const published = articles
    .filter((a) => ["published", "corrected"].includes(a.status))
    .sort((a, b) => b.date.localeCompare(a.date));
  const entries = new Map<string, Entry>();
  // First ownership stays with the earliest canonical paper report.
  for (const article of [...published].reverse()) {
    article.highlights.forEach((e) => entries.set(e.id, e));
    const canonical = matter(
      fs.readFileSync(path.join(root, article.path), "utf8"),
    );
    const md = canonical.content;
    const nodes = (
      unified().use(remarkParse).use(remarkGfm).parse(md) as MdRoot
    ).children;
    let heading = "";
    let anchor = "";
    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      if (node.type === "heading") {
        heading = plain(node);
        anchor = article.toc.find((t) => t.title === heading)?.id || "";
      }
      if (node.type !== "html") continue;
      const id = node.value.match(/<!--\s*arxiv:([\d.]+)\s*-->/)?.[1];
      if (!id) continue;
      let end = i + 1;
      while (end < nodes.length && nodes[end].type !== "heading") end++;
      const section = nodes.slice(i + 1, end);
      const specific = section.find((n) => plain(n).startsWith("编辑摘要："));
      const editorialSummary = article.paperSummaries[id];
      const summary = editorialSummary || (specific
        ? plain(specific).replace(/^编辑摘要：\s*/, "")
        : section.map(plain).find((t) => t.length > 30) ||
          "研究条目；可运行性与来源限制见当日日报。");
      const paperImage = section.map((node) => imageFromNode(node, media)).find(Boolean);
      if (paperImage) {
        paperImage.source = `https://arxiv.org/abs/${id}`;
        paperImage.credit = `论文 ${id} 作者（arXiv HTML）`;
      }
      const descriptiveHeading =
        !/^(?:\d+\.|研究论文|Robotics|SLAM|软件、硬件|可实际运行)/.test(heading);
      // Legacy reports put some full paper titles in bold paragraphs.
      const legacyTitle = nodes
        .slice(Math.max(0, i - 6), i)
        .reverse()
        .find(
          (n) =>
            n.type === "paragraph" &&
            n.children.some((c) => c.type === "strong") &&
            plain(n).length > 20 &&
            /[A-Za-z]{4}/.test(plain(n)),
        );
      const paperTitle = LEGACY_PAPER_TITLES[heading] || (descriptiveHeading
        ? heading.replace(/^P[012][+\-]?\s*[—:：-]?\s*/, "")
        : legacyTitle
          ? plain(legacyTitle).split("\n")[0]
          : `arXiv ${id}`);
      entries.set(`arxiv:${id}`, {
        id: `arxiv:${id}`,
        kind: "paper",
        date: article.date,
        title: article.paperTitles?.[id] || paperTitle,
        summary: editorialSummary ? summary : summary.slice(0, 350),
        source: `https://arxiv.org/abs/${id}`,
        // Established event-layout reports keep their published catalogue URLs.
        // A raw research report's first reader edition links to its readable event,
        // while the canonical section anchor remains accessible in the archive.
        anchor: !canonical.data.portal?.editorial
          ? article.events?.find(event => event.id === `arxiv:${id}`)?.anchor || anchor
          : anchor,
        topics: topicsFor(`${heading} ${summary}`),
        image: paperImage,
      });
    }
  }
  const catalogue = [...entries.values()].sort(
    (a, b) => b.date.localeCompare(a.date) || a.id.localeCompare(b.id),
  );
  const daily: Daily[] = published.map(
    ({ html, bodyHtml, text, toc, targets, images, readingGuide, introductionHtml, archiveHtml, footnotesHtml, revisions, paperSummaries, paperTitles, paperOriginalTitles, events, ...d }) => d,
  );
  const entrySearchText = (entry: Entry) => {
    const article = published.find(a => a.date === entry.date && a.readingEdition);
    const readingEvent = article?.events?.find(event => event.id === entry.id);
    const oldHeading = article?.toc.find(heading => heading.id === entry.anchor)?.title;
    // Formal paper titles may omit the project's familiar name (for example GALA).
    return [entry.title, entry.summary, entry.source, oldHeading, article?.paperOriginalTitles?.[entry.id.replace("arxiv:", "")], readingEvent?.title, readingEvent?.sourceText].filter(Boolean).join(" ");
  };
  const index: PortalIndex = {
    schemaVersion: 1,
    updatedThrough: published[0]?.date || "",
    daily,
    entries: catalogue,
    search: [
      ...published.map((a) => ({
        id: a.id,
        kind: "daily" as const,
        title: a.headline,
        summary: a.summary,
        date: a.date,
        topics: a.topics,
        url: dailyUrl(a.date),
        text: a.text,
      })),
      ...catalogue.map((e) => ({
        id: e.id,
        kind: e.kind,
        title: e.title,
        summary: e.summary,
        date: e.date,
        topics: e.topics,
        url: entryUrl(e),
        text: entrySearchText(e),
      })),
    ],
  };
  const [editorials, weeklyEditorials] = await Promise.all([loadLongform(root, published, parseArticle), loadWeeklyEditorial(root, published, parseArticle)]);
  index.articles = editorials.map(({ html, text, toc, images, readingMinutes, revisions, cover, ...summary }) => summary);
  index.search.push(...editorials.map(article => ({ id: article.id, kind: article.genre === "topic" ? "news" as const : article.genre, format: "article" as const, title: article.title, summary: article.summary, date: article.date, topics: article.topics, url: article.url, text: article.text })));
  const asOf = [published[0]?.date || "", ...weeklyEditorials.map(week => week.releaseDate)].sort().at(-1);
  const weeks = buildWeekly(published, asOf);
  return { articles: published, index, editorials, weeklyEditorials, weeks };
}
