"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { answerAction } from "../actions";

export interface PlayCard {
  id: string;
  brand_name: string;
  headline: string;
  body_text: string;
  image_url: string;
  is_ai: boolean;
}

type Step = "before" | "guess" | "reveal" | "after";

/** 서버 → 클라이언트로 넘기는 문구 (함수 없이 문자열만) */
export interface PlayText {
  likingQ: string;
  likingLow: string;
  likingHigh: string;
  guessQ: string;
  guessAi: string;
  guessHuman: string;
  correct: string;
  wrong: string;
  revealAi: string;
  revealHuman: string;
  likingAfterQ: string;
  next: string;
  finish: string;
}

/**
 * 게임 본체. 카드마다 (호감도 → AI/사람 판정 → 정답 공개 → 호감도 재측정) 순서로 진행하고
 * 카드 하나가 끝날 때마다 서버에 저장한다.
 */
export function Play({
  slug,
  locale,
  cards,
  startIndex,
  askLiking,
  text: d,
}: {
  slug: string;
  locale: string;
  cards: PlayCard[];
  startIndex: number;
  askLiking: boolean;
  text: PlayText;
}) {
  const router = useRouter();
  const [idx, setIdx] = useState(startIndex);
  const [step, setStep] = useState<Step>(askLiking ? "before" : "guess");
  const [before, setBefore] = useState<number | null>(null);
  const [after, setAfter] = useState<number | null>(null);
  const [guess, setGuess] = useState<boolean | null>(null);
  const [pending, startTransition] = useTransition();
  const shownAt = useRef<number>(0);

  useEffect(() => {
    shownAt.current = Date.now();
  }, [idx]);

  const card = cards[idx];
  const total = cards.length;
  if (!card) return null;
  const correct = guess !== null && guess === card.is_ai;

  function choose(g: boolean) {
    setGuess(g);
    setStep("reveal");
  }

  function finishCard(afterVal: number | null) {
    const g = guess;
    if (g === null) return;
    startTransition(async () => {
      const res = await answerAction(slug, {
        cardId: card.id,
        order: idx,
        guessAi: g,
        likingBefore: before,
        likingAfter: afterVal,
        responseMs: Date.now() - shownAt.current,
      });
      if (res.done || idx + 1 >= total) {
        router.push(`/g/${slug}/result`);
        return;
      }
      setIdx(idx + 1);
      setStep(askLiking ? "before" : "guess");
      setBefore(null);
      setAfter(null);
      setGuess(null);
    });
  }

  return (
    <main lang={locale} className="mx-auto flex w-full max-w-md flex-1 flex-col px-4 py-4">
      <div className="mb-3 flex items-center justify-between text-xs text-neutral-500">
        <span>{idx + 1} / {total}</span>
        <div className="ml-3 h-1.5 flex-1 overflow-hidden rounded-full bg-neutral-200">
          <div className="h-full bg-neutral-900 transition-all" style={{ width: `${Math.round(((idx + (step === "after" || step === "reveal" ? 0.7 : step === "guess" ? 0.4 : 0.1)) / total) * 100)}%` }} />
        </div>
      </div>

      <article className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
        <header className="flex items-center gap-3 px-4 py-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-neutral-700 to-neutral-900 text-sm font-bold text-white">
            {card.brand_name.slice(0, 1)}
          </div>
          <div className="leading-tight">
            <div className="text-sm font-semibold">{card.brand_name}</div>
            <div className="text-xs text-neutral-500">AD</div>
          </div>
        </header>
        <div className="relative aspect-square w-full bg-neutral-100">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={card.image_url} alt="" className="h-full w-full object-cover" draggable={false} />
          {step === "reveal" || step === "after" ? (
            <div className={`absolute inset-x-0 bottom-0 px-4 py-3 text-sm font-semibold text-white ${correct ? "bg-emerald-600/90" : "bg-rose-600/90"}`}>
              <div className="text-base">{correct ? d.correct : d.wrong}</div>
              <div className="font-normal opacity-95">{card.is_ai ? d.revealAi : d.revealHuman}</div>
            </div>
          ) : null}
        </div>
        {(card.headline || card.body_text) && (
          <div className="px-4 py-3">
            <p className="text-sm">
              <span className="font-semibold">{card.brand_name}</span> <span className="font-semibold">{card.headline}</span>
            </p>
            {card.body_text && <p className="mt-0.5 text-sm text-neutral-700">{card.body_text}</p>}
          </div>
        )}
      </article>

      <section className="mt-4 rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
        {step === "before" && (
          <LikingRow question={d.likingQ} low={d.likingLow} high={d.likingHigh} value={before} onPick={(v) => { setBefore(v); setStep("guess"); }} />
        )}
        {step === "guess" && (
          <div>
            <p className="mb-3 text-center text-base font-semibold">{d.guessQ}</p>
            <div className="grid grid-cols-2 gap-3">
              <button type="button" onClick={() => choose(true)} className="rounded-xl bg-violet-600 px-3 py-4 text-base font-bold text-white active:scale-95">
                🤖 {d.guessAi}
              </button>
              <button type="button" onClick={() => choose(false)} className="rounded-xl bg-amber-500 px-3 py-4 text-base font-bold text-white active:scale-95">
                🧑‍🎨 {d.guessHuman}
              </button>
            </div>
          </div>
        )}
        {step === "reveal" && (
          <div className="text-center">
            {askLiking ? (
              <button type="button" onClick={() => setStep("after")} className="w-full rounded-xl bg-neutral-900 px-4 py-3.5 text-base font-semibold text-white">
                {d.next}
              </button>
            ) : (
              <button type="button" disabled={pending} onClick={() => finishCard(null)} className="w-full rounded-xl bg-neutral-900 px-4 py-3.5 text-base font-semibold text-white disabled:bg-neutral-400">
                {idx + 1 >= total ? d.finish : d.next}
              </button>
            )}
          </div>
        )}
        {step === "after" && (
          <div>
            <LikingRow question={d.likingAfterQ} low={d.likingLow} high={d.likingHigh} value={after} onPick={(v) => setAfter(v)} />
            <button
              type="button"
              disabled={after === null || pending}
              onClick={() => finishCard(after)}
              className="mt-4 w-full rounded-xl bg-neutral-900 px-4 py-3.5 text-base font-semibold text-white disabled:bg-neutral-400"
            >
              {idx + 1 >= total ? d.finish : d.next}
            </button>
          </div>
        )}
      </section>
    </main>
  );
}

function LikingRow({ question, low, high, value, onPick }: { question: string; low: string; high: string; value: number | null; onPick: (v: number) => void }) {
  return (
    <div>
      <p className="mb-3 text-center text-base font-semibold">{question}</p>
      <div className="flex justify-between gap-1.5">
        {[1, 2, 3, 4, 5, 6, 7].map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => onPick(v)}
            className={`h-11 flex-1 rounded-lg border text-sm font-semibold transition ${
              value === v ? "border-neutral-900 bg-neutral-900 text-white" : "border-neutral-300 bg-white text-neutral-800 active:bg-neutral-100"
            }`}
          >
            {v}
          </button>
        ))}
      </div>
      <div className="mt-1 flex justify-between text-[11px] text-neutral-500">
        <span>{low}</span>
        <span>{high}</span>
      </div>
    </div>
  );
}
