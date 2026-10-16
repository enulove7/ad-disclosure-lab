import { notFound } from "next/navigation";
import { getStore } from "@/lib/db";
import type { SurveyItem, SurveyPhase } from "@/lib/types";
import { adminDict } from "@/lib/i18n-server";
import type { Dict } from "@/lib/i18n";
import { SaveForm } from "@/components/admin/SaveForm";
import { ConfirmButton } from "@/components/admin/ConfirmButton";
import { btn, btnDanger, Card, Field, input, Tabs } from "@/components/admin/ui";
import { deleteItemAction, saveItemAction } from "../../actions";

export const dynamic = "force-dynamic";

function ItemForm({
  experimentId,
  item,
  phase,
  d,
}: {
  experimentId: string;
  item?: SurveyItem;
  phase: SurveyPhase;
  d: Dict["a"];
}) {
  return (
    <SaveForm action={saveItemAction.bind(null, experimentId)} savedText={d.saved} className="space-y-3">
      {item && <input type="hidden" name="id" value={item.id} />}
      <input type="hidden" name="phase" value={item?.phase ?? phase} />
      <input type="hidden" name="sort_order" value={item?.sort_order ?? 99} />
      <div className="grid gap-3 md:grid-cols-5">
        <Field name="code" title={d.code}>
          <input name="code" defaultValue={item?.code ?? ""} className={input} placeholder="aad4" />
        </Field>
        <Field name="construct" title={d.construct}>
          <input name="construct" defaultValue={item?.construct ?? ""} className={input} placeholder="ad_attitude" />
        </Field>
        <Field name="type" title={d.type}>
          <select name="type" defaultValue={item?.type ?? "likert"} className={input}>
            {Object.entries(d.types).map(([v, n]) => (
              <option key={v} value={v}>
                {n}
              </option>
            ))}
          </select>
        </Field>
        <Field name="scale_points" title={d.scalePoints}>
          <input name="scale_points" type="number" min={2} max={11} defaultValue={item?.scale_points ?? 7} className={input} />
        </Field>
        <label className="flex items-end gap-2 pb-2 text-sm">
          <input type="checkbox" name="required" defaultChecked={item?.required ?? true} />
          {d.required}
        </label>
      </div>
      <Field name="text" title={d.questionText}>
        <input name="text" defaultValue={item?.text ?? ""} className={input} required />
      </Field>
      <div className="grid gap-3 md:grid-cols-3">
        <Field name="scale_left" title={d.scaleLeft}>
          <input name="scale_left" defaultValue={item?.scale_labels?.[0] ?? ""} className={input} />
        </Field>
        <Field name="scale_right" title={d.scaleRight}>
          <input name="scale_right" defaultValue={item?.scale_labels?.[1] ?? ""} className={input} />
        </Field>
        <Field name="options" title={d.options}>
          <textarea name="options" defaultValue={item?.options?.join("\n") ?? ""} className={input} rows={2} />
        </Field>
      </div>
      <button className={btn}>{item ? d.save : d.add}</button>
    </SaveForm>
  );
}

export default async function SurveyPage(props: PageProps<"/admin/[id]/survey">) {
  const { id } = await props.params;
  const { d } = await adminDict();
  const store = getStore();
  const exp = await store.getExperiment(id);
  if (!exp) notFound();
  const items = await store.listItems(id);

  return (
    <div className="space-y-8">
      <Tabs id={id} active="survey" d={d} />
      {(["pre", "post_ad", "final"] as SurveyPhase[]).map((phase) => (
        <section key={phase} className="space-y-3">
          <h2 className="text-base font-semibold">{d.phases[phase]}</h2>
          {items
            .filter((i) => i.phase === phase)
            .map((i) => (
              <details key={i.id} className="rounded-lg border border-neutral-200 bg-white">
                <summary className="flex cursor-pointer items-center justify-between px-4 py-3 text-sm">
                  <span>
                    <span className="mr-2 rounded bg-neutral-100 px-1.5 py-0.5 text-xs">{i.code}</span>
                    {i.text}
                    <span className="ml-2 text-xs text-neutral-400">
                      {d.types[i.type]}
                      {i.construct && ` · ${i.construct}`}
                    </span>
                  </span>
                </summary>
                <div className="border-t border-neutral-200 p-4">
                  <ItemForm experimentId={id} item={i} phase={phase} d={d} />
                  <div className="mt-3">
                    <ConfirmButton action={deleteItemAction.bind(null, id, i.id)} message={d.deleteItemConfirm} className={btnDanger}>
                      {d.delete}
                    </ConfirmButton>
                  </div>
                </div>
              </details>
            ))}
          <Card title={d.addItem}>
            <ItemForm experimentId={id} phase={phase} d={d} />
          </Card>
        </section>
      ))}
    </div>
  );
}
