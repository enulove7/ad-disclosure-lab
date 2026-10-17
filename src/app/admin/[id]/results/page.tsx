import Link from "next/link";
import { notFound } from "next/navigation";
import { getStore } from "@/lib/db";
import { adminDict } from "@/lib/i18n-server";
import { summarize } from "@/lib/stats";
import { GroupedBarChart, SERIES } from "@/components/admin/GroupedBarChart";
import { btnGhost, Card, Tabs } from "@/components/admin/ui";

export const dynamic = "force-dynamic";

export default async function ResultsPage(props: PageProps<"/admin/[id]/results">) {
  const { id } = await props.params;
  const sp = await props.searchParams;
  const byAd = sp.by === "ad";
  const includeAll = sp.all === "1";
  const { d } = await adminDict();
  const store = getStore();
  const exp = await store.getExperiment(id);
  if (!exp) notFound();
  const [conditions, ads, items, participants, exposures, responses] = await Promise.all([
    store.listConditions(id),
    store.listAds(id),
    store.listItems(id),
    store.listParticipants(id),
    store.listExposuresByExperiment(id),
    store.listResponsesByExperiment(id),
  ]);
  const s = summarize({ conditions, ads, items, participants, exposures, responses, completedOnly: !includeAll, byAd });
  const labels: Record<string, string> = Object.fromEntries(conditions.map((c) => [c.id, c.code]));
  const adName = (code: string) => ads.find((a) => a.code === code)?.name ?? code;
  const qs = (o: { by?: string; all?: string }) => {
    const p = new URLSearchParams();
    const by = o.by ?? (byAd ? "ad" : "");
    const all = o.all ?? (includeAll ? "1" : "");
    if (by) p.set("by", by);
    if (all) p.set("all", all);
    const q = p.toString();
    return `/admin/${id}/results${q ? "?" + q : ""}`;
  };
  const completed = participants.filter((p) => p.status === "completed").length;

  return (
    <div className="space-y-6">
      <Tabs id={id} active="results" d={d} />

      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="text-neutral-600">{d.resSample(includeAll ? participants.length : completed)}</span>
        <Link href={qs({ all: includeAll ? "" : "1" })} className={btnGhost}>
          {includeAll ? d.resCompletedOnly : d.resIncludeAll}
        </Link>
        <Link href={qs({ by: byAd ? "" : "ad" })} className={btnGhost}>
          {byAd ? d.resMerged : d.resByAd}
        </Link>
        <Link href={`/admin/${id}/export?format=long`} className={btnGhost}>
          {d.csvLong}
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card title={d.resParticipants}>
          <table className="w-full text-sm">
            <thead className="text-xs text-neutral-500">
              <tr>
                <th className="py-1 text-left">{d.colCondition}</th>
                <th className="py-1 text-right">{d.resStarted}</th>
                <th className="py-1 text-right">{d.resCompleted}</th>
              </tr>
            </thead>
            <tbody>
              {conditions.map((c, i) => (
                <tr key={c.id} className="border-t border-neutral-100">
                  <td className="py-1">
                    <span className="mr-2 inline-block h-2.5 w-2.5 rounded-sm" style={{ background: SERIES[i % SERIES.length] }} />
                    {c.code}
                  </td>
                  <td className="py-1 text-right tabular-nums">{s.participants.byCondition[c.id]?.started ?? 0}</td>
                  <td className="py-1 text-right tabular-nums">{s.participants.byCondition[c.id]?.completed ?? 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
        <Card title={d.resAttention}>
          <table className="w-full text-sm">
            <thead className="text-xs text-neutral-500">
              <tr>
                <th className="py-1 text-left">{d.colCondition}</th>
                <th className="py-1 text-right">{d.resPassRate}</th>
              </tr>
            </thead>
            <tbody>
              {conditions.map((c) => {
                const a = s.attention[c.id];
                const rate = a && a.checked > 0 ? Math.round((a.passed / a.checked) * 100) : null;
                return (
                  <tr key={c.id} className="border-t border-neutral-100">
                    <td className="py-1">{c.code}</td>
                    <td className="py-1 text-right tabular-nums">
                      {rate === null ? "—" : `${rate}% (${a.passed}/${a.checked})`}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <p className="mt-2 text-xs text-neutral-500">{d.resAttentionHint}</p>
        </Card>
        <Card title={d.resExposure}>
          <table className="w-full text-sm">
            <thead className="text-xs text-neutral-500">
              <tr>
                <th className="py-1 text-left">{d.colCondition}</th>
                <th className="py-1 text-right">{d.resMeanSeconds}</th>
              </tr>
            </thead>
            <tbody>
              {conditions.map((c) => {
                const e = s.exposureSeconds[c.id];
                return (
                  <tr key={c.id} className="border-t border-neutral-100">
                    <td className="py-1">{c.code}</td>
                    <td className="py-1 text-right tabular-nums">{e && e.n > 0 ? `${e.mean.toFixed(1)}s (n=${e.n})` : "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
        <Card title={d.resCta}>
          <table className="w-full text-sm">
            <thead className="text-xs text-neutral-500">
              <tr>
                <th className="py-1 text-left">{d.colCondition}</th>
                <th className="py-1 text-right">%</th>
              </tr>
            </thead>
            <tbody>
              {conditions.map((c) => {
                const x = s.cta[c.id];
                return (
                  <tr key={c.id} className="border-t border-neutral-100">
                    <td className="py-1">{c.code}</td>
                    <td className="py-1 text-right tabular-nums">
                      {x && x.n > 0 ? `${Math.round((x.clicked / x.n) * 100)}% (${x.clicked}/${x.n})` : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      </div>

      {s.constructs.length === 0 && (
        <Card>
          <p className="text-sm text-neutral-600">{d.resNoData}</p>
        </Card>
      )}

      {s.constructs.map((cr) => (
        <Card
          key={`${cr.phase}-${cr.construct}`}
          title={`${cr.construct} · ${d.phasesShort[cr.phase]} · ${cr.items.length} ${d.resItems}`}
        >
          <p className="mb-3 text-xs text-neutral-500">{cr.items.map((i) => i.text).join(" / ")}</p>
          <div className={`grid gap-6 ${cr.facets.length > 1 ? "md:grid-cols-2" : ""}`}>
            {cr.facets.map((f) => (
              <div key={f.facet}>
                {f.facet !== "all" && <div className="mb-1 text-sm font-medium">{adName(f.facet)}</div>}
                <GroupedBarChart groups={f.groups} labels={labels} scaleMax={cr.scaleMax} title={`${cr.construct} ${f.facet}`} />
                <table className="mt-2 w-full text-xs text-neutral-700">
                  <thead className="text-neutral-500">
                    <tr>
                      <th className="py-0.5 text-left">{d.colCondition}</th>
                      <th className="py-0.5 text-right">n</th>
                      <th className="py-0.5 text-right">M</th>
                      <th className="py-0.5 text-right">SD</th>
                      <th className="py-0.5 text-right">95% CI</th>
                    </tr>
                  </thead>
                  <tbody>
                    {f.groups.map((g) => (
                      <tr key={g.key} className="border-t border-neutral-100">
                        <td className="py-0.5">{labels[g.key]}</td>
                        <td className="py-0.5 text-right tabular-nums">{g.n}</td>
                        <td className="py-0.5 text-right tabular-nums">{g.n ? g.mean.toFixed(2) : "—"}</td>
                        <td className="py-0.5 text-right tabular-nums">{g.n > 1 ? g.sd.toFixed(2) : "—"}</td>
                        <td className="py-0.5 text-right tabular-nums">{g.n > 1 ? `±${g.ci95.toFixed(2)}` : "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        </Card>
      ))}

      {s.distributions.map((dist) => {
        const options = Array.from(new Set([...dist.item.options, ...Object.values(dist.counts).flatMap((c) => Object.keys(c))]));
        return (
          <Card key={dist.item.id} title={`${dist.item.code} · ${dist.item.text}`}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-xs text-neutral-500">
                  <tr>
                    <th className="py-1 text-left">{d.colCondition}</th>
                    {options.map((o) => (
                      <th key={o} className="py-1 text-right">
                        {o}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {conditions.map((c) => (
                    <tr key={c.id} className="border-t border-neutral-100">
                      <td className="py-1">{c.code}</td>
                      {options.map((o) => {
                        const n = dist.counts[c.id]?.[o] ?? 0;
                        const t = dist.totals[c.id] ?? 0;
                        return (
                          <td key={o} className="py-1 text-right tabular-nums">
                            {t ? `${Math.round((n / t) * 100)}% (${n})` : "—"}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
