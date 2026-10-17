"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getStore } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { asLocale } from "@/lib/i18n";
import { adminDict } from "@/lib/i18n-server";
import { defaultImageModel, generateImage, IMAGE_MODELS } from "@/lib/imagegen";
import { DEFAULT_GAME_SETTINGS, type ExperimentStatus } from "@/lib/types";
import type { FormState } from "./actions";

const str = (f: FormData, k: string, d = "") => {
  const v = f.get(k);
  return v === null ? d : String(v);
};
const num = (f: FormData, k: string, d = 0) => {
  const v = Number(f.get(k));
  return Number.isFinite(v) ? v : d;
};
const bool = (f: FormData, k: string) => f.get(k) === "on" || f.get(k) === "true";

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40);
}

const INTRO: Record<"ja" | "ko" | "en", string> = {
  en: "Was this ad image made by AI, or by a person?\nLook at 10 ads and guess. At the end you'll see your detection rate. Takes about 2 minutes. Answers are anonymous and used for research.",
  ja: "この広告の画像、AIが作った？それとも人が作った？\n10枚の広告を見て当ててみよう。最後にあなたの「見破り率」が出ます。所要時間は約2分。回答は匿名で研究に使われます。",
  ko: "이 광고 이미지, AI가 만들었을까? 사람이 만들었을까?\n광고 10장을 보고 맞혀 보세요. 마지막에 당신의 「판별률」이 나옵니다. 약 2분 소요. 응답은 익명으로 연구에 사용됩니다.",
};

export async function createGameAction(_prev: FormState, form: FormData): Promise<FormState> {
  await requireAdmin();
  const { d } = await adminDict();
  const store = getStore();
  const title = str(form, "title").trim();
  if (!title) return { error: d.titleRequired };
  let slug = slugify(str(form, "slug") || title);
  if (!slug) slug = `game-${Date.now().toString(36)}`;
  if (await store.getGameBySlug(slug)) return { error: d.slugTaken };
  const locale = asLocale(str(form, "locale"));
  const game = await store.createGame({
    slug,
    title,
    intro_text: INTRO[locale],
    status: "draft",
    settings: { ...DEFAULT_GAME_SETTINGS, locale },
  });
  revalidatePath("/admin/games");
  redirect(`/admin/games/${game.id}`);
}

export async function updateGameAction(id: string, _prev: FormState, form: FormData): Promise<FormState> {
  await requireAdmin();
  const status = str(form, "status", "draft") as ExperimentStatus;
  await getStore().updateGame(id, {
    title: str(form, "title").trim() || "Untitled",
    intro_text: str(form, "intro_text"),
    status: ["draft", "active", "closed"].includes(status) ? status : "draft",
    settings: {
      cards_per_round: Math.max(0, num(form, "cards_per_round", 10)),
      link_experiment_slug: str(form, "link_experiment_slug").trim(),
      locale: asLocale(str(form, "locale")),
      ask_liking: bool(form, "ask_liking"),
    },
  });
  revalidatePath(`/admin/games/${id}`);
  return { ok: true };
}

export async function deleteGameAction(id: string) {
  await requireAdmin();
  await getStore().deleteGame(id);
  revalidatePath("/admin/games");
  redirect("/admin/games");
}

export async function saveCardAction(gameId: string, _prev: FormState, form: FormData): Promise<FormState> {
  await requireAdmin();
  const { d } = await adminDict();
  const store = getStore();
  const id = str(form, "id");
  let image_url = str(form, "image_url").trim();
  const file = form.get("image_file");
  if (file instanceof File && file.size > 0) {
    if (file.size > 8 * 1024 * 1024) return { error: d.imageTooLarge };
    image_url = await store.uploadImage(file, file.name);
  }
  const data = {
    game_id: gameId,
    brand_name: str(form, "brand_name"),
    headline: str(form, "headline"),
    body_text: str(form, "body_text"),
    image_url,
    is_ai: str(form, "is_ai") === "true",
    source_note: str(form, "source_note"),
    sort_order: num(form, "sort_order", 0),
  };
  if (id) {
    const prev = (await store.listGameCards(gameId)).find((c) => c.id === id);
    const changed = prev && prev.image_url !== image_url;
    await store.updateGameCard(id, changed ? { ...data, gen_prompt: "", gen_model: "" } : data);
  } else {
    await store.createGameCard({ ...data, gen_prompt: "", gen_model: "" });
  }
  revalidatePath(`/admin/games/${gameId}`);
  return { ok: true };
}

export async function deleteCardAction(gameId: string, id: string) {
  await requireAdmin();
  await getStore().deleteGameCard(id);
  revalidatePath(`/admin/games/${gameId}`);
}

/** 카드 이미지를 AI 로 생성해 바로 설정 (is_ai 도 true 로) */
export async function generateCardImageAction(gameId: string, cardId: string, _prev: FormState, form: FormData): Promise<FormState> {
  await requireAdmin();
  const { d } = await adminDict();
  const store = getStore();
  const prompt = str(form, "prompt").trim();
  if (!prompt) return { error: d.promptRequired };
  const requested = str(form, "model", defaultImageModel());
  const model = IMAGE_MODELS.some((m) => m.id === requested) ? requested : defaultImageModel();
  try {
    const img = await generateImage(prompt, model);
    const ext = img.mime.includes("jpeg") ? "jpg" : "png";
    const file = new File([new Uint8Array(img.bytes)], `card-${Date.now()}.${ext}`, { type: img.mime });
    const url = await store.uploadImage(file, file.name);
    await store.updateGameCard(cardId, { image_url: url, is_ai: true, gen_prompt: prompt, gen_model: img.model });
  } catch (e) {
    return { error: e instanceof Error ? e.message : String(e) };
  }
  revalidatePath(`/admin/games/${gameId}`);
  return { ok: true };
}
