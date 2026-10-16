import Link from "next/link";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { getStore } from "@/lib/db";
import { DEFAULT_SETTINGS } from "@/lib/types";
import { SaveForm } from "@/components/admin/SaveForm";
import { ConfirmButton } from "@/components/admin/ConfirmButton";
import { btn, btnDanger, btnGhost, Card, Field, input, Tabs } from "@/components/admin/ui";
import { deleteExperimentAction, updateExperimentAction } from "../actions";

export const dynamic = "force-dynamic";

export default async function OverviewPage(props: PageProps<"/admin/[id]">) {
  const { id } = await props.params;
  const store = getStore();
  const exp = await store.getExperiment(id);
  if (!exp) notFound();
  const [conditions, participants, ads, items] = await Promise.all([
    store.listConditions(id),
    store.listParticipants(id),
    store.listAds(id),
    store.listItems(id),
  ]);
  const settings = { ...DEFAULT_SETTINGS, ...exp.settings };
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const joinUrl = `${proto}://${host}/p/${exp.slug}`;

  const byCond = conditions.map((c) => ({
    c,
    n: participants.filter((p) => p.condition_id === c.id).length,
    done: participants.filter((p) => p.condition_id === c.id && p.status === "completed").length,
  }));

  return (
    <div className="space-y-6">
      <Tabs id={id} active="" />

      <div className="grid gap-4 md:grid-cols-3">
        <Card title="参加状況">
          <div className="text-3xl font-bold">{participants.filter((p) => p.status === "completed").length}</div>
          <div className="text-xs text-neutral-500">完了 / 開始 {participants.length}</div>
          <ul className="mt-3 space-y-1 text-sm">
            {byCond.map(({ c, n, done }) => (
              <li key={c.id} className="flex justify-between">
                <span>
                  {c.code} {c.name}
                </span>
                <span className="tabular-nums">
                  {done}/{n}
                </span>
              </li>
            ))}
          </ul>
        </Card>
        <Card title="構成">
          <ul className="space-y-1 text-sm">
            <li>条件: {conditions.length}</li>
            <li>広告: {ads.length}</li>
            <li>
              質問: {items.length}（事前 {items.filter((i) => i.phase === "pre").length} / 広告ごと{" "}
              {items.filter((i) => i.phase === "post_ad").length} / 最後{" "}
              {items.filter((i) => i.phase === "final").length}）
            </li>
          </ul>
        </Card>
        <Card title="参加URL">
          <code className="block break-all rounded bg-neutral-100 p-2 text-xs">{joinUrl}</code>
          <div className="mt-3 flex gap-2">
            <Link href={`/p/${exp.slug}`} target="_blank" className={btnGhost}>
              開く
            </Link>
            <Link href={`/admin/${id}/export?format=long`} className={btnGhost}>
              CSV(long)
            </Link>
            <Link href={`/admin/${id}/export?format=wide`} className={btnGhost}>
              CSV(wide)
            </Link>
          </div>
          <p className="mt-2 text-xs text-neutral-500">
            公開状態が「公開中」のときだけ参加できます。
          </p>
        </Card>
      </div>

      <Card title="設定">
        <SaveForm action={updateExperimentAction.bind(null, id)} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Field name="title" title="タイトル">
              <input id="title" name="title" defaultValue={exp.title} className={input} />
            </Field>
            <Field name="status" title="公開状態">
              <select id="status" name="status" defaultValue={exp.status} className={input}>
                <option value="draft">下書き（参加不可）</option>
                <option value="active">公開中</option>
                <option value="closed">終了</option>
              </select>
            </Field>
          </div>
          <Field name="description" title="メモ">
            <textarea id="description" name="description" defaultValue={exp.description} className={input} rows={2} />
          </Field>
          <div className="grid gap-4 md:grid-cols-4">
            <Field name="min_exposure_seconds" title="最低閲覧時間（秒）">
              <input id="min_exposure_seconds" name="min_exposure_seconds" type="number" min={0} defaultValue={settings.min_exposure_seconds} className={input} />
            </Field>
            <Field name="ads_per_participant" title="1人あたり広告数（0=全部）">
              <input id="ads_per_participant" name="ads_per_participant" type="number" min={0} defaultValue={settings.ads_per_participant} className={input} />
            </Field>
            <Field name="assignment" title="条件の割り当て">
              <select id="assignment" name="assignment" defaultValue={settings.assignment} className={input}>
                <option value="balanced">均等（最少の条件へ）</option>
                <option value="weighted">重み付き確率</option>
              </select>
            </Field>
            <label className="flex items-end gap-2 pb-2 text-sm">
              <input type="checkbox" name="randomize_ad_order" defaultChecked={settings.randomize_ad_order} />
              広告の順序を無作為化
            </label>
          </div>
          <Field name="consent_text" title="同意文">
            <textarea id="consent_text" name="consent_text" defaultValue={exp.consent_text} className={input} rows={5} />
          </Field>
          <Field name="debrief_text" title="デブリーフィング（終了画面）">
            <textarea id="debrief_text" name="debrief_text" defaultValue={exp.debrief_text} className={input} rows={5} />
          </Field>
          <button className={btn}>保存</button>
        </SaveForm>
      </Card>

      <Card title="危険な操作">
        <ConfirmButton
          action={deleteExperimentAction.bind(null, id)}
          message="この実験と全ての回答データを削除します。元に戻せません。よろしいですか？"
          className={btnDanger}
        >
          実験を削除
        </ConfirmButton>
      </Card>
    </div>
  );
}
