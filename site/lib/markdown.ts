import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkDirective from "remark-directive";
import { visit } from "unist-util-visit";
import type { Root } from "mdast";

/** Only the documented disclosure directive is allowed; arbitrary HTML is not. */
export function deepReading() {
  return (tree: Root) => {
    visit(tree, (node) => {
      if (!["containerDirective", "leafDirective", "textDirective"].includes(node.type)) return;
      if (node.type !== "containerDirective" || node.name !== "details" || Object.keys(node.attributes || {}).length)
        throw Error("Only :::details[标题] is supported in editorial Markdown");
      const label = node.children[0];
      if (label?.type !== "paragraph" || !label.data?.directiveLabel || node.children.length < 2)
        throw Error("A deep-reading block needs a label and content");
      node.data = { ...node.data, hName: "details", hProperties: { className: ["deep-reading"] } };
      label.data = { ...label.data, hName: "summary" };
    });
  };
}

export const markdownParser = () => unified().use(remarkParse).use(remarkGfm).use(remarkDirective).use(deepReading);
export function parseMarkdown(content: string) {
  const parser = markdownParser();
  return parser.runSync(parser.parse(content)) as Root;
}
