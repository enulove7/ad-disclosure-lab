import type { Ad, Condition, Exposure, Participant, Response, SurveyItem } from "@/lib/types";

/**
 * 결과 탭용 집계. 순수 함수만 두어 테스트와 재사용이 쉽게 한다.
 * - 구성개념 점수 = 해당 구성개념 문항(리커트)의 평균
 * - 광고별 문항(post_ad)은 노출(exposure) 단위, 사전/최종 문항은 참가자 단위
 */

export interface GroupStat {
  key: string; // condition id
  n: number;
  mean: number;
  sd: number;
  ci95: number;
}

export interface ConstructResult {
  construct: string;
  phase: SurveyItem["phase"];
  items: SurveyItem[];
  /** facet = 광고 코드(광고별 분해) 또는 "all" */
  facets: Array<{ facet: string; groups: GroupStat[] }>;
  scaleMax: number;
}

export interface OptionDist {
  item: SurveyItem;
  /** condition id → option → count */
  counts: Record<string, Record<string, number>>;
  totals: Record<string, number>;
}

export interface ResultsSummary {
  participants: { byCondition: Record<string, { started: number; completed: number }> };
  attention: Record<string, { checked: number; passed: number }>;
  constructs: ConstructResult[];
  distributions: OptionDist[];
  exposureSeconds: Record<string, { n: number; mean: number }>;
}

function meanSd(xs: number[]): { mean: number; sd: number } {
  const n = xs.length;
  if (n === 0) return { mean: NaN, sd: NaN };
  const mean = xs.reduce((a, b) => a + b, 0) / n;
  const v = n > 1 ? xs.reduce((a, b) => a + (b - mean) ** 2, 0) / (n - 1) : 0;
  return { mean, sd: Math.sqrt(v) };
}

function groupStats(byGroup: Map<string, number[]>, order: string[]): GroupStat[] {
  return order.map((key) => {
    const xs = byGroup.get(key) ?? [];
    const { mean, sd } = meanSd(xs);
    return { key, n: xs.length, mean, sd, ci95: xs.length > 1 ? (1.96 * sd) / Math.sqrt(xs.length) : 0 };
  });
}

/** 주의 점검 정답: options[0] 이 있으면 그 값, 없으면 문항 텍스트의 「2」/"2"/'2' 안 숫자 */
export function attentionExpected(item: SurveyItem): string | null {
  if (item.options?.[0]) return String(item.options[0]);
  const m = item.text.match(/[「"'“]\s*(\d+)\s*[」"'”]/);
  return m ? m[1] : null;
}

export function summarize(input: {
  conditions: Condition[];
  ads: Ad[];
  items: SurveyItem[];
  participants: Participant[];
  exposures: Exposure[];
  responses: Response[];
  completedOnly: boolean;
  byAd: boolean;
}): ResultsSummary {
  const { conditions, ads, items, exposures, responses, completedOnly, byAd } = input;
  const participants = completedOnly ? input.participants.filter((p) => p.status === "completed") : input.participants;
  const pById = new Map(participants.map((p) => [p.id, p]));
  const condOrder = conditions.map((c) => c.id);
  const exposureById = new Map(exposures.map((x) => [x.id, x]));
  const adById = new Map(ads.map((a) => [a.id, a]));
  const itemById = new Map(items.map((i) => [i.id, i]));

  // 참가자 수
  const byCondition: Record<string, { started: number; completed: number }> = {};
  for (const c of conditions) byCondition[c.id] = { started: 0, completed: 0 };
  for (const p of input.participants) {
    const b = byCondition[p.condition_id];
    if (!b) continue;
    b.started++;
    if (p.status === "completed") b.completed++;
  }

  // 응답을 (참가자, 노출, 문항) 로 정리
  const rs = responses.filter((r) => pById.has(r.participant_id));

  // 주의 점검
  const attention: Record<string, { checked: number; passed: number }> = {};
  for (const c of conditions) attention[c.id] = { checked: 0, passed: 0 };
  for (const r of rs) {
    const it = itemById.get(r.item_id);
    if (!it || it.construct !== "attention_check") continue;
    const exp = attentionExpected(it);
    if (exp === null || r.value === null || r.value === undefined) continue;
    const p = pById.get(r.participant_id)!;
    const a = attention[p.condition_id];
    if (!a) continue;
    a.checked++;
    if (String(r.value) === exp) a.passed++;
  }

  // 구성개념별 점수
  const likertItems = items.filter((i) => i.type === "likert" && i.construct && i.construct !== "attention_check");
  // 단계(pre→post_ad→final) → 첫 문항 순서로 정렬
  const PHASE_RANK: Record<string, number> = { pre: 0, post_ad: 1, final: 2 };
  const sortedItems = [...likertItems].sort(
    (a, b) => (PHASE_RANK[a.phase] ?? 9) - (PHASE_RANK[b.phase] ?? 9) || a.sort_order - b.sort_order,
  );
  const constructKeys = Array.from(new Set(sortedItems.map((i) => `${i.phase}::${i.construct}`)));
  const constructs: ConstructResult[] = constructKeys.map((key) => {
    const [phase, construct] = key.split("::") as [SurveyItem["phase"], string];
    const cItems = likertItems.filter((i) => i.phase === phase && i.construct === construct);
    const cItemIds = new Set(cItems.map((i) => i.id));
    const scaleMax = Math.max(...cItems.map((i) => i.scale_points || 7));

    // unit = participant (pre/final) 또는 exposure (post_ad)
    const unitValues = new Map<string, { cond: string; facet: string; vals: number[] }>();
    for (const r of rs) {
      if (!cItemIds.has(r.item_id)) continue;
      const v = typeof r.value === "number" ? r.value : Number(r.value);
      if (!Number.isFinite(v)) continue;
      const p = pById.get(r.participant_id)!;
      let facet = "all";
      let unit = r.participant_id;
      if (phase === "post_ad") {
        if (!r.exposure_id) continue;
        unit = r.exposure_id;
        if (byAd) {
          const x = exposureById.get(r.exposure_id);
          facet = x ? (adById.get(x.ad_id)?.code ?? "?") : "?";
        }
      }
      const k = `${unit}::${facet}`;
      const u = unitValues.get(k) ?? { cond: p.condition_id, facet, vals: [] };
      u.vals.push(v);
      unitValues.set(k, u);
    }
    const facetNames = byAd && phase === "post_ad" ? ads.map((a) => a.code) : ["all"];
    const facets = facetNames.map((facet) => {
      const byGroup = new Map<string, number[]>();
      for (const u of unitValues.values()) {
        if (u.facet !== facet) continue;
        const score = u.vals.reduce((a, b) => a + b, 0) / u.vals.length;
        byGroup.set(u.cond, [...(byGroup.get(u.cond) ?? []), score]);
      }
      return { facet, groups: groupStats(byGroup, condOrder) };
    });
    return { construct, phase, items: cItems, facets, scaleMax };
  });

  // 선택형 문항 분포 (조작 점검 등)
  const distributions: OptionDist[] = items
    .filter((i) => (i.type === "single" || i.type === "multi") && i.phase !== "pre")
    .map((item) => {
      const counts: Record<string, Record<string, number>> = {};
      const totals: Record<string, number> = {};
      for (const c of conditions) {
        counts[c.id] = {};
        totals[c.id] = 0;
      }
      for (const r of rs) {
        if (r.item_id !== item.id) continue;
        const p = pById.get(r.participant_id)!;
        if (!counts[p.condition_id]) continue;
        const vals = Array.isArray(r.value) ? r.value.map(String) : r.value == null ? [] : [String(r.value)];
        for (const v of vals) counts[p.condition_id][v] = (counts[p.condition_id][v] ?? 0) + 1;
        totals[p.condition_id]++;
      }
      return { item, counts, totals };
    });

  // 노출 시간
  const exposureSeconds: Record<string, { n: number; mean: number }> = {};
  for (const c of conditions) {
    const secs = exposures
      .filter((x) => x.condition_id === c.id && x.duration_ms !== null && pById.has(x.participant_id))
      .map((x) => (x.duration_ms ?? 0) / 1000);
    exposureSeconds[c.id] = { n: secs.length, mean: meanSd(secs).mean };
  }

  return { participants: { byCondition }, attention, constructs, distributions, exposureSeconds };
}
