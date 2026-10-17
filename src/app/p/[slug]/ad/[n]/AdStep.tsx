"use client";

import { useEffect, useState } from "react";
import type { Ad, LabelConfig, SurveyItem } from "@/lib/types";
import type { ActionState } from "@/app/p/[slug]/actions";
import { AdCard } from "@/components/AdCard";
import { SurveyForm } from "@/components/SurveyForm";
import { ctaClickAction } from "@/app/p/[slug]/actions";

export interface AdStepText {
  instruction: string;
  /** "{s}" 자리에 남은 초가 들어간다 */
  waitTemplate: string;
  surveyHeading: string;
  adWord: string;
  next: string;
  sending: string;
  missing: string;
}

/**
 * 광고 노출 단계. 최소 노출 시간이 지나야 설문이 열리고,
 * 실제 노출 시작 시각과 제출까지 걸린 시간(ms)을 함께 전송한다.
 */
export function AdStep({
  slug,
  exposureId,
  ad,
  label,
  items,
  action,
  minSeconds,
  text,
}: {
  slug: string;
  exposureId: string;
  ad: Ad;
  label: LabelConfig;
  items: SurveyItem[];
  action: (prev: ActionState, form: FormData) => Promise<ActionState>;
  minSeconds: number;
  text: AdStepText;
}) {
  // 노출 시작 시각은 클라이언트에서 마운트된 순간으로 기록한다.
  // 서버 렌더와 값이 달라지는 것을 피하기 위해 마운트 후 setInterval 콜백 안에서만 갱신한다.
  const [clock, setClock] = useState<{ startIso: string; startMs: number; elapsedMs: number } | null>(null);

  useEffect(() => {
    const startMs = Date.now();
    const startIso = new Date(startMs).toISOString();
    const tick = () => setClock({ startIso, startMs, elapsedMs: Date.now() - startMs });
    const id = setInterval(tick, 250);
    const first = setTimeout(tick, 0);
    return () => {
      clearInterval(id);
      clearTimeout(first);
    };
  }, []);

  const [ctaClicked, setCtaClicked] = useState(false);
  function onCta() {
    if (ctaClicked) return;
    setCtaClicked(true);
    void ctaClickAction(slug, exposureId);
  }

  const elapsedMs = clock?.elapsedMs ?? 0;
  const remaining = Math.max(0, Math.ceil(minSeconds - elapsedMs / 1000));
  const revealed = clock !== null && remaining === 0;

  return (
    <div className="space-y-6">
      <p className="text-sm text-neutral-600">{text.instruction}</p>
      <AdCard ad={ad} label={label} adWord={text.adWord} onCtaClick={onCta} />

      {!revealed ? (
        <p className="text-center text-sm text-neutral-500">{text.waitTemplate.replace("{s}", String(remaining))}</p>
      ) : (
        <>
          <h2 className="text-base font-semibold">{text.surveyHeading}</h2>
          <SurveyForm
            items={items}
            action={action}
            text={{ next: text.next, sending: text.sending, missing: text.missing }}
            hidden={{ shown_at: clock.startIso, duration_ms: String(elapsedMs) }}
          />
        </>
      )}
    </div>
  );
}
