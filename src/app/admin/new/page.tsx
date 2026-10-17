import { requireAdmin } from "@/lib/auth";
import { adminDict } from "@/lib/i18n-server";
import { LOCALES, LOCALE_NAMES } from "@/lib/i18n";
import { createExperimentAction } from "../actions";
import { SaveForm } from "@/components/admin/SaveForm";
import { btn, Card, Field, input } from "@/components/admin/ui";

export const dynamic = "force-dynamic";

export default async function NewExperimentPage() {
  await requireAdmin();
  const { locale, d } = await adminDict();
  return (
    <div className="mx-auto max-w-xl space-y-4">
      <h1 className="text-xl font-bold">{d.newExperiment}</h1>
      <Card>
        <SaveForm action={createExperimentAction} savedText={d.saved} className="space-y-4">
          <Field name="title" title={d.title}>
            <input id="title" name="title" className={input} required />
          </Field>
          <Field name="slug" title={d.slug}>
            <input id="slug" name="slug" className={input} placeholder="study1" />
          </Field>
          <Field name="locale" title={d.language}>
            <select id="locale" name="locale" defaultValue={locale} className={input}>
              {LOCALES.map((l) => (
                <option key={l} value={l}>
                  {LOCALE_NAMES[l]}
                </option>
              ))}
            </select>
          </Field>
          <Field name="description" title={d.memo}>
            <textarea id="description" name="description" className={input} rows={2} />
          </Field>
          <Field name="preset_kind" title={d.presetKind}>
            <select id="preset_kind" name="preset_kind" defaultValue="main" className={input}>
              <option value="main">{d.presetMain}</option>
              <option value="pretest">{d.presetPretest}</option>
              <option value="thesis">{d.presetThesis}</option>
              <option value="none">{d.presetNone}</option>
            </select>
          </Field>
          <button className={btn}>{d.create}</button>
        </SaveForm>
      </Card>
    </div>
  );
}
