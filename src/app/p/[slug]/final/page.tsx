import { notFound, redirect } from "next/navigation";
import { getStore } from "@/lib/db";
import { getCurrentParticipant, nextStepPath } from "@/lib/participant";
import { ParticipantShell } from "@/components/ParticipantShell";
import { SurveyForm } from "@/components/SurveyForm";
import { submitFinalAction } from "../actions";

export const dynamic = "force-dynamic";

export default async function FinalPage(props: PageProps<"/p/[slug]/final">) {
  const { slug } = await props.params;
  const store = getStore();
  const exp = await store.getExperimentBySlug(slug);
  if (!exp) notFound();
  const p = await getCurrentParticipant(exp);
  if (!p) redirect(`/p/${slug}`);
  const exposures = await store.listExposures(p.id);
  if (p.status !== "ads_done") redirect(nextStepPath(slug, p, exposures));

  const items = (await store.listItems(exp.id)).filter((i) => i.phase === "final");
  const action = submitFinalAction.bind(null, slug);

  return (
    <ParticipantShell title="最後に" step={exposures.length + 2} totalSteps={exposures.length + 2}>
      <SurveyForm items={items} action={action} submitLabel="回答を送信する" />
    </ParticipantShell>
  );
}
