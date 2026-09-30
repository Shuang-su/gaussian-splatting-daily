import { notFound } from "next/navigation";
import { loadArchive } from "../../../lib/content";
import { TOPICS } from "../../../lib/catalog";
import Catalogue from "../../../components/Catalogue";
import { DailyCard } from "../../../components/Cards";
export const dynamicParams = false;
export function generateStaticParams() {
  return TOPICS.map((t) => ({ slug: t.slug }));
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return { title: TOPICS.find((t) => t.slug === slug)?.label };
}
export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const t = TOPICS.find((t) => t.slug === slug);
  if (!t) notFound();
  const { index } = await loadArchive();
  return (
    <>
      <Catalogue
        title={t.label}
        description="相关研究、项目与工具更新，以及收录这些变化的完整日报。"
        entries={index.entries.filter((e) => e.topics.includes(slug))}
      />
      <section className="shell related-daily">
        <h2>相关日报</h2>
        <div className="archive-grid">
          {index.daily
            .filter((d) => d.topics.includes(slug))
            .map((d) => (
              <DailyCard daily={d} key={d.id} />
            ))}
        </div>
      </section>
    </>
  );
}
