import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Store } from "./store";
import type {
  Ad,
  Condition,
  Experiment,
  Exposure,
  Participant,
  Response,
  SurveyItem,
} from "@/lib/types";

/**
 * Supabase 저장소. service role 키로 서버에서만 접근한다(클라이언트에 절대 노출 금지).
 * 테이블·컬럼명은 src/lib/types.ts 의 필드명과 1:1로 대응한다.
 */
export function createSupabaseStore(url: string, serviceKey: string): Store {
  const sb: SupabaseClient = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  function unwrap<T>(res: { data: T | null; error: { message: string } | null }): T {
    if (res.error) throw new Error(res.error.message);
    if (res.data === null) throw new Error("no data returned");
    return res.data;
  }

  async function list<T>(table: string, filter: Record<string, string>, order = "sort_order") {
    let q = sb.from(table).select("*");
    for (const [k, v] of Object.entries(filter)) q = q.eq(k, v);
    return unwrap<T[]>(await q.order(order, { ascending: true }));
  }
  async function insertOne<T>(table: string, data: object) {
    return unwrap<T>(await sb.from(table).insert(data).select().single());
  }
  async function insertMany<T>(table: string, data: object[]) {
    if (data.length === 0) return [] as T[];
    return unwrap<T[]>(await sb.from(table).insert(data).select());
  }
  async function updateOne<T>(table: string, id: string, patch: object) {
    return unwrap<T>(await sb.from(table).update(patch).eq("id", id).select().single());
  }
  async function remove(table: string, id: string) {
    const { error } = await sb.from(table).delete().eq("id", id);
    if (error) throw new Error(error.message);
  }
  async function participantIds(experimentId: string): Promise<string[]> {
    const rows = unwrap<{ id: string }[]>(
      await sb.from("participants").select("id").eq("experiment_id", experimentId),
    );
    return rows.map((r) => r.id);
  }

  return {
    async listExperiments() {
      return unwrap<Experiment[]>(
        await sb.from("experiments").select("*").order("created_at", { ascending: false }),
      );
    },
    async getExperiment(id) {
      const { data, error } = await sb.from("experiments").select("*").eq("id", id).maybeSingle();
      if (error) throw new Error(error.message);
      return (data as Experiment | null) ?? null;
    },
    async getExperimentBySlug(slug) {
      const { data, error } = await sb.from("experiments").select("*").eq("slug", slug).maybeSingle();
      if (error) throw new Error(error.message);
      return (data as Experiment | null) ?? null;
    },
    createExperiment: (d) => insertOne<Experiment>("experiments", d),
    updateExperiment: (id, p) => updateOne<Experiment>("experiments", id, p),
    deleteExperiment: (id) => remove("experiments", id),

    listConditions: (eid) => list<Condition>("conditions", { experiment_id: eid }),
    createCondition: (d) => insertOne<Condition>("conditions", d),
    updateCondition: (id, p) => updateOne<Condition>("conditions", id, p),
    deleteCondition: (id) => remove("conditions", id),

    listAds: (eid) => list<Ad>("ads", { experiment_id: eid }),
    createAd: (d) => insertOne<Ad>("ads", d),
    updateAd: (id, p) => updateOne<Ad>("ads", id, p),
    deleteAd: (id) => remove("ads", id),

    listItems: (eid) => list<SurveyItem>("survey_items", { experiment_id: eid }),
    createItem: (d) => insertOne<SurveyItem>("survey_items", d),
    updateItem: (id, p) => updateOne<SurveyItem>("survey_items", id, p),
    deleteItem: (id) => remove("survey_items", id),

    listParticipants: (eid) => list<Participant>("participants", { experiment_id: eid }, "started_at"),
    async getParticipantByToken(token) {
      const { data, error } = await sb.from("participants").select("*").eq("token", token).maybeSingle();
      if (error) throw new Error(error.message);
      return (data as Participant | null) ?? null;
    },
    createParticipant: (d) => insertOne<Participant>("participants", d),
    updateParticipant: (id, p) => updateOne<Participant>("participants", id, p),
    async countParticipantsByCondition(eid) {
      const rows = unwrap<{ condition_id: string }[]>(
        await sb.from("participants").select("condition_id").eq("experiment_id", eid),
      );
      const counts: Record<string, number> = {};
      for (const r of rows) counts[r.condition_id] = (counts[r.condition_id] ?? 0) + 1;
      return counts;
    },

    createExposures: (d) => insertMany<Exposure>("exposures", d),
    listExposures: (pid) => list<Exposure>("exposures", { participant_id: pid }),
    async listExposuresByExperiment(eid) {
      const ids = await participantIds(eid);
      if (ids.length === 0) return [];
      return unwrap<Exposure[]>(await sb.from("exposures").select("*").in("participant_id", ids));
    },
    updateExposure: (id, p) => updateOne<Exposure>("exposures", id, p),

    createResponses: (d) => insertMany<Response>("responses", d),
    async listResponses(pid) {
      return unwrap<Response[]>(await sb.from("responses").select("*").eq("participant_id", pid));
    },
    async listResponsesByExperiment(eid) {
      const ids = await participantIds(eid);
      if (ids.length === 0) return [];
      return unwrap<Response[]>(await sb.from("responses").select("*").in("participant_id", ids));
    },

    async uploadImage(file, filename) {
      const safe = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
      const key = `${Date.now()}-${safe}`;
      const { error } = await sb.storage
        .from("ad-images")
        .upload(key, file, { contentType: file.type, upsert: false });
      if (error) throw new Error(error.message);
      return sb.storage.from("ad-images").getPublicUrl(key).data.publicUrl;
    },
  };
}
