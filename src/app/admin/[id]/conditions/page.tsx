import { notFound } from "next/navigation";
import { getStore } from "@/lib/db";
import { DEFAULT_LABEL, type Condition } from "@/lib/types";
import { adminDict } from "@/lib/i18n-server";
import type { Dict } from "@/lib/i18n";
import { SaveForm } from "@/components/admin/SaveForm";
import { ConfirmButton } from "@/components/admin/ConfirmButton";
import { btn, btnDanger, Card, Field, input, Tabs } from "@/components/admin/ui";
import { deleteConditionAction, saveConditionAction } from "../../actions";

export const dynamic = "force-dynamic";

function ConditionForm({ experimentId, c, d }: { experimentId: string; c?: Condition; d: Dict["a"] }) {
  const l = c?.label_config ?? DEFAULT_LABEL;
  return (
    <SaveForm action={saveConditionAction.bind(null, experimentId)} savedText={d.saved} className="space-y-3">
      {c && <input type="hidden" name="id" value={c.id} />}
      <div className="grid gap-3 md:grid-cols-4">
        <Field name="code" title={d.code}>
          <input name="code" defaultValue={c?.code ?? ""} className={input} placeholder="C4" />
        </Field>
        <Field name="name" title={d.name} className="md:col-span-2">
          <input name="name" defaultValue={c?.name ?? ""} className={input} />
        </Field>
        <Field name="weight" title={d.weight}>
          <input name="weight" type="number" min={0} defaultValue={c?.weight ?? 1} className={input} />
        </Field>
      </div>
      <input type="hidden" name="sort_order" value={c?.sort_order ?? 99} />
      <label className="flex items-center gap-2 text-sm font-medium">
        <input type="checkbox" name="enabled" defaultChecked={l.enabled} />
        {d.showLabel}
      </label>
      <div className="grid gap-3 md:grid-cols-2">
        <Field name="text" title={d.labelText}>
          <input name="text" defaultValue={l.text} className={input} />
        </Field>
        <Field name="description" title={d.labelDesc}>
          <input name="description" defaultValue={l.description} className={input} />
        </Field>
      </div>
      <div className="grid gap-3 md:grid-cols-4">
        <Field name="position" title={d.position}>
          <select name="position" defaultValue={l.position} className={input}>
            {Object.entries(d.positions).map(([v, n]) => (
              <option key={v} value={v}>
                {n}
              </option>
            ))}
          </select>
        </Field>
        <Field name="size" title={d.size}>
          <select name="size" defaultValue={l.size} className={input}>
            <option value="sm">{d.sizes.sm}</option>
            <option value="md">{d.sizes.md}</option>
            <option value="lg">{d.sizes.lg}</option>
          </select>
        </Field>
        <Field name="style" title={d.style}>
          <select name="style" defaultValue={l.style} className={input}>
            <option value="subtle">{d.styles.subtle}</option>
            <option value="badge">{d.styles.badge}</option>
            <option value="banner">{d.styles.banner}</option>
          </select>
        </Field>
        <label className="flex items-end gap-2 pb-2 text-sm">
          <input type="checkbox" name="show_icon" defaultChecked={l.show_icon} />
          {d.showIcon}
        </label>
      </div>
      <button className={btn}>{c ? d.save : d.add}</button>
    </SaveForm>
  );
}

export default async function ConditionsPage(props: PageProps<"/admin/[id]/conditions">) {
  const { id } = await props.params;
  const { d } = await adminDict();
  const store = getStore();
  const exp = await store.getExperiment(id);
  if (!exp) notFound();
  const conditions = await store.listConditions(id);
  const counts = await store.countParticipantsByCondition(id);

  return (
    <div className="space-y-6">
      <Tabs id={id} active="conditions" d={d} />
      <p className="text-sm text-neutral-600">{d.conditionsHelp}</p>
      {conditions.map((c) => (
        <Card
          key={c.id}
          title={`${c.code} ${c.name}`}
          right={
            <div className="flex items-center gap-3">
              <span className="text-xs text-neutral-500">{d.participants(counts[c.id] ?? 0)}</span>
              <ConfirmButton
                action={deleteConditionAction.bind(null, id, c.id)}
                message={(counts[c.id] ?? 0) > 0 ? d.deleteConditionWithData : d.deleteConfirm}
                className={btnDanger}
              >
                {d.delete}
              </ConfirmButton>
            </div>
          }
        >
          <ConditionForm experimentId={id} c={c} d={d} />
        </Card>
      ))}
      <Card title={d.addCondition}>
        <ConditionForm experimentId={id} d={d} />
      </Card>
    </div>
  );
}
