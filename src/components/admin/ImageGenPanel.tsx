import type { Ad, AdImage } from "@/lib/types";
import type { Dict } from "@/lib/i18n";
import type { FormState } from "@/app/admin/actions";
import { SaveForm } from "./SaveForm";
import { ConfirmButton } from "./ConfirmButton";
import { btn, btnDanger, btnGhost, Field, input } from "./ui";

/**
 * 광고별 AI 이미지 생성 패널. 프롬프트로 후보를 만들고, 후보 중 하나를 광고 이미지로 채택한다.
 * 서버 컴포넌트. 생성 액션은 bind 된 서버 액션으로 전달받는다.
 */
export function ImageGenPanel({
  ad,
  candidates,
  models,
  defaultModel,
  available,
  d,
  generateAction,
  adoptAction,
  deleteAction,
}: {
  ad: Ad;
  candidates: AdImage[];
  models: Array<{ id: string; label: string }>;
  defaultModel: string;
  available: boolean;
  d: Dict["a"];
  generateAction: (prev: FormState, form: FormData) => Promise<FormState>;
  adoptAction: (imageId: string) => () => Promise<void>;
  deleteAction: (imageId: string) => () => Promise<void>;
}) {
  return (
    <div className="mt-4 rounded-lg border border-dashed border-neutral-300 bg-neutral-50 p-4">
      <h3 className="text-sm font-semibold">{d.genTitle}</h3>
      {ad.gen_model && <p className="mt-1 text-xs text-neutral-500">{d.genInfo(ad.gen_model)}</p>}

      {!available ? (
        <p className="mt-2 text-sm text-amber-800">{d.genUnavailable}</p>
      ) : (
        <SaveForm action={generateAction} savedText={d.saved} className="mt-3 space-y-3">
          <Field name={`prompt-${ad.id}`} title={d.genPrompt}>
            <textarea id={`prompt-${ad.id}`} name="prompt" rows={4} defaultValue={ad.gen_prompt} className={input} />
          </Field>
          <div className="grid gap-3 md:grid-cols-[1fr_120px_auto] md:items-end">
            <Field name={`model-${ad.id}`} title={d.genModel}>
              <select id={`model-${ad.id}`} name="model" defaultValue={defaultModel} className={input}>
                {models.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field name={`count-${ad.id}`} title={d.genCount}>
              <input id={`count-${ad.id}`} name="count" type="number" min={1} max={4} defaultValue={1} className={input} />
            </Field>
            <GenerateButton label={d.genButton} pendingLabel={d.genPending} />
          </div>
        </SaveForm>
      )}

      <h4 className="mt-4 text-xs font-medium text-neutral-600">{d.genCandidates}</h4>
      {candidates.length === 0 ? (
        <p className="mt-1 text-xs text-neutral-500">{d.genNone}</p>
      ) : (
        <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {candidates.map((c) => {
            const inUse = c.image_url === ad.image_url;
            return (
              <div key={c.id} className={`overflow-hidden rounded-md border bg-white ${inUse ? "border-neutral-900" : "border-neutral-200"}`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={c.image_url} alt="" className="aspect-square w-full object-cover" />
                <div className="space-y-1 p-2">
                  <div className="truncate text-[10px] text-neutral-500" title={c.prompt}>
                    {c.model}
                  </div>
                  <div className="flex gap-1">
                    {inUse ? (
                      <span className={`${btnGhost} flex-1 cursor-default text-xs`}>{d.genInUse}</span>
                    ) : (
                      <form action={adoptAction(c.id)} className="flex-1">
                        <button className={`${btn} w-full text-xs`}>{d.genUse}</button>
                      </form>
                    )}
                    <ConfirmButton action={deleteAction(c.id)} message={d.deleteConfirm} className={`${btnDanger} text-xs`}>
                      {d.genDelete}
                    </ConfirmButton>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function GenerateButton({ label, pendingLabel }: { label: string; pendingLabel: string }) {
  return (
    <button className={`${btn} group`} data-pending-label={pendingLabel}>
      <span className="group-[[data-pending=true]_&]:hidden">{label}</span>
      <span className="hidden group-[[data-pending=true]_&]:inline">{pendingLabel}</span>
    </button>
  );
}
