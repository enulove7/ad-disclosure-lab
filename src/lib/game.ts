import "server-only";
import { cookies } from "next/headers";
import { randomUUID } from "node:crypto";
import { getStore } from "@/lib/db";
import { DEFAULT_GAME_SETTINGS, type Game, type GameAnswer, type GameCard, type GameSession } from "@/lib/types";

export function gameCookieName(gameId: string) {
  return `adl_g_${gameId}`;
}

export function gameSettings(game: Game) {
  return { ...DEFAULT_GAME_SETTINGS, ...game.settings };
}

export async function getCurrentGameSession(game: Game): Promise<GameSession | null> {
  const jar = await cookies();
  const token = jar.get(gameCookieName(game.id))?.value;
  if (!token) return null;
  const s = await getStore().getGameSessionByToken(token);
  return s && s.game_id === game.id ? s : null;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** 새 판 시작: 카드 무작위 선택·순서 확정, 세션 생성, 쿠키 발급 */
export async function startGameSession(game: Game, userAgent: string): Promise<GameSession> {
  const store = getStore();
  const settings = gameSettings(game);
  const cards = (await store.listGameCards(game.id)).filter((c) => c.image_url);
  if (cards.length === 0) throw new Error("NO_CARDS");
  let picked = shuffle(cards);
  if (settings.cards_per_round > 0) picked = picked.slice(0, settings.cards_per_round);
  const token = randomUUID();
  const session = await store.createGameSession({
    game_id: game.id,
    token,
    card_ids: picked.map((c) => c.id),
    user_agent: userAgent.slice(0, 500),
    started_at: new Date().toISOString(),
    completed_at: null,
    score: 0,
    total: picked.length,
  });
  const jar = await cookies();
  jar.set(gameCookieName(game.id), token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24,
  });
  return session;
}

export async function clearGameSession(game: Game) {
  const jar = await cookies();
  jar.delete(gameCookieName(game.id));
}

/** 완료된 다른 세션들 대비 상위 몇 % 인지 (높을수록 좋음). 비교 대상이 없으면 null */
export function percentile(score: number, total: number, others: GameSession[]): number | null {
  const done = others.filter((s) => s.completed_at && s.total > 0);
  if (done.length === 0) return null;
  const mine = score / total;
  const better = done.filter((s) => s.score / s.total > mine).length;
  return Math.max(1, Math.round(((better + 1) / (done.length + 1)) * 100));
}

export interface LikingShift {
  ai: { n: number; before: number; after: number } | null;
  human: { n: number; before: number; after: number } | null;
}

export function likingShift(answers: GameAnswer[], cards: GameCard[]): LikingShift {
  const isAi = new Map(cards.map((c) => [c.id, c.is_ai]));
  const calc = (ai: boolean) => {
    const xs = answers.filter((a) => isAi.get(a.card_id) === ai && a.liking_before != null && a.liking_after != null);
    if (xs.length === 0) return null;
    const before = xs.reduce((s, a) => s + (a.liking_before ?? 0), 0) / xs.length;
    const after = xs.reduce((s, a) => s + (a.liking_after ?? 0), 0) / xs.length;
    return { n: xs.length, before, after };
  };
  return { ai: calc(true), human: calc(false) };
}

export interface CardStat {
  card: GameCard;
  n: number;
  accuracy: number | null;
  before: number | null;
  after: number | null;
}

export function cardStats(cards: GameCard[], answers: GameAnswer[]): CardStat[] {
  return cards.map((card) => {
    const xs = answers.filter((a) => a.card_id === card.id);
    const n = xs.length;
    const acc = n ? xs.filter((a) => a.correct).length / n : null;
    const withL = xs.filter((a) => a.liking_before != null && a.liking_after != null);
    const before = withL.length ? withL.reduce((s, a) => s + (a.liking_before ?? 0), 0) / withL.length : null;
    const after = withL.length ? withL.reduce((s, a) => s + (a.liking_after ?? 0), 0) / withL.length : null;
    return { card, n, accuracy: acc, before, after };
  });
}
