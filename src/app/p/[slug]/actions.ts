"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getStore } from "@/lib/db";
import { getCurrentParticipant, nextStepPath, parseAnswers, startParticipant } from "@/lib/participant";

export interface ActionState {
  error?: string;
  missing?: string[];
}

async function loadExperiment(slug: string) {
  const exp = await getStore().getExperimentBySlug(slug);
  if (!exp) throw new Error("experiment not found");
  return exp;
}

export async function consentAction(slug: string): Promise<ActionState> {
  const exp = await loadExperiment(slug);
  if (exp.status !== "active") return { error: "この調査は現在受け付けていません。" };
  const existing = await getCurrentParticipant(exp);
  if (existing) {
    const exposures = await getStore().listExposures(existing.id);
    redirect(nextStepPath(slug, existing, exposures));
  }
  const ua = (await headers()).get("user-agent") ?? "";
  try {
    await startParticipant(exp, ua);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "開始できませんでした。" };
  }
  redirect(`/p/${slug}/pre`);
}

export async function submitPreAction(
  slug: string,
  _prev: ActionState,
  form: FormData,
): Promise<ActionState> {
  const store = getStore();
  const exp = await loadExperiment(slug);
  const p = await getCurrentParticipant(exp);
  if (!p) redirect(`/p/${slug}`);
  if (p.status !== "started") {
    redirect(nextStepPath(slug, p, await store.listExposures(p.id)));
  }
  const items = (await store.listItems(exp.id)).filter((i) => i.phase === "pre");
  const { values, errors } = parseAnswers(items, form);
  if (errors.length) return { error: "未回答の質問があります。", missing: errors };

  const now = new Date().toISOString();
  await store.createResponses(
    items.map((i) => ({
      participant_id: p.id,
      exposure_id: null,
      item_id: i.id,
      phase: "pre" as const,
      value: values[i.id],
      answered_at: now,
    })),
  );
  const updated = await store.updateParticipant(p.id, { status: "pre_done" });
  redirect(nextStepPath(slug, updated, await store.listExposures(p.id)));
}

export async function submitAdAction(
  slug: string,
  exposureId: string,
  _prev: ActionState,
  form: FormData,
): Promise<ActionState> {
  const store = getStore();
  const exp = await loadExperiment(slug);
  const p = await getCurrentParticipant(exp);
  if (!p) redirect(`/p/${slug}`);
  const exposures = await store.listExposures(p.id);
  const exposure = exposures.find((x) => x.id === exposureId);
  if (!exposure) return { error: "不正なリクエストです。" };
  if (exposure.duration_ms !== null) redirect(nextStepPath(slug, p, exposures));

  const items = (await store.listItems(exp.id)).filter((i) => i.phase === "post_ad");
  const { values, errors } = parseAnswers(items, form);
  if (errors.length) return { error: "未回答の質問があります。", missing: errors };

  const duration = Number(form.get("duration_ms"));
  const shownAt = String(form.get("shown_at") ?? "");
  const now = new Date().toISOString();

  await store.createResponses(
    items.map((i) => ({
      participant_id: p.id,
      exposure_id: exposure.id,
      item_id: i.id,
      phase: "post_ad" as const,
      value: values[i.id],
      answered_at: now,
    })),
  );
  await store.updateExposure(exposure.id, {
    duration_ms: Number.isFinite(duration) ? Math.round(duration) : 0,
    shown_at: shownAt || now,
  });

  const remaining = exposures.filter((x) => x.id !== exposure.id && x.duration_ms === null);
  if (remaining.length === 0) {
    const updated = await store.updateParticipant(p.id, { status: "ads_done" });
    redirect(nextStepPath(slug, updated, []));
  }
  const next = remaining.sort((a, b) => a.sort_order - b.sort_order)[0];
  redirect(`/p/${slug}/ad/${next.sort_order + 1}`);
}

export async function submitFinalAction(
  slug: string,
  _prev: ActionState,
  form: FormData,
): Promise<ActionState> {
  const store = getStore();
  const exp = await loadExperiment(slug);
  const p = await getCurrentParticipant(exp);
  if (!p) redirect(`/p/${slug}`);
  if (p.status !== "ads_done") redirect(nextStepPath(slug, p, await store.listExposures(p.id)));

  const items = (await store.listItems(exp.id)).filter((i) => i.phase === "final");
  const { values, errors } = parseAnswers(items, form);
  if (errors.length) return { error: "未回答の質問があります。", missing: errors };

  const now = new Date().toISOString();
  await store.createResponses(
    items.map((i) => ({
      participant_id: p.id,
      exposure_id: null,
      item_id: i.id,
      phase: "final" as const,
      value: values[i.id],
      answered_at: now,
    })),
  );
  await store.updateParticipant(p.id, { status: "completed", completed_at: now });
  redirect(`/p/${slug}/done`);
}
