import { promises as fs } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import type { Store } from "./store";
import type {
  Ad,
  AdImage,
  Condition,
  Experiment,
  Exposure,
  Participant,
  Response,
  SurveyItem,
} from "@/lib/types";

/**
 * 로컬 개발용 JSON 파일 저장소. Supabase 설정 없이 `npm run dev`만으로 전체 흐름을 돌려볼 수 있다.
 * 데이터는 data/db.json 하나에 저장되며, 쓰기는 직렬화되어 경쟁 상태를 피한다.
 */
interface DbShape {
  experiments: Experiment[];
  conditions: Condition[];
  ads: Ad[];
  ad_images: AdImage[];
  survey_items: SurveyItem[];
  participants: Participant[];
  exposures: Exposure[];
  responses: Response[];
}

const EMPTY: DbShape = {
  experiments: [],
  conditions: [],
  ads: [],
  ad_images: [],
  survey_items: [],
  participants: [],
  exposures: [],
  responses: [],
};

const DB_PATH = path.join(process.cwd(), "data", "db.json");
const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");

let queue: Promise<unknown> = Promise.resolve();
function serialize<T>(fn: () => Promise<T>): Promise<T> {
  const next = queue.then(fn, fn);
  queue = next.catch(() => undefined);
  return next;
}

async function readDb(): Promise<DbShape> {
  try {
    const raw = await fs.readFile(DB_PATH, "utf8");
    return { ...EMPTY, ...(JSON.parse(raw) as Partial<DbShape>) };
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return structuredClone(EMPTY);
    throw err;
  }
}

async function writeDb(db: DbShape): Promise<void> {
  await fs.mkdir(path.dirname(DB_PATH), { recursive: true });
  const tmp = DB_PATH + ".tmp";
  await fs.writeFile(tmp, JSON.stringify(db, null, 2), "utf8");
  await fs.rename(tmp, DB_PATH);
}

function mutate<T>(fn: (db: DbShape) => T): Promise<T> {
  return serialize(async () => {
    const db = await readDb();
    const result = fn(db);
    await writeDb(db);
    return result;
  });
}

function sortBy<T extends { sort_order: number }>(rows: T[]): T[] {
  return [...rows].sort((a, b) => a.sort_order - b.sort_order);
}

function patchRow<T extends { id: string }>(rows: T[], id: string, patch: Partial<T>): T {
  const idx = rows.findIndex((r) => r.id === id);
  if (idx < 0) throw new Error(`row not found: ${id}`);
  rows[idx] = { ...rows[idx], ...patch, id };
  return rows[idx];
}

export const localStore: Store = {
  async listExperiments() {
    const db = await readDb();
    return [...db.experiments].sort((a, b) => b.created_at.localeCompare(a.created_at));
  },
  async getExperiment(id) {
    const db = await readDb();
    return db.experiments.find((e) => e.id === id) ?? null;
  },
  async getExperimentBySlug(slug) {
    const db = await readDb();
    return db.experiments.find((e) => e.slug === slug) ?? null;
  },
  createExperiment(data) {
    return mutate((db) => {
      if (db.experiments.some((e) => e.slug === data.slug)) {
        throw new Error("slug already exists");
      }
      const row: Experiment = { ...data, id: randomUUID(), created_at: new Date().toISOString() };
      db.experiments.push(row);
      return row;
    });
  },
  updateExperiment(id, patch) {
    return mutate((db) => patchRow(db.experiments, id, patch));
  },
  deleteExperiment(id) {
    return mutate((db) => {
      const pids = new Set(db.participants.filter((p) => p.experiment_id === id).map((p) => p.id));
      db.responses = db.responses.filter((r) => !pids.has(r.participant_id));
      db.exposures = db.exposures.filter((x) => !pids.has(x.participant_id));
      db.participants = db.participants.filter((p) => p.experiment_id !== id);
      db.survey_items = db.survey_items.filter((i) => i.experiment_id !== id);
      db.ad_images = db.ad_images.filter((x) => x.experiment_id !== id);
      db.ads = db.ads.filter((a) => a.experiment_id !== id);
      db.conditions = db.conditions.filter((c) => c.experiment_id !== id);
      db.experiments = db.experiments.filter((e) => e.id !== id);
    });
  },

  async listConditions(experimentId) {
    const db = await readDb();
    return sortBy(db.conditions.filter((c) => c.experiment_id === experimentId));
  },
  createCondition(data) {
    return mutate((db) => {
      const row: Condition = { ...data, id: randomUUID() };
      db.conditions.push(row);
      return row;
    });
  },
  updateCondition(id, patch) {
    return mutate((db) => patchRow(db.conditions, id, patch));
  },
  deleteCondition(id) {
    return mutate((db) => {
      db.conditions = db.conditions.filter((c) => c.id !== id);
    });
  },

  async listAds(experimentId) {
    const db = await readDb();
    return sortBy(db.ads.filter((a) => a.experiment_id === experimentId));
  },
  createAd(data) {
    return mutate((db) => {
      const row: Ad = { ...data, id: randomUUID() };
      db.ads.push(row);
      return row;
    });
  },
  updateAd(id, patch) {
    return mutate((db) => patchRow(db.ads, id, patch));
  },
  deleteAd(id) {
    return mutate((db) => {
      db.ads = db.ads.filter((a) => a.id !== id);
      db.ad_images = db.ad_images.filter((x) => x.ad_id !== id);
    });
  },

  async listAdImages(experimentId) {
    const db = await readDb();
    return db.ad_images
      .filter((x) => x.experiment_id === experimentId)
      .sort((a, b) => b.created_at.localeCompare(a.created_at));
  },
  createAdImage(data) {
    return mutate((db) => {
      const row: AdImage = { ...data, id: randomUUID(), created_at: new Date().toISOString() };
      db.ad_images.push(row);
      return row;
    });
  },
  deleteAdImage(id) {
    return mutate((db) => {
      db.ad_images = db.ad_images.filter((x) => x.id !== id);
    });
  },

  async listItems(experimentId) {
    const db = await readDb();
    return sortBy(db.survey_items.filter((i) => i.experiment_id === experimentId));
  },
  createItem(data) {
    return mutate((db) => {
      const row: SurveyItem = { ...data, id: randomUUID() };
      db.survey_items.push(row);
      return row;
    });
  },
  updateItem(id, patch) {
    return mutate((db) => patchRow(db.survey_items, id, patch));
  },
  deleteItem(id) {
    return mutate((db) => {
      db.survey_items = db.survey_items.filter((i) => i.id !== id);
    });
  },

  async listParticipants(experimentId) {
    const db = await readDb();
    return db.participants
      .filter((p) => p.experiment_id === experimentId)
      .sort((a, b) => a.started_at.localeCompare(b.started_at));
  },
  async getParticipantByToken(token) {
    const db = await readDb();
    return db.participants.find((p) => p.token === token) ?? null;
  },
  createParticipant(data) {
    return mutate((db) => {
      const row: Participant = { ...data, id: randomUUID() };
      db.participants.push(row);
      return row;
    });
  },
  updateParticipant(id, patch) {
    return mutate((db) => patchRow(db.participants, id, patch));
  },
  async countParticipantsByCondition(experimentId) {
    const db = await readDb();
    const counts: Record<string, number> = {};
    for (const p of db.participants) {
      if (p.experiment_id !== experimentId) continue;
      counts[p.condition_id] = (counts[p.condition_id] ?? 0) + 1;
    }
    return counts;
  },

  createExposures(data) {
    return mutate((db) => {
      const rows = data.map((d) => ({ ...d, id: randomUUID() }));
      db.exposures.push(...rows);
      return rows;
    });
  },
  async listExposures(participantId) {
    const db = await readDb();
    return sortBy(db.exposures.filter((x) => x.participant_id === participantId));
  },
  async listExposuresByExperiment(experimentId) {
    const db = await readDb();
    const pids = new Set(
      db.participants.filter((p) => p.experiment_id === experimentId).map((p) => p.id),
    );
    return db.exposures.filter((x) => pids.has(x.participant_id));
  },
  updateExposure(id, patch) {
    return mutate((db) => patchRow(db.exposures, id, patch));
  },

  createResponses(data) {
    return mutate((db) => {
      const rows = data.map((d) => ({ ...d, id: randomUUID() }));
      db.responses.push(...rows);
      return rows;
    });
  },
  async listResponses(participantId) {
    const db = await readDb();
    return db.responses.filter((r) => r.participant_id === participantId);
  },
  async listResponsesByExperiment(experimentId) {
    const db = await readDb();
    const pids = new Set(
      db.participants.filter((p) => p.experiment_id === experimentId).map((p) => p.id),
    );
    return db.responses.filter((r) => pids.has(r.participant_id));
  },

  async uploadImage(file, filename) {
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
    const safe = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
    const name = `${Date.now()}-${safe}`;
    const buf = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(path.join(UPLOAD_DIR, name), buf);
    return `/uploads/${name}`;
  },
};
