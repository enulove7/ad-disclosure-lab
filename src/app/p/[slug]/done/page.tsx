import { notFound } from "next/navigation";
import { getStore } from "@/lib/db";
import { participantDict } from "@/lib/i18n-server";
import { getCurrentParticipant } from "@/lib/participant";
import { DEFAULT_SETTINGS } from "@/lib/types";
import { ParticipantShell } from "@/components/ParticipantShell";

export const dynamic = "force-dynamic";

export default async function DonePage(props: PageProps<"/p/[slug]/done">) {
  const { slug } = await props.params;
  const exp = await getStore().getExperimentBySlug(slug);
  if (!exp) notFound();
  const { locale, d } = participantDict(exp);
  const settings = { ...DEFAULT_SETTINGS, ...exp.settings };
  const p = await getCurrentParticipant(exp);
  const returnUrl = settings.completion_url ? settings.completion_url.replace("{pid}", encodeURIComponent(p?.external_id ?? "")) : "";
  return (
    <ParticipantShell title={d.doneTitle} lang={locale}>
      <section className="whitespace-pre-wrap rounded-lg border border-neutral-200 p-4 text-sm leading-relaxed">
        {exp.debrief_text}
      </section>
      {settings.completion_code && (
        <section className="mt-4 rounded-lg border border-neutral-900 p-4 text-center">
          <div className="text-xs text-neutral-500">{d.completionCode}</div>
          <div className="mt-1 select-all font-mono text-2xl font-bold tracking-wider">{settings.completion_code}</div>
        </section>
      )}
      {returnUrl && (
        <a href={returnUrl} className="mt-4 block w-full rounded-lg bg-neutral-900 px-4 py-3 text-center font-semibold text-white">
          {d.returnToPanel}
        </a>
      )}
      <p className="mt-6 text-center text-xs text-neutral-500">{d.doneHint}</p>
    </ParticipantShell>
  );
}
