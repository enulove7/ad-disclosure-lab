"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getStore } from "@/lib/db";
import { ADMIN_COOKIE, adminSessionValue, checkPassword, requireAdmin } from "@/lib/auth";
import { getPresets } from "@/lib/presets";
import { asLocale, LOCALES, type Locale } from "@/lib/i18n";
import { ADMIN_LOCALE_COOKIE, adminDict } from "@/lib/i18n-server";
import {
  DEFAULT_LABEL,
  DEFAULT_SETTINGS,
  type ExperimentStatus,
  type ItemType,
  type LabelConfig,
  type LabelPosition,
  type LabelSize,
  type LabelStyle,
  type SurveyPhase,
} from "@/lib/types";

export interface FormState {
  error?: string;
  ok?: boolean;
}

const str = (f: FormData, k: string, d = "") => {
  const v = f.get(k);
  return v === null ? d : String(v);
};
const num = (f: FormData, k: string, d = 0) => {
  const v = Number(f.get(k));
  return Number.isFinite(v) ? v : d;
};
const bool = (f: FormData, k: string) => f.get(k) === "on" || f.get(k) === "true";

// ---------- 로그인 ----------
export async function loginAction(_prev: FormState, form: FormData): Promise<FormState> {
  const { d } = await adminDict();
  const pw = str(form, "password");
  if (!checkPassword(pw)) return { error: d.wrongPassword };
  const jar = await cookies();
  jar.set(ADMIN_COOKIE, adminSessionValue(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  const next = str(form, "next", "/admin");
  redirect(next.startsWith("/admin") ? next : "/admin");
}

export async function logoutAction() {
  const jar = await cookies();
  jar.delete(ADMIN_COOKIE);
  redirect("/admin/login");
}

/** 관리자 화면 언어 토글 (쿠키) */
export async function setAdminLocaleAction(form: FormData) {
  const locale: Locale = asLocale(str(form, "locale"));
  if (!LOCALES.includes(locale)) return;
  const jar = await cookies();
  jar.set(ADMIN_LOCALE_COOKIE, locale, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
  const back = str(form, "back", "/admin");
  redirect(back.startsWith("/") ? back : "/admin");
}

// ---------- 실험 ----------
function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

export async function createExperimentAction(_prev: FormState, form: FormData): Promise<FormState> {
  await requireAdmin();
  const { d } = await adminDict();
  const store = getStore();
  const title = str(form, "title").trim();
  if (!title) return { error: d.titleRequired };
  let slug = slugify(str(form, "slug") || title);
  if (!slug) slug = `exp-${Date.now().toString(36)}`;
  if (await store.getExperimentBySlug(slug)) return { error: d.slugTaken };

  const locale = asLocale(str(form, "locale"));
  const presets = getPresets(locale);
  const withPresets = bool(form, "with_presets");
  const exp = await store.createExperiment({
    slug,
    title,
    description: str(form, "description"),
    status: "draft",
    consent_text: presets.consent,
    debrief_text: presets.debrief,
    settings: { ...DEFAULT_SETTINGS, locale },
  });

  if (withPresets) {
    for (const c of presets.conditions) await store.createCondition({ ...c, experiment_id: exp.id });
    for (const a of presets.ads) await store.createAd({ ...a, experiment_id: exp.id });
    for (const i of presets.items) await store.createItem({ ...i, experiment_id: exp.id });
  }
  revalidatePath("/admin");
  redirect(`/admin/${exp.id}`);
}

export async function updateExperimentAction(id: string, _prev: FormState, form: FormData): Promise<FormState> {
  await requireAdmin();
  const store = getStore();
  const status = str(form, "status", "draft") as ExperimentStatus;
  const settings = {
    min_exposure_seconds: Math.max(0, num(form, "min_exposure_seconds", 15)),
    ads_per_participant: Math.max(0, num(form, "ads_per_participant", 0)),
    randomize_ad_order: bool(form, "randomize_ad_order"),
    assignment: (str(form, "assignment", "balanced") === "weighted" ? "weighted" : "balanced") as
      | "balanced"
      | "weighted",
    locale: asLocale(str(form, "locale")),
  };
  await store.updateExperiment(id, {
    title: str(form, "title").trim() || "Untitled",
    description: str(form, "description"),
    status: ["draft", "active", "closed"].includes(status) ? status : "draft",
    consent_text: str(form, "consent_text"),
    debrief_text: str(form, "debrief_text"),
    settings,
  });
  revalidatePath(`/admin/${id}`);
  return { ok: true };
}

export async function deleteExperimentAction(id: string) {
  await requireAdmin();
  await getStore().deleteExperiment(id);
  revalidatePath("/admin");
  redirect("/admin");
}

// ---------- 조건 ----------
function parseLabel(form: FormData): LabelConfig {
  return {
    enabled: bool(form, "enabled"),
    text: str(form, "text"),
    description: str(form, "description"),
    position: (str(form, "position", DEFAULT_LABEL.position) as LabelPosition) || DEFAULT_LABEL.position,
    size: (str(form, "size", "sm") as LabelSize) || "sm",
    style: (str(form, "style", "subtle") as LabelStyle) || "subtle",
    show_icon: bool(form, "show_icon"),
  };
}

export async function saveConditionAction(experimentId: string, _prev: FormState, form: FormData): Promise<FormState> {
  await requireAdmin();
  const store = getStore();
  const id = str(form, "id");
  const data = {
    experiment_id: experimentId,
    code: str(form, "code").trim() || "C?",
    name: str(form, "name").trim() || "C?",
    weight: Math.max(0, num(form, "weight", 1)),
    sort_order: num(form, "sort_order", 0),
    label_config: parseLabel(form),
  };
  if (id) await store.updateCondition(id, data);
  else await store.createCondition(data);
  revalidatePath(`/admin/${experimentId}/conditions`);
  return { ok: true };
}

export async function deleteConditionAction(experimentId: string, id: string) {
  await requireAdmin();
  await getStore().deleteCondition(id);
  revalidatePath(`/admin/${experimentId}/conditions`);
}

// ---------- 광고 ----------
export async function saveAdAction(experimentId: string, _prev: FormState, form: FormData): Promise<FormState> {
  await requireAdmin();
  const store = getStore();
  const id = str(form, "id");
  let image_url = str(form, "image_url").trim();
  const file = form.get("image_file");
  if (file instanceof File && file.size > 0) {
    if (file.size > 8 * 1024 * 1024) return { error: (await adminDict()).d.imageTooLarge };
    image_url = await store.uploadImage(file, file.name);
  }
  const data = {
    experiment_id: experimentId,
    code: str(form, "code").trim() || `AD${Date.now().toString(36)}`,
    name: str(form, "name").trim() || "AD",
    brand_name: str(form, "brand_name"),
    product_category: str(form, "product_category"),
    headline: str(form, "headline"),
    body_text: str(form, "body_text"),
    cta_text: str(form, "cta_text"),
    image_url,
    sort_order: num(form, "sort_order", 0),
  };
  if (id) await store.updateAd(id, data);
  else await store.createAd(data);
  revalidatePath(`/admin/${experimentId}/ads`);
  return { ok: true };
}

export async function deleteAdAction(experimentId: string, id: string) {
  await requireAdmin();
  await getStore().deleteAd(id);
  revalidatePath(`/admin/${experimentId}/ads`);
}

// ---------- 설문 문항 ----------
const PHASES: SurveyPhase[] = ["pre", "post_ad", "final"];
const TYPES: ItemType[] = ["likert", "single", "multi", "number", "text"];

export async function saveItemAction(experimentId: string, _prev: FormState, form: FormData): Promise<FormState> {
  await requireAdmin();
  const store = getStore();
  const id = str(form, "id");
  const phase = str(form, "phase", "post_ad") as SurveyPhase;
  const type = str(form, "type", "likert") as ItemType;
  const left = str(form, "scale_left").trim();
  const right = str(form, "scale_right").trim();
  const data = {
    experiment_id: experimentId,
    phase: PHASES.includes(phase) ? phase : "post_ad",
    code: str(form, "code").trim() || `q${Date.now().toString(36)}`,
    construct: str(form, "construct").trim(),
    text: str(form, "text").trim(),
    type: TYPES.includes(type) ? type : "likert",
    scale_points: Math.max(2, num(form, "scale_points", 7)),
    scale_labels: left || right ? [left, right] : [],
    options: str(form, "options")
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean),
    required: bool(form, "required"),
    sort_order: num(form, "sort_order", 0),
  };
  if (!data.text) return { error: (await adminDict()).d.questionRequired };
  if (id) await store.updateItem(id, data);
  else await store.createItem(data);
  revalidatePath(`/admin/${experimentId}/survey`);
  return { ok: true };
}

export async function deleteItemAction(experimentId: string, id: string) {
  await requireAdmin();
  await getStore().deleteItem(id);
  revalidatePath(`/admin/${experimentId}/survey`);
}
