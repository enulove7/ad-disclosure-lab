import "server-only";
import { cookies } from "next/headers";
import { randomUUID } from "node:crypto";
import { getStore } from "@/lib/db";
import type { Condition, Experiment, Exposure, Participant, SurveyItem } from "@/lib/types";
import { DEFAULT_SETTINGS } from "@/lib/types";

export function participantCookieName(experimentId: string) {
  return `adl_p_${experimentId}`;
}

export async function getCurrentParticipant(experiment: Experiment): Promise<Participant | null> {
  const jar = await cookies();
  const token = jar.get(participantCookieName(experiment.id))?.value;
  if (!token) return null;
  const p = await getStore().getParticipantByToken(token);
  if (!p || p.experiment_id !== experiment.id) return null;
  return p;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** balanced: 배정 수가 가장 적은 조건 중 무작위. weighted: 가중치 비례 확률. */
export function pickCondition(
  conditions: Condition[],
  counts: Record<string, number>,
  mode: "balanced" | "weighted",
): Condition {
  if (conditions.length === 0) throw new Error("no conditions");
  if (mode === "weighted") {
    const total = conditions.reduce((s, c) => s + Math.max(0, c.weight), 0);
    let r = Math.random() * total;
    for (const c of conditions) {
      r -= Math.max(0, c.weight);
      if (r <= 0) return c;
    }
    return conditions[conditions.length - 1];
  }
  // balanced: count/weight 가 가장 작은 조건 우선 (weight는 목표 비율로 해석)
  const scored = conditions.map((c) => ({
    c,
    score: (counts[c.id] ?? 0) / Math.max(1, c.weight),
  }));
  const min = Math.min(...scored.map((s) => s.score));
  const pool = scored.filter((s) => s.score === min).map((s) => s.c);
  return pool[Math.floor(Math.random() * pool.length)];
}

/** 동의 직후 호출: 참가자 생성, 조건 배정, 광고 노출 순서 확정, 쿠키 발급 */
export async function startParticipant(experiment: Experiment, userAgent: string): Promise<Participant> {
  const store = getStore();
  const settings = { ...DEFAULT_SETTINGS, ...experiment.settings };
  const [conditions, ads, counts] = await Promise.all([
    store.listConditions(experiment.id),
    store.listAds(experiment.id),
    store.countParticipantsByCondition(experiment.id),
  ]);
  if (conditions.length === 0) throw new Error("この実験には条件が設定されていません。");
  if (ads.length === 0) throw new Error("この実験には広告が登録されていません。");

  const condition = pickCondition(conditions, counts, settings.assignment);
  const token = randomUUID();
  const participant = await store.createParticipant({
    experiment_id: experiment.id,
    condition_id: condition.id,
    token,
    status: "started",
    user_agent: userAgent.slice(0, 500),
    started_at: new Date().toISOString(),
    completed_at: null,
  });

  let ordered = settings.randomize_ad_order ? shuffle(ads) : ads;
  if (settings.ads_per_participant > 0) ordered = ordered.slice(0, settings.ads_per_participant);

  await store.createExposures(
    ordered.map((ad, i) => ({
      participant_id: participant.id,
      ad_id: ad.id,
      condition_id: condition.id,
      sort_order: i,
      label_snapshot: condition.label_config,
      shown_at: null,
      duration_ms: null,
    })),
  );

  const jar = await cookies();
  jar.set(participantCookieName(experiment.id), token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return participant;
}

/** 참가자 상태에 맞는 다음 화면 경로 */
export function nextStepPath(slug: string, p: Participant, exposures: Exposure[]): string {
  if (p.status === "started") return `/p/${slug}/pre`;
  if (p.status === "pre_done") {
    const next = exposures.find((x) => x.duration_ms === null);
    if (next) return `/p/${slug}/ad/${next.sort_order + 1}`;
    return `/p/${slug}/final`;
  }
  if (p.status === "ads_done") return `/p/${slug}/final`;
  return `/p/${slug}/done`;
}

/** FormData → 응답값 파싱 + 필수 검증. 오류가 있으면 메시지 배열 반환 */
export function parseAnswers(
  items: SurveyItem[],
  form: FormData,
): { values: Record<string, unknown>; errors: string[] } {
  const values: Record<string, unknown> = {};
  const errors: string[] = [];
  for (const item of items) {
    const key = `item_${item.id}`;
    let v: unknown = null;
    if (item.type === "multi") {
      const all = form.getAll(key).map(String).filter(Boolean);
      v = all.length ? all : null;
    } else if (item.type === "likert" || item.type === "number") {
      const raw = form.get(key);
      v = raw === null || raw === "" ? null : Number(raw);
      if (v !== null && Number.isNaN(v)) v = null;
    } else {
      const raw = form.get(key);
      v = raw === null || String(raw).trim() === "" ? null : String(raw).trim();
    }
    if (item.required && v === null) errors.push(item.code);
    values[item.id] = v;
  }
  return { values, errors };
}
