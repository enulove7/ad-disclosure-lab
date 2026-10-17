"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getStore } from "@/lib/db";
import { asLocale, t } from "@/lib/i18n";
import { clearGameSession, gameSettings, getCurrentGameSession, startGameSession } from "@/lib/game";

export interface GameActionState {
  error?: string;
}

async function loadGame(slug: string) {
  const g = await getStore().getGameBySlug(slug);
  if (!g) throw new Error("game not found");
  return g;
}

export async function startGameAction(slug: string): Promise<GameActionState> {
  const game = await loadGame(slug);
  const d = t(asLocale(gameSettings(game).locale)).g;
  if (game.status !== "active") return { error: d.closed };
  const existing = await getCurrentGameSession(game);
  if (existing && !existing.completed_at) redirect(`/g/${slug}/play`);
  const ua = (await headers()).get("user-agent") ?? "";
  try {
    await startGameSession(game, ua);
  } catch (e) {
    return { error: e instanceof Error && e.message === "NO_CARDS" ? d.noCards : d.preparing };
  }
  redirect(`/g/${slug}/play`);
}

export interface AnswerInput {
  cardId: string;
  order: number;
  guessAi: boolean;
  likingBefore: number | null;
  likingAfter: number | null;
  responseMs: number;
}

/** 카드 1장 답변 저장. 마지막 카드면 세션을 완료 처리하고 true 반환 */
export async function answerAction(slug: string, input: AnswerInput): Promise<{ done: boolean }> {
  const store = getStore();
  const game = await loadGame(slug);
  const session = await getCurrentGameSession(game);
  if (!session || session.completed_at) return { done: true };
  if (!session.card_ids.includes(input.cardId)) return { done: false };
  const existing = await store.listGameAnswers(session.id);
  if (existing.some((a) => a.card_id === input.cardId)) {
    return { done: existing.length >= session.card_ids.length };
  }
  const card = (await store.listGameCards(game.id)).find((c) => c.id === input.cardId);
  if (!card) return { done: false };
  const correct = input.guessAi === card.is_ai;
  await store.createGameAnswer({
    session_id: session.id,
    card_id: card.id,
    sort_order: input.order,
    guess_ai: input.guessAi,
    correct,
    liking_before: input.likingBefore,
    liking_after: input.likingAfter,
    response_ms: Math.max(0, Math.round(input.responseMs)),
    answered_at: new Date().toISOString(),
  });
  const answered = existing.length + 1;
  if (answered >= session.card_ids.length) {
    const score = existing.filter((a) => a.correct).length + (correct ? 1 : 0);
    await store.updateGameSession(session.id, { score, total: session.card_ids.length, completed_at: new Date().toISOString() });
    return { done: true };
  }
  return { done: false };
}

export async function playAgainAction(slug: string) {
  const game = await loadGame(slug);
  await clearGameSession(game);
  redirect(`/g/${slug}`);
}
