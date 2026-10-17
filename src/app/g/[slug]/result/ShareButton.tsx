"use client";

import { useState } from "react";

export function ShareButton({ label, copied, text, url }: { label: string; copied: string; text: string; url: string }) {
  const [done, setDone] = useState(false);
  async function share() {
    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({ text, url });
        return;
      }
      await navigator.clipboard.writeText(text);
      setDone(true);
      setTimeout(() => setDone(false), 2000);
    } catch {
      /* 사용자가 취소한 경우 등: 무시 */
    }
  }
  return (
    <button type="button" onClick={share} className="rounded-xl bg-neutral-900 px-4 py-3 text-sm font-semibold text-white">
      {done ? copied : label}
    </button>
  );
}
