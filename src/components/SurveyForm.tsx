"use client";

import { useActionState } from "react";
import type { SurveyItem } from "@/lib/types";
import type { ActionState } from "@/app/p/[slug]/actions";

type Action = (prev: ActionState, form: FormData) => Promise<ActionState>;

export interface SurveyFormText {
  next: string;
  sending: string;
}

/**
 * 설문 렌더러. 문항 타입별 입력 UI를 그리고 서버 액션으로 제출한다.
 * hidden 으로 노출 시간 같은 부가 데이터를 함께 보낼 수 있다.
 */
export function SurveyForm({
  items,
  action,
  text,
  submitLabel,
  hidden,
  disabled = false,
  children,
}: {
  items: SurveyItem[];
  action: Action;
  text: SurveyFormText;
  submitLabel?: string;
  hidden?: Record<string, string>;
  disabled?: boolean;
  children?: React.ReactNode;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  const missing = new Set(state.missing ?? []);

  return (
    <form action={formAction} className="space-y-6">
      {children}
      {hidden &&
        Object.entries(hidden).map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)}

      {items.map((item, idx) => (
        <fieldset
          key={item.id}
          className={`rounded-lg border p-4 ${
            missing.has(item.code) ? "border-red-400 bg-red-50/50" : "border-neutral-200"
          }`}
        >
          <legend className="px-1 text-sm font-medium">
            <span className="mr-2 text-neutral-400">Q{idx + 1}</span>
            {item.text}
            {item.required && <span className="ml-1 text-red-500">*</span>}
          </legend>
          <ItemInput item={item} />
        </fieldset>
      ))}

      {state.error && (
        <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending || disabled}
        className="w-full rounded-lg bg-neutral-900 px-4 py-3 text-base font-semibold text-white disabled:cursor-not-allowed disabled:bg-neutral-400"
      >
        {pending ? text.sending : (submitLabel ?? text.next)}
      </button>
    </form>
  );
}

function ItemInput({ item }: { item: SurveyItem }) {
  const name = `item_${item.id}`;

  if (item.type === "likert") {
    const n = Math.max(2, item.scale_points || 7);
    const points = Array.from({ length: n }, (_, i) => i + 1);
    return (
      <div className="mt-3">
        <div className="flex justify-between gap-2">
          {points.map((p) => (
            <label key={p} className="flex flex-1 cursor-pointer flex-col items-center gap-1 text-xs">
              <input type="radio" name={name} value={p} className="h-5 w-5 accent-neutral-900" />
              <span>{p}</span>
            </label>
          ))}
        </div>
        {item.scale_labels?.length === 2 && (
          <div className="mt-1 flex justify-between text-[11px] text-neutral-500">
            <span>{item.scale_labels[0]}</span>
            <span>{item.scale_labels[1]}</span>
          </div>
        )}
      </div>
    );
  }

  if (item.type === "single" || item.type === "multi") {
    const type = item.type === "single" ? "radio" : "checkbox";
    return (
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {item.options.map((opt) => (
          <label
            key={opt}
            className="flex cursor-pointer items-center gap-2 rounded-md border border-neutral-200 px-3 py-2 text-sm has-[:checked]:border-neutral-900 has-[:checked]:bg-neutral-100"
          >
            <input type={type} name={name} value={opt} className="accent-neutral-900" />
            {opt}
          </label>
        ))}
      </div>
    );
  }

  if (item.type === "number") {
    return (
      <input type="number" name={name} className="mt-3 w-full rounded-md border border-neutral-300 px-3 py-2" />
    );
  }

  return (
    <textarea name={name} rows={3} className="mt-3 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm" />
  );
}
