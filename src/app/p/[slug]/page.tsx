import { notFound, redirect } from "next/navigation";
import { getStore } from "@/lib/db";
import { getCurrentParticipant, nextStepPath } from "@/lib/participant";
import { participantDict } from "@/lib/i18n-server";
import { ParticipantShell } from "@/components/ParticipantShell";
import { ConsentForm } from "./ConsentForm";

export const dynamic = "force-dynamic";

export default async function ConsentPage(props: PageProps<"/p/[slug]">) {
  const { slug } = await props.params;
  const store = getStore();
  const exp = await store.getExperimentBySlug(slug);
  if (!exp) notFound();
  const { locale, d } = participantDict(exp);

  const existing = await getCurrentParticipant(exp);
  if (existing) redirect(nextStepPath(slug, existing, await store.listExposures(existing.id)));

  const closed = exp.status !== "active";

  return (
    <ParticipantShell title={exp.title} lang={locale}>
      {closed ? (
        <p className="rounded-lg bg-neutral-100 p-4 text-sm">{d.closed}</p>
      ) : (
        <>
          <section className="whitespace-pre-wrap rounded-lg border border-neutral-200 p-4 text-sm leading-relaxed">
            {exp.consent_text}
          </section>
          <ConsentForm slug={slug} startLabel={d.startButton} pendingLabel={d.preparing} />
        </>
      )}
    </ParticipantShell>
  );
}
