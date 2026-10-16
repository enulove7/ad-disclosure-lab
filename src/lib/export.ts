import type { Ad, Condition, Exposure, Participant, Response, SurveyItem } from "@/lib/types";

export interface ExportData {
  conditions: Condition[];
  ads: Ad[];
  items: SurveyItem[];
  participants: Participant[];
  exposures: Exposure[];
  responses: Response[];
}

function cell(v: unknown): string {
  if (v === null || v === undefined) return "";
  const s = Array.isArray(v) ? v.join("|") : typeof v === "object" ? JSON.stringify(v) : String(v);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function rowsToCsv(header: string[], rows: unknown[][]): string {
  return [header, ...rows].map((r) => r.map(cell).join(",")).join("\r\n");
}

/** long: 응답 1건 = 1행. R/Python에서 pivot 하기 좋은 형태 */
export function buildLongCsv(d: ExportData): string {
  const cond = new Map(d.conditions.map((c) => [c.id, c]));
  const ad = new Map(d.ads.map((a) => [a.id, a]));
  const item = new Map(d.items.map((i) => [i.id, i]));
  const part = new Map(d.participants.map((p) => [p.id, p]));
  const expo = new Map(d.exposures.map((x) => [x.id, x]));
  const pIndex = new Map(d.participants.map((p, i) => [p.id, i + 1]));

  const header = [
    "participant_no",
    "participant_id",
    "condition_code",
    "condition_name",
    "status",
    "started_at",
    "completed_at",
    "phase",
    "exposure_order",
    "ad_code",
    "product_category",
    "label_enabled",
    "label_text",
    "label_position",
    "label_size",
    "label_style",
    "duration_ms",
    "item_code",
    "construct",
    "item_type",
    "value",
    "answered_at",
  ];
  const rows = d.responses.map((r) => {
    const p = part.get(r.participant_id);
    const c = p ? cond.get(p.condition_id) : undefined;
    const x = r.exposure_id ? expo.get(r.exposure_id) : undefined;
    const a = x ? ad.get(x.ad_id) : undefined;
    const it = item.get(r.item_id);
    const l = x?.label_snapshot;
    return [
      pIndex.get(r.participant_id),
      r.participant_id,
      c?.code,
      c?.name,
      p?.status,
      p?.started_at,
      p?.completed_at,
      r.phase,
      x ? x.sort_order + 1 : "",
      a?.code,
      a?.product_category,
      l ? (l.enabled ? 1 : 0) : "",
      l?.text,
      l?.position,
      l?.size,
      l?.style,
      x?.duration_ms,
      it?.code,
      it?.construct,
      it?.type,
      r.value,
      r.answered_at,
    ];
  });
  // 참가자 → 단계(pre→post_ad→final) → 노출 순서 → 문항 순서
  const PHASE_RANK: Record<string, number> = { pre: 0, post_ad: 1, final: 2 };
  const itemRank = new Map(d.items.map((i) => [i.code, i.sort_order]));
  rows.sort(
    (a, b) =>
      Number(a[0]) - Number(b[0]) ||
      (PHASE_RANK[String(a[7])] ?? 9) - (PHASE_RANK[String(b[7])] ?? 9) ||
      Number(a[8] || 0) - Number(b[8] || 0) ||
      (itemRank.get(String(a[17])) ?? 0) - (itemRank.get(String(b[17])) ?? 0),
  );
  return rowsToCsv(header, rows);
}

/** wide: 참가자 1명 = 1행. 광고별 문항은 `{ad_code}__{item_code}` 열로 펼친다 */
export function buildWideCsv(d: ExportData): string {
  const cond = new Map(d.conditions.map((c) => [c.id, c]));
  const sorted = [...d.items].sort((a, b) => a.sort_order - b.sort_order);
  const preItems = sorted.filter((i) => i.phase === "pre");
  const postItems = sorted.filter((i) => i.phase === "post_ad");
  const finalItems = sorted.filter((i) => i.phase === "final");
  const ads = [...d.ads].sort((a, b) => a.sort_order - b.sort_order);

  const header: string[] = [
    "participant_no",
    "participant_id",
    "condition_code",
    "status",
    "started_at",
    "completed_at",
  ];
  for (const i of preItems) header.push(i.code);
  for (const a of ads) {
    header.push(`${a.code}__order`, `${a.code}__duration_ms`);
    for (const i of postItems) header.push(`${a.code}__${i.code}`);
  }
  for (const i of finalItems) header.push(i.code);

  const byParticipant = new Map<string, Response[]>();
  for (const r of d.responses) {
    const arr = byParticipant.get(r.participant_id) ?? [];
    arr.push(r);
    byParticipant.set(r.participant_id, arr);
  }
  const expoByParticipant = new Map<string, Exposure[]>();
  for (const x of d.exposures) {
    const arr = expoByParticipant.get(x.participant_id) ?? [];
    arr.push(x);
    expoByParticipant.set(x.participant_id, arr);
  }

  const rows = d.participants.map((p, idx) => {
    const rs = byParticipant.get(p.id) ?? [];
    const xs = expoByParticipant.get(p.id) ?? [];
    const row: unknown[] = [idx + 1, p.id, cond.get(p.condition_id)?.code, p.status, p.started_at, p.completed_at];
    const find = (itemId: string, exposureId: string | null) =>
      rs.find((r) => r.item_id === itemId && (r.exposure_id ?? null) === exposureId)?.value;

    for (const i of preItems) row.push(find(i.id, null));
    for (const a of ads) {
      const x = xs.find((e) => e.ad_id === a.id);
      row.push(x ? x.sort_order + 1 : "", x?.duration_ms ?? "");
      for (const i of postItems) row.push(x ? find(i.id, x.id) : "");
    }
    for (const i of finalItems) row.push(find(i.id, null));
    return row;
  });
  return rowsToCsv(header, rows);
}
