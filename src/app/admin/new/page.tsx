import { requireAdmin } from "@/lib/auth";
import { createExperimentAction } from "../actions";
import { SaveForm } from "@/components/admin/SaveForm";
import { btn, Card, Field, input } from "@/components/admin/ui";

export const dynamic = "force-dynamic";

export default async function NewExperimentPage() {
  await requireAdmin();
  return (
    <div className="mx-auto max-w-xl space-y-4">
      <h1 className="text-xl font-bold">新しい実験</h1>
      <Card>
        <SaveForm action={createExperimentAction} className="space-y-4">
          <Field name="title" title="タイトル">
            <input id="title" name="title" className={input} placeholder="AI広告開示 実験1" required />
          </Field>
          <Field name="slug" title="URLスラッグ（英数字・ハイフン、空欄なら自動）">
            <input id="slug" name="slug" className={input} placeholder="study1" />
          </Field>
          <Field name="description" title="メモ">
            <textarea id="description" name="description" className={input} rows={2} />
          </Field>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="with_presets" defaultChecked />
            プリセットを読み込む（条件C0〜C3、デモ広告2本、基本質問セット）
          </label>
          <button className={btn}>作成</button>
        </SaveForm>
      </Card>
    </div>
  );
}
