"use client";

import { useActionState } from "react";
import type { FormState } from "@/app/admin/actions";

/** 서버 액션과 상태 메시지를 묶은 범용 폼 래퍼 */
export function SaveForm({
  action,
  children,
  className = "",
}: {
  action: (prev: FormState, form: FormData) => Promise<FormState>;
  children: React.ReactNode;
  className?: string;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  return (
    <form action={formAction} className={className} data-pending={pending}>
      {children}
      {state.error && <p className="mt-2 text-sm text-red-600">{state.error}</p>}
      {state.ok && !pending && <p className="mt-2 text-sm text-green-700">保存しました。</p>}
    </form>
  );
}
