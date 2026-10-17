"use client";

import { useActionState } from "react";
import { startGameAction, type GameActionState } from "./actions";

export function StartForm({ slug, label, pendingLabel }: { slug: string; label: string; pendingLabel: string }) {
  const [state, formAction, pending] = useActionState(async (): Promise<GameActionState> => startGameAction(slug), {});
  return (
    <form action={formAction} className="mt-6">
      {state.error && <p className="mb-2 text-sm text-red-600">{state.error}</p>}
      <button type="submit" disabled={pending} className="w-full rounded-xl bg-neutral-900 px-4 py-3.5 text-base font-semibold text-white disabled:bg-neutral-400">
        {pending ? pendingLabel : label}
      </button>
    </form>
  );
}
