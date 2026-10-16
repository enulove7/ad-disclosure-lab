import { notFound } from "next/navigation";
import { getStore } from "@/lib/db";
import type { SurveyItem, SurveyPhase } from "@/lib/types";
import { SaveForm } from "@/components/admin/SaveForm";
import { ConfirmButton } from "@/components/admin/ConfirmButton";
import { btn, btnDanger, Card, Field, input, Tabs } from "@/components/admin/ui";
import { deleteItemAction, saveItemAction } from "../../actions";

export const dynamic = "force-dynamic";

const PHASE_NAME: Record<SurveyPhase, string> = {
  pre: "事前質問（同意直後）",
  post_ad: "広告ごとの質問（各広告の後）",
  final: "最後の質問（操作チェックなど）",
};

function ItemForm({ experimentId, item, phase }: { experimentId: string; item?: SurveyItem; phase: SurveyPhase }) {
  return (
    <SaveForm action={saveItemAction.bind(null, experimentId)} className="space-y-3">
      {item && <input type="hidden" name="id" value={item.id} />}
      <input type="hidden" name="phase" value={item?.phase ?? phase} />
      <input type="hidden" name="sort_order" value={item?.sort_order ?? 99} />
      <div className="grid gap-3 md:grid-cols-5">
        <Field name="code" title="コード">
          <input name="code" defaultValue={item?.code ?? ""} className={input} placeholder="aad4" />
        </Field>
        <Field name="construct" title="構成概念（分析用）">
          <input name="construct" defaultValue={item?.construct ?? ""} className={input} placeholder="ad_attitude" />
        </Field>
        <Field name="type" title="形式">
          <select name="type" defaultValue={item?.type ?? "likert"} className={input}>
            <option value="likert">リッカート尺度</option>
            <option value="single">単一選択</option>
            <option value="multi">複数選択</option>
            <option value="number">数値</option>
            <option value="text">自由記述</option>
          </select>
        </Field>
        <Field name="scale_points" title="尺度の段階数">
          <input name="scale_points" type="number" min={2} max={11} defaultValue={item?.scale_points ?? 7} className={input} />
        </Field>
        <label className="flex items-end gap-2 pb-2 text-sm">
          <input type="checkbox" name="required" defaultChecked={item?.required ?? true} />
          必須
        </label>
      </div>
      <Field name="text" title="質問文">
        <input name="text" defaultValue={item?.text ?? ""} className={input} required />
      </Field>
      <div className="grid gap-3 md:grid-cols-3">
        <Field name="scale_left" title="左端ラベル（尺度）">
          <input name="scale_left" defaultValue={item?.scale_labels?.[0] ?? ""} className={input} />
        </Field>
        <Field name="scale_right" title="右端ラベル（尺度）">
          <input name="scale_right" defaultValue={item?.scale_labels?.[1] ?? ""} className={input} />
        </Field>
        <Field name="options" title="選択肢（1行に1つ）">
          <textarea name="options" defaultValue={item?.options?.join("\n") ?? ""} className={input} rows={2} />
        </Field>
      </div>
      <button className={btn}>{item ? "保存" : "追加"}</button>
    </SaveForm>
  );
}

export default async function SurveyPage(props: PageProps<"/admin/[id]/survey">) {
  const { id } = await props.params;
  const store = getStore();
  const exp = await store.getExperiment(id);
  if (!exp) notFound();
  const items = await store.listItems(id);

  return (
    <div className="space-y-8">
      <Tabs id={id} active="survey" />
      {(["pre", "post_ad", "final"] as SurveyPhase[]).map((phase) => (
        <section key={phase} className="space-y-3">
          <h2 className="text-base font-semibold">{PHASE_NAME[phase]}</h2>
          {items
            .filter((i) => i.phase === phase)
            .map((i) => (
              <details key={i.id} className="rounded-lg border border-neutral-200 bg-white">
                <summary className="flex cursor-pointer items-center justify-between px-4 py-3 text-sm">
                  <span>
                    <span className="mr-2 rounded bg-neutral-100 px-1.5 py-0.5 text-xs">{i.code}</span>
                    {i.text}
                    <span className="ml-2 text-xs text-neutral-400">
                      {i.type}
                      {i.construct && ` · ${i.construct}`}
                    </span>
                  </span>
                </summary>
                <div className="border-t border-neutral-200 p-4">
                  <ItemForm experimentId={id} item={i} phase={phase} />
                  <div className="mt-3">
                    <ConfirmButton action={deleteItemAction.bind(null, id, i.id)} message="この質問を削除しますか？" className={btnDanger}>
                      削除
                    </ConfirmButton>
                  </div>
                </div>
              </details>
            ))}
          <Card title="質問を追加">
            <ItemForm experimentId={id} phase={phase} />
          </Card>
        </section>
      ))}
    </div>
  );
}
