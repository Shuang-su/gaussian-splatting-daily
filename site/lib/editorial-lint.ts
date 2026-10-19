import type { Root } from "mdast";
import { visit } from "unist-util-visit";
export interface EditorialWarning { line: number; code: "long-paragraph" | "vague-heading" | "dense-code"; message: string }
const text = (node: unknown): string => { const n = node as { value?: string; children?: unknown[] }; return n.value || n.children?.map(text).join("") || ""; };
/** Suggestions stay advisory: length and vocabulary alone do not decide quality. */
export function editorialWarnings(tree: Root): EditorialWarning[] {
  const warnings: EditorialWarning[] = [];
  visit(tree, (node, _index, parent) => {
    const line = node.position?.start.line || 1, content = text(node);
    if (node.type === "paragraph" && content.length > 320) warnings.push({ line, code: "long-paragraph", message: "检查长段落是否包含多个意思；不要为通过检查机械拆句。" });
    if (node.type === "heading" && /^(?:研究论文|重要更新|其他内容|P[012][+−-]?|本轮最值得)/.test(content)) warnings.push({ line, code: "vague-heading", message: "标题宜交代具体对象与变化。" });
    if (node.type === "paragraph" && parent?.type !== "containerDirective" && node.children.filter(child=>child.type === "inlineCode").length > 5) warnings.push({ line, code: "dense-code", message: "检查参数是否需要解释或移入技术细节。" });
  });
  return warnings;
}
