import { notFound, redirect } from "next/navigation";
import { getStore } from "@/lib/db";
import { getCurrentParticipant, nextStepPath } from "@/lib/participant";
import { participantDict } from "@/lib/i18n-server";
import { ParticipantShell } from "@/components/ParticipantShell";
import { SurveyForm } from "@/components/SurveyForm";
import { submitPreAction } from "../actions";

export const dynamic = "force-dynamic";

export default async function PrePage(props: PageProps<"/p/[slug]/pre">) {
  const { slug } = await props.params;
  const store = getStore();
  const exp = await store.getExperimentBySlug(slug);
  if (!exp) notFound();
  const { locale, d } = participantDict(exp);
  const p = await getCurrentParticipant(exp);
  if (!p) redirect(`/p/${slug}`);
  const exposures = await store.listExposures(p.id);
  if (p.status !== "started") redirect(nextStepPath(slug, p, exposures));

  const items = (await store.listItems(exp.id)).filter((i) => i.phase === "pre");
  const action = submitPreAction.bind(null, slug);

  return (
    <ParticipantShell title={d.preTitle} lang={locale} step={1} totalSteps={exposures.length + 2}>
      <SurveyForm items={items} action={action} text={{ next: d.next, sending: d.sending, missing: d.missing }} />
    </ParticipantShell>
  );
}
