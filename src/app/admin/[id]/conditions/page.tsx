import { notFound } from "next/navigation";
import { getStore } from "@/lib/db";
import { DEFAULT_LABEL, type Condition } from "@/lib/types";
import { SaveForm } from "@/components/admin/SaveForm";
import { ConfirmButton } from "@/components/admin/ConfirmButton";
import { btn, btnDanger, Card, Field, input, Tabs } from "@/components/admin/ui";
import { deleteConditionAction, saveConditionAction } from "../../actions";

export const dynamic = "force-dynamic";

const POSITIONS = [
  ["top-left", "画像の左上"],
  ["top-right", "画像の右上"],
  ["bottom-left", "画像の左下"],
  ["bottom-right", "画像の右下"],
  ["top-bar", "画像の上に帯"],
  ["bottom-bar", "画像の下に帯"],
  ["below-image", "本文の上"],
];

function ConditionForm({ experimentId, c }: { experimentId: string; c?: Condition }) {
  const l = c?.label_config ?? DEFAULT_LABEL;
  return (
    <SaveForm action={saveConditionAction.bind(null, experimentId)} className="space-y-3">
      {c && <input type="hidden" name="id" value={c.id} />}
      <div className="grid gap-3 md:grid-cols-4">
        <Field name="code" title="コード">
          <input name="code" defaultValue={c?.code ?? ""} className={input} placeholder="C4" />
        </Field>
        <Field name="name" title="名前" className="md:col-span-2">
          <input name="name" defaultValue={c?.name ?? ""} className={input} />
        </Field>
        <Field name="weight" title="重み / 目標比率">
          <input name="weight" type="number" min={0} defaultValue={c?.weight ?? 1} className={input} />
        </Field>
      </div>
      <input type="hidden" name="sort_order" value={c?.sort_order ?? 99} />
      <label className="flex items-center gap-2 text-sm font-medium">
        <input type="checkbox" name="enabled" defaultChecked={l.enabled} />
        開示ラベルを表示する
      </label>
      <div className="grid gap-3 md:grid-cols-2">
        <Field name="text" title="ラベル文言">
          <input name="text" defaultValue={l.text} className={input} placeholder="AI生成広告" />
        </Field>
        <Field name="description" title="補足説明（任意）">
          <input name="description" defaultValue={l.description} className={input} placeholder="人が内容を確認しています" />
        </Field>
      </div>
      <div className="grid gap-3 md:grid-cols-4">
        <Field name="position" title="位置">
          <select name="position" defaultValue={l.position} className={input}>
            {POSITIONS.map(([v, n]) => (
              <option key={v} value={v}>
                {n}
              </option>
            ))}
          </select>
        </Field>
        <Field name="size" title="大きさ">
          <select name="size" defaultValue={l.size} className={input}>
            <option value="sm">小</option>
            <option value="md">中</option>
            <option value="lg">大</option>
          </select>
        </Field>
        <Field name="style" title="スタイル">
          <select name="style" defaultValue={l.style} className={input}>
            <option value="subtle">控えめ（半透明）</option>
            <option value="badge">バッジ（白地）</option>
            <option value="banner">バナー（黄色帯）</option>
          </select>
        </Field>
        <label className="flex items-end gap-2 pb-2 text-sm">
          <input type="checkbox" name="show_icon" defaultChecked={l.show_icon} />
          アイコン表示
        </label>
      </div>
      <button className={btn}>{c ? "保存" : "追加"}</button>
    </SaveForm>
  );
}

export default async function ConditionsPage(props: PageProps<"/admin/[id]/conditions">) {
  const { id } = await props.params;
  const store = getStore();
  const exp = await store.getExperiment(id);
  if (!exp) notFound();
  const conditions = await store.listConditions(id);
  const counts = await store.countParticipantsByCondition(id);

  return (
    <div className="space-y-6">
      <Tabs id={id} active="conditions" />
      <p className="text-sm text-neutral-600">
        条件＝開示ラベルの設定です。参加者は1つの条件に割り当てられ、全ての広告で同じラベルを見ます。
        既に参加者がいる条件のラベルを変えると、過去データは変更前のスナップショットで保存されています。
      </p>
      {conditions.map((c) => (
        <Card
          key={c.id}
          title={`${c.code} ${c.name}`}
          right={
            <div className="flex items-center gap-3">
              <span className="text-xs text-neutral-500">参加 {counts[c.id] ?? 0}</span>
              <ConfirmButton
                action={deleteConditionAction.bind(null, id, c.id)}
                message={(counts[c.id] ?? 0) > 0 ? "この条件には参加者がいます。本当に削除しますか？" : "削除しますか？"}
                className={btnDanger}
              >
                削除
              </ConfirmButton>
            </div>
          }
        >
          <ConditionForm experimentId={id} c={c} />
        </Card>
      ))}
      <Card title="条件を追加">
        <ConditionForm experimentId={id} />
      </Card>
    </div>
  );
}
