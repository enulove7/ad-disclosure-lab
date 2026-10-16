import { notFound } from "next/navigation";
import { getStore } from "@/lib/db";
import { adminDict, participantDict } from "@/lib/i18n-server";
import { AdCard } from "@/components/AdCard";
import { Tabs } from "@/components/admin/ui";

export const dynamic = "force-dynamic";

/** 모든 조건 × 광고 조합을 한 화면에서 비교. 카드 안 문구는 실험 언어를 따른다 */
export default async function PreviewPage(props: PageProps<"/admin/[id]/preview">) {
  const { id } = await props.params;
  const { d } = await adminDict();
  const store = getStore();
  const exp = await store.getExperiment(id);
  if (!exp) notFound();
  const { locale, d: pd } = participantDict(exp);
  const [conditions, ads] = await Promise.all([store.listConditions(id), store.listAds(id)]);

  return (
    <div className="space-y-8">
      <Tabs id={id} active="preview" d={d} />
      {ads.map((ad) => (
        <section key={ad.id} lang={locale}>
          <h2 className="mb-3 text-base font-semibold">
            {ad.code} {ad.name}
          </h2>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {conditions.map((c) => (
              <div key={c.id}>
                <div className="mb-1 text-xs font-medium text-neutral-600">
                  {c.code} {c.name}
                </div>
                <AdCard ad={ad} label={c.label_config} adWord={pd.adLabel} />
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
