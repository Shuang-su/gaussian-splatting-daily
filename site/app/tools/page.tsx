import { loadArchive } from "../../lib/content";
import Catalogue from "../../components/Catalogue";
export const metadata = { title: "工具动态" };
export default async function Page() {
  const { index } = await loadArchive();
  return (
    <Catalogue
      title="工具链，正在发生什么。"
      description="追踪编辑器、训练器、浏览器渲染与格式工具；区分正式版本、主分支合并和待验证项目。"
      entries={index.entries.filter((e) => e.kind === "tool")}
    />
  );
}
