"use client";

import { useActionState, useState } from "react";
import type { SurveyItem } from "@/lib/types";
import type { ActionState } from "@/app/p/[slug]/actions";

type Action = (prev: ActionState, form: FormData) => Promise<ActionState>;

export interface SurveyFormText {
  next: string;
  sending: string;
  missing: string;
}

type Answer = string | string[];

/**
 * 설문 렌더러. 문항 타입별 입력 UI를 그리고 서버 액션으로 제출한다.
 * - 입력값은 React 상태로 관리한다. React 19는 액션 완료 후 폼을 초기화하므로,
 *   비제어 입력이면 서버 검증 실패 시 이미 고른 답이 사라진다.
 * - 필수 문항은 클라이언트에서 먼저 검사해 불필요한 서버 왕복을 막는다(서버 검증은 그대로 유지).
 * - hidden 으로 노출 시간 같은 부가 데이터를 함께 보낼 수 있다.
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
  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  const [clientMissing, setClientMissing] = useState<string[] | null>(null);

  const missing = new Set(clientMissing ?? state.missing ?? []);
  const errorText = clientMissing ? text.missing : state.error;

  function isEmpty(item: SurveyItem): boolean {
    const v = answers[item.id];
    if (v === undefined) return true;
    if (Array.isArray(v)) return v.length === 0;
    return v.trim() === "";
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    const miss = items.filter((i) => i.required && isEmpty(i)).map((i) => i.code);
    if (miss.length > 0) {
      e.preventDefault();
      setClientMissing(miss);
      const first = e.currentTarget.querySelector<HTMLElement>(`[data-item-code="${miss[0]}"]`);
      first?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    setClientMissing(null);
  }

  const set = (id: string, v: Answer) => setAnswers((a) => ({ ...a, [id]: v }));

  return (
    <form action={formAction} onSubmit={onSubmit} className="space-y-6" noValidate>
      {children}
      {hidden &&
        Object.entries(hidden).map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)}

      {items.map((item, idx) => (
        <fieldset
          key={item.id}
          data-item-code={item.code}
          className={`rounded-lg border p-4 ${
            missing.has(item.code) ? "border-red-400 bg-red-50/50" : "border-neutral-200"
          }`}
        >
          <legend className="px-1 text-sm font-medium">
            <span className="mr-2 text-neutral-400">Q{idx + 1}</span>
            {item.text}
            {item.required && <span className="ml-1 text-red-500">*</span>}
          </legend>
          <ItemInput item={item} value={answers[item.id]} onChange={(v) => set(item.id, v)} />
        </fieldset>
      ))}

      {errorText && (
        <p data-survey-error role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {errorText}
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

function ItemInput({
  item,
  value,
  onChange,
}: {
  item: SurveyItem;
  value: Answer | undefined;
  onChange: (v: Answer) => void;
}) {
  const name = `item_${item.id}`;

  if (item.type === "likert") {
    const n = Math.max(2, item.scale_points || 7);
    const points = Array.from({ length: n }, (_, i) => i + 1);
    return (
      <div className="mt-3">
        <div className="flex justify-between gap-2">
          {points.map((p) => (
            <label key={p} className="flex flex-1 cursor-pointer flex-col items-center gap-1 text-xs">
              <input
                type="radio"
                name={name}
                value={p}
                checked={value === String(p)}
                onChange={() => onChange(String(p))}
                className="h-5 w-5 accent-neutral-900"
              />
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

  if (item.type === "single") {
    return (
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {item.options.map((opt) => (
          <label
            key={opt}
            className="flex cursor-pointer items-center gap-2 rounded-md border border-neutral-200 px-3 py-2 text-sm has-[:checked]:border-neutral-900 has-[:checked]:bg-neutral-100"
          >
            <input
              type="radio"
              name={name}
              value={opt}
              checked={value === opt}
              onChange={() => onChange(opt)}
              className="accent-neutral-900"
            />
            {opt}
          </label>
        ))}
      </div>
    );
  }

  if (item.type === "multi") {
    const arr = Array.isArray(value) ? value : [];
    return (
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {item.options.map((opt) => (
          <label
            key={opt}
            className="flex cursor-pointer items-center gap-2 rounded-md border border-neutral-200 px-3 py-2 text-sm has-[:checked]:border-neutral-900 has-[:checked]:bg-neutral-100"
          >
            <input
              type="checkbox"
              name={name}
              value={opt}
              checked={arr.includes(opt)}
              onChange={(e) => onChange(e.target.checked ? [...arr, opt] : arr.filter((o) => o !== opt))}
              className="accent-neutral-900"
            />
            {opt}
          </label>
        ))}
      </div>
    );
  }

  if (item.type === "number") {
    return (
      <input
        type="number"
        name={name}
        value={typeof value === "string" ? value : ""}
        onChange={(e) => onChange(e.target.value)}
        className="mt-3 w-full rounded-md border border-neutral-300 px-3 py-2"
      />
    );
  }

  return (
    <textarea
      name={name}
      rows={3}
      value={typeof value === "string" ? value : ""}
      onChange={(e) => onChange(e.target.value)}
      className="mt-3 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
    />
  );
}
