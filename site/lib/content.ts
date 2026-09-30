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

import { REPO, BASE, TOPICS, dailyUrl, entryUrl } from "./catalog";
export { REPO, BASE, TOPICS, dailyUrl, entryUrl } from "./catalog";
export const SITE_URL = `https://shuang-su.github.io${BASE}`;
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
function imageFromNode(node: RootContent): SourceImage | undefined {
  let image: SourceImage | undefined;
  visit(node, "image", (n) => {
    if (!image && /^https:\/\//.test(n.url))
      image = {
        url: n.url,
        alt: n.alt || "论文或项目官方图示",
        source: n.url,
        credit: "原论文作者",
      };
  });
  return image;
}
export async function parseArticle(
  markdown: string,
  filePath: string,
): Promise<Article> {
  const { data: meta, content } = matter(markdown);
  const tree = unified()
    .use(remarkParse)
    .use(remarkGfm)
    .parse(content) as MdRoot;
  const reportIndex = tree.children.findIndex(
    (n) => n.type === "heading" && /深度情报日报|今日概览/.test(plain(n)),
  );
  const bodyNodes = tree.children.slice(Math.max(0, reportIndex + 1));
  const text = bodyNodes.map(plain).join("\n");
  const date =
    typeof meta.date === "string"
      ? meta.date
      : meta.date.toISOString().slice(0, 10);
  const portal = meta.portal || {};
  const toc: Article["toc"] = [];
  const images: SourceImage[] = [];
  let readingGuide: Article["readingGuide"];
  const serialize = (children: HastRoot["children"]) =>
    String(
      unified().use(rehypeStringify).stringify({ type: "root", children }),
    );
  let tableIndex = 0;
  const collect = () => (root: HastRoot) => {
    visit(root, "element", (node: Element) => {
      if (/^h[1-6]$/.test(node.tagName)) {
        const depth = Number(node.tagName[1]);
        // Historical reports used H1 for their columns. Keep one document H1.
        if (depth === 1) node.tagName = "h2";
        toc.push({
          id: String(node.properties.id),
          title: plain(node),
          depth: Math.max(2, depth),
        });
      }
      if (
        node.tagName === "a" &&
        typeof node.properties.href === "string" &&
        /^https?:/.test(node.properties.href)
      )
        node.properties.rel = ["noopener", "noreferrer"];
      if (
        node.tagName === "a" &&
        typeof node.properties.href === "string" &&
        /\.md(?:#.*)?$/.test(node.properties.href) &&
        !/^https?:/.test(node.properties.href)
      ) {
        node.properties.href = `${REPO}/blob/main/${path.posix.normalize(path.posix.join(path.posix.dirname(filePath), node.properties.href))}`;
      }
      if (node.tagName === "img") {
        node.properties.loading = "lazy";
        node.properties.decoding = "async";
        const url = String(node.properties.src || "");
        const paper = url.match(/arxiv\.org\/html\/(\d{4}\.\d{4,5})/)?.[1];
        if (/^https:\/\//.test(url))
          images.push({
            url,
            alt: String(node.properties.alt || "原文图示"),
            source: paper ? `https://arxiv.org/abs/${paper}` : url,
            credit: paper
              ? `论文 ${paper} 作者（arXiv HTML）`
              : "图片归属与说明见正文图注",
          });
      }
      if (node.tagName === "table" && tableIndex++ === 0) {
        node.properties.className = ["overview-table"];
        const labels: string[] = [];
        visit(node, "element", (cell: Element) => {
          if (cell.tagName === "th") labels.push(plain(cell));
        });
        visit(node, "element", (row: Element) => {
          if (row.tagName !== "tr") return;
          let column = 0;
          for (const child of row.children) {
            if (child.type === "element" && child.tagName === "td") {
              child.properties.dataLabel = labels[column++] || "";
            }
          }
        });
      }
    });
    const start = root.children.findIndex(
      (n) =>
        n.type === "element" &&
        n.tagName === "h2" &&
        /今日最值得看/.test(plain(n)),
    );
    if (start < 0) return;
    let end = start + 1;
    while (
      end < root.children.length &&
      !(
        root.children[end].type === "element" &&
        (root.children[end] as Element).tagName === "h2"
      )
    )
      end++;
    const section = root.children.slice(start + 1, end);
    const table = section.find(
      (n) => n.type === "element" && n.tagName === "table",
    ) as Element | undefined;
    if (!table) return;
    const labels: string[] = [];
    const rows: NonNullable<Article["readingGuide"]>["rows"] = [];
    visit(table, "element", (node: Element) => {
      if (node.tagName === "th") labels.push(plain(node));
      if (node.tagName !== "tr") return;
      const cells = node.children.filter(
        (n) => n.type === "element" && n.tagName === "td",
      ) as Element[];
      if (cells.length < 2) return;
      const sources: string[] = [];
      visit(cells[1], "element", (n: Element) => {
        if (n.tagName === "a" && /^https:\/\//.test(String(n.properties.href)))
          sources.push(String(n.properties.href));
      });
      let anchor = "";
      let heading = "";
      for (const child of root.children.slice(end)) {
        if (child.type === "element" && /^h[23]$/.test(child.tagName))
          heading = String(child.properties.id);
        visit(child, "element", (n: Element) => {
          if (n.tagName !== "a" || !sources.includes(String(n.properties.href)))
            return;
          // Prefer the paper's detailed heading; tools use their first analysis.
          if (
            !anchor ||
            (String(n.properties.href).includes("arxiv.org/abs/") &&
              toc.find((t) => t.id === heading)?.depth === 3)
          )
            anchor = heading;
        });
      }
      rows.push({
        priority: plain(cells[0]),
        title: plain(cells[1]),
        anchor,
        sources,
        details: cells
          .slice(2)
          .map((cell, i) => ({
            label: labels[i + 2] || "说明",
            html: serialize(cell.children),
          })),
      });
    });
    if (!rows.length || !/优先级/.test(labels[0] || "")) return;
    const heading = root.children[start] as Element;
    readingGuide = {
      id: String(heading.properties.id),
      title: plain(heading),
      rows,
      leadingHtml: serialize(root.children.slice(0, start)),
      bodyHtml: serialize(root.children.slice(end)),
      afterHtml: serialize(section.filter((n) => n !== table)),
    };
  };
  const html = String(
    await unified()
      .use(remarkParse)
      .use(remarkGfm)
      .use(remarkRehype)
      .use(rehypeSanitize, {
        ...defaultSchema,
        clobberPrefix: "",
        attributes: {
          ...defaultSchema.attributes,
          img: [
            ...(defaultSchema.attributes?.img || []),
            "loading",
            "decoding",
          ],
        },
      })
      .use(rehypeSlug, { prefix: "section-" })
      .use(collect)
      .use(rehypeStringify)
      .process(
        bodyNodes.length
          ? content.slice(
              content.indexOf(
                "\n",
                content.indexOf(plain(tree.children[Math.max(0, reportIndex)])),
              ),
            )
          : content,
      ),
  );
  const highlights: Entry[] = (portal.highlights || []).map(
    (e: Entry & { section?: string }) => ({
      ...e,
      date,
      anchor:
        toc.find((t) => t.title === e.section?.replace(/[*`]/g, ""))?.id ||
        e.anchor ||
        toc[0]?.id ||
        "",
      topics: e.topics || topicsFor(`${e.title} ${e.summary}`),
    }),
  );
  for (const e of highlights) {
    if (
      !e.id ||
      !e.title ||
      !e.summary ||
      !["paper", "tool", "news"].includes(e.kind) ||
      !/^https:\/\//.test(e.source)
    )
      throw Error(`${filePath}: invalid portal entry ${e.id}`);
    if (!toc.some((t) => t.id === e.anchor))
      throw Error(`${filePath}: missing entry anchor ${e.anchor}`);
    if (e.topics.some((t) => !TOPICS.some((known) => known.slug === t)))
      throw Error(`${filePath}: unknown entry topic`);
    if (
      e.image &&
      (!e.image.alt ||
        !e.image.credit ||
        !/^https:\/\//.test(e.image.url) ||
        !/^https:\/\//.test(e.image.source))
    )
      throw Error(`${filePath}: invalid image attribution`);
  }
  // Cover selection is editorial metadata. A paper's first figure is not a daily cover.
  const image = portal.image;
  if (
    image &&
    (!image.alt ||
      !image.credit ||
      !/^https:\/\//.test(image.url) ||
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
    text,
    toc,
    images,
    readingGuide,
  };
}
let archivePromise:
  Promise<{ articles: Article[]; index: PortalIndex }> | undefined;
export function loadArchive() {
  if (process.env.NODE_ENV === "development") return buildArchive();
  return (archivePromise ||= buildArchive());
}
export async function buildArchive(root = ROOT) {
  const dailyRoot = path.join(root, "docs/daily");
  const files = fs
    .readdirSync(dailyRoot, { recursive: true })
    .map(String)
    .filter((p) => /^\d{4}\/\d{2}\/\d{4}-\d{2}-\d{2}\.md$/.test(p))
    .sort();
  const articles = await Promise.all(
    files.map((p) =>
      parseArticle(
        fs.readFileSync(path.join(dailyRoot, p), "utf8"),
        `docs/daily/${p}`,
      ),
    ),
  );
  const published = articles
    .filter((a) => ["published", "corrected"].includes(a.status))
    .sort((a, b) => b.date.localeCompare(a.date));
  const entries = new Map<string, Entry>();
  // First ownership stays with the earliest canonical paper report.
  for (const article of [...published].reverse()) {
    article.highlights.forEach((e) => entries.set(e.id, e));
    const md = matter(
      fs.readFileSync(path.join(root, article.path), "utf8"),
    ).content;
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
      const summary = specific
        ? plain(specific).replace(/^编辑摘要：\s*/, "")
        : section.map(plain).find((t) => t.length > 30) ||
          "研究条目；可运行性与来源限制见当日日报。";
      const paperImage = section.map(imageFromNode).find(Boolean);
      if (paperImage) {
        paperImage.source = `https://arxiv.org/abs/${id}`;
        paperImage.credit = `论文 ${id} 作者（arXiv HTML）`;
      }
      const descriptiveHeading =
        !/^\d+\.|研究论文|Robotics|SLAM|软件、硬件|可实际运行/.test(heading);
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
      const paperTitle = descriptiveHeading
        ? heading.replace(/^P[012][+\-]?\s*[—:：-]?\s*/, "")
        : legacyTitle
          ? plain(legacyTitle).split("\n")[0]
          : `arXiv ${id}`;
      entries.set(`arxiv:${id}`, {
        id: `arxiv:${id}`,
        kind: "paper",
        date: article.date,
        title: paperTitle,
        summary: summary.slice(0, 350),
        source: `https://arxiv.org/abs/${id}`,
        anchor,
        topics: topicsFor(`${heading} ${summary}`),
        image: paperImage,
      });
    }
  }
  const catalogue = [...entries.values()].sort(
    (a, b) => b.date.localeCompare(a.date) || a.id.localeCompare(b.id),
  );
  const daily: Daily[] = published.map(
    ({ html, text, toc, images, readingGuide, ...d }) => d,
  );
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
        text: `${e.title} ${e.summary} ${e.source}`,
      })),
    ],
  };
  return { articles: published, index };
}
