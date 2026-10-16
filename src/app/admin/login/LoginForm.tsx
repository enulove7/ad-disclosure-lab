"use client";

import { useActionState } from "react";
import { loginAction } from "../actions";
import { btn, input } from "@/components/admin/ui";

export function LoginForm({ next, placeholder, buttonLabel }: { next: string; placeholder: string; buttonLabel: string }) {
  const [state, formAction, pending] = useActionState(loginAction, {});
  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="next" value={next} />
      <input type="password" name="password" placeholder={placeholder} className={input} autoFocus />
      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      <button type="submit" disabled={pending} className={`${btn} w-full`}>
        {buttonLabel}
      </button>
    </form>
  );
}
