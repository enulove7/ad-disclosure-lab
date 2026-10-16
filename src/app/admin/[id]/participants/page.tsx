import { notFound } from "next/navigation";
import { getStore } from "@/lib/db";
import { Tabs } from "@/components/admin/ui";

export const dynamic = "force-dynamic";

const STATUS: Record<string, string> = {
  started: "開始",
  pre_done: "事前完了",
  ads_done: "広告完了",
  completed: "完了",
  dropped: "離脱",
};

export default async function ParticipantsPage(props: PageProps<"/admin/[id]/participants">) {
  const { id } = await props.params;
  const store = getStore();
  const exp = await store.getExperiment(id);
  if (!exp) notFound();
  const [participants, conditions, exposures] = await Promise.all([
    store.listParticipants(id),
    store.listConditions(id),
    store.listExposuresByExperiment(id),
  ]);
  const condName = new Map(conditions.map((c) => [c.id, c.code]));

  return (
    <div className="space-y-4">
      <Tabs id={id} active="participants" />
      <div className="overflow-x-auto rounded-lg border border-neutral-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-neutral-50 text-xs text-neutral-500">
            <tr>
              <th className="px-3 py-2">#</th>
              <th className="px-3 py-2">条件</th>
              <th className="px-3 py-2">状態</th>
              <th className="px-3 py-2">開始</th>
              <th className="px-3 py-2">完了</th>
              <th className="px-3 py-2">閲覧時間(秒)</th>
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
                  <td className="px-3 py-2">{STATUS[p.status] ?? p.status}</td>
                  <td className="px-3 py-2 text-xs">{new Date(p.started_at).toLocaleString("ja-JP")}</td>
                  <td className="px-3 py-2 text-xs">
                    {p.completed_at ? new Date(p.completed_at).toLocaleString("ja-JP") : "—"}
                  </td>
                  <td className="px-3 py-2 tabular-nums">{secs || "—"}</td>
                </tr>
              );
            })}
            {participants.length === 0 && (
              <tr>
                <td colSpan={6} className="px-3 py-6 text-center text-neutral-500">
                  まだ参加者がいません。
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
