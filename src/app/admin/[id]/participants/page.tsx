import { notFound } from "next/navigation";
import { getStore } from "@/lib/db";
import { adminDict } from "@/lib/i18n-server";
import { Tabs } from "@/components/admin/ui";

export const dynamic = "force-dynamic";

export default async function ParticipantsPage(props: PageProps<"/admin/[id]/participants">) {
  const { id } = await props.params;
  const { locale, d } = await adminDict();
  const store = getStore();
  const exp = await store.getExperiment(id);
  if (!exp) notFound();
  const [participants, conditions, exposures] = await Promise.all([
    store.listParticipants(id),
    store.listConditions(id),
    store.listExposuresByExperiment(id),
  ]);
  const condName = new Map(conditions.map((c) => [c.id, c.code]));
  const fmt = (iso: string) => new Date(iso).toLocaleString(locale === "ko" ? "ko-KR" : "ja-JP");

  return (
    <div className="space-y-4">
      <Tabs id={id} active="participants" d={d} />
      <div className="overflow-x-auto rounded-lg border border-neutral-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-neutral-50 text-xs text-neutral-500">
            <tr>
              <th className="px-3 py-2">#</th>
              <th className="px-3 py-2">{d.colCondition}</th>
              <th className="px-3 py-2">{d.colStatus}</th>
              <th className="px-3 py-2">{d.colStarted}</th>
              <th className="px-3 py-2">{d.colCompleted}</th>
              <th className="px-3 py-2">{d.colDuration}</th>
            </tr>
          </thead>
          <tbody>
            {participants.map((p, i) => {
              const ex = exposures.filter((x) => x.participant_id === p.id);
              const secs = ex
                .filter((x) => x.duration_ms !== null)
                .map((x) => Math.round((x.duration_ms ?? 0) / 1000))
                .join(" / ");
              return (
                <tr key={p.id} className="border-t border-neutral-100">
                  <td className="px-3 py-2 text-neutral-400">{i + 1}</td>
                  <td className="px-3 py-2">{condName.get(p.condition_id) ?? "?"}</td>
                  <td className="px-3 py-2">{d.pStatus[p.status] ?? p.status}</td>
                  <td className="px-3 py-2 text-xs">{fmt(p.started_at)}</td>
                  <td className="px-3 py-2 text-xs">{p.completed_at ? fmt(p.completed_at) : "—"}</td>
                  <td className="px-3 py-2 tabular-nums">{secs || "—"}</td>
                </tr>
              );
            })}
            {participants.length === 0 && (
              <tr>
                <td colSpan={6} className="px-3 py-6 text-center text-neutral-500">
                  {d.noParticipants}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
