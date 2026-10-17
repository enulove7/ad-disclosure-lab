import Link from "next/link";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { getStore } from "@/lib/db";
import { DEFAULT_SETTINGS } from "@/lib/types";
import { adminDict } from "@/lib/i18n-server";
import { LOCALES, LOCALE_NAMES } from "@/lib/i18n";
import { SaveForm } from "@/components/admin/SaveForm";
import { ConfirmButton } from "@/components/admin/ConfirmButton";
import { btn, btnDanger, btnGhost, Card, Field, input, Tabs } from "@/components/admin/ui";
import { deleteExperimentAction, updateExperimentAction } from "../actions";

export const dynamic = "force-dynamic";

export default async function OverviewPage(props: PageProps<"/admin/[id]">) {
  const { id } = await props.params;
  const { d } = await adminDict();
  const store = getStore();
  const exp = await store.getExperiment(id);
  if (!exp) notFound();
  const [conditions, participants, ads, items] = await Promise.all([
    store.listConditions(id),
    store.listParticipants(id),
    store.listAds(id),
    store.listItems(id),
  ]);
  const settings = { ...DEFAULT_SETTINGS, ...exp.settings };
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const joinUrl = `${proto}://${host}/p/${exp.slug}`;

  const byCond = conditions.map((c) => ({
    c,
    n: participants.filter((p) => p.condition_id === c.id).length,
    done: participants.filter((p) => p.condition_id === c.id && p.status === "completed").length,
  }));
  const completed = participants.filter((p) => p.status === "completed").length;

  return (
    <div className="space-y-6">
      <Tabs id={id} active="" d={d} />

      <div className="grid gap-4 md:grid-cols-3">
        <Card title={d.participation}>
          <div className="text-3xl font-bold">{completed}</div>
          <div className="text-xs text-neutral-500">{d.completedOfStarted(participants.length)}</div>
          <ul className="mt-3 space-y-1 text-sm">
            {byCond.map(({ c, n, done }) => (
              <li key={c.id} className="flex justify-between">
                <span>
                  {c.code} {c.name}
                </span>
                <span className="tabular-nums">
                  {done}/{n}
                </span>
              </li>
            ))}
          </ul>
        </Card>
        <Card title={d.composition}>
          <ul className="space-y-1 text-sm">
            <li>{d.conditionsCount(conditions.length)}</li>
            <li>{d.adsCount(ads.length)}</li>
            <li>
              {d.itemsCount(
                items.length,
                items.filter((i) => i.phase === "pre").length,
                items.filter((i) => i.phase === "post_ad").length,
                items.filter((i) => i.phase === "final").length,
              )}
            </li>
          </ul>
        </Card>
        <Card title={d.joinUrl}>
          <code className="block break-all rounded bg-neutral-100 p-2 text-xs">{joinUrl}</code>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link href={`/p/${exp.slug}`} target="_blank" className={btnGhost}>
              {d.open}
            </Link>
            <Link href={`/admin/${id}/export?format=long`} className={btnGhost}>
              {d.csvLong}
            </Link>
            <Link href={`/admin/${id}/export?format=wide`} className={btnGhost}>
              {d.csvWide}
            </Link>
          </div>
          <p className="mt-2 text-xs text-neutral-500">{d.activeOnlyHint}</p>
        </Card>
      </div>

      <Card title={d.settings}>
        <SaveForm action={updateExperimentAction.bind(null, id)} savedText={d.saved} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Field name="title" title={d.title}>
              <input id="title" name="title" defaultValue={exp.title} className={input} />
            </Field>
            <Field name="status" title={d.publishState}>
              <select id="status" name="status" defaultValue={exp.status} className={input}>
                <option value="draft">{d.statusOptions.draft}</option>
                <option value="active">{d.statusOptions.active}</option>
                <option value="closed">{d.statusOptions.closed}</option>
              </select>
            </Field>
            <Field name="locale" title={d.language}>
              <select id="locale" name="locale" defaultValue={settings.locale} className={input}>
                {LOCALES.map((l) => (
                  <option key={l} value={l}>
                    {LOCALE_NAMES[l]}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <Field name="description" title={d.memo}>
            <textarea id="description" name="description" defaultValue={exp.description} className={input} rows={2} />
          </Field>
          <div className="grid gap-4 md:grid-cols-4">
            <Field name="min_exposure_seconds" title={d.minExposure}>
              <input id="min_exposure_seconds" name="min_exposure_seconds" type="number" min={0} defaultValue={settings.min_exposure_seconds} className={input} />
            </Field>
            <Field name="ads_per_participant" title={d.adsPerParticipant}>
              <input id="ads_per_participant" name="ads_per_participant" type="number" min={0} defaultValue={settings.ads_per_participant} className={input} />
            </Field>
            <Field name="assignment" title={d.assignment}>
              <select id="assignment" name="assignment" defaultValue={settings.assignment} className={input}>
                <option value="balanced">{d.assignBalanced}</option>
                <option value="weighted">{d.assignWeighted}</option>
              </select>
            </Field>
            <label className="flex items-end gap-2 pb-2 text-sm">
              <input type="checkbox" name="randomize_ad_order" defaultChecked={settings.randomize_ad_order} />
              {d.randomizeOrder}
            </label>
          </div>
          <Field name="consent_text" title={d.consentText}>
            <textarea id="consent_text" name="consent_text" defaultValue={exp.consent_text} className={input} rows={5} />
          </Field>
          <Field name="debrief_text" title={d.debriefText}>
            <textarea id="debrief_text" name="debrief_text" defaultValue={exp.debrief_text} className={input} rows={5} />
          </Field>
          <div className="grid gap-4 md:grid-cols-2">
            <Field name="completion_code" title={d.completionCode}>
              <input id="completion_code" name="completion_code" defaultValue={settings.completion_code} className={input} placeholder="C1A2B3C4" />
            </Field>
            <Field name="completion_url" title={d.completionUrl}>
              <input id="completion_url" name="completion_url" defaultValue={settings.completion_url} className={input} placeholder="https://app.prolific.com/submissions/complete?cc=C1A2B3C4" />
            </Field>
          </div>
          <p className="text-xs text-neutral-500">{d.panelHint}</p>
          <button className={btn}>{d.save}</button>
        </SaveForm>
      </Card>

      <Card title={d.danger}>
        <ConfirmButton action={deleteExperimentAction.bind(null, id)} message={d.deleteExperimentConfirm} className={btnDanger}>
          {d.deleteExperiment}
        </ConfirmButton>
      </Card>
    </div>
  );
}
