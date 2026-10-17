"use client";

import { useActionState } from "react";
import { consentAction, type ActionState } from "./actions";
import type { EntryInfo } from "@/lib/participant";

export function ConsentForm({
  slug,
  entry,
  startLabel,
  pendingLabel,
}: {
  slug: string;
  entry: EntryInfo;
  startLabel: string;
  pendingLabel: string;
}) {
  const [state, formAction, pending] = useActionState(
    async (): Promise<ActionState> => consentAction(slug, entry),
    {},
  );
  return (
    <form action={formAction} className="mt-6 space-y-3">
      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-neutral-900 px-4 py-3 font-semibold text-white disabled:bg-neutral-400"
      >
        {pending ? pendingLabel : startLabel}
      </button>
    </form>
  );
}
