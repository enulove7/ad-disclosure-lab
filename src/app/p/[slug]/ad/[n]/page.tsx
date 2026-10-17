import { notFound, redirect } from "next/navigation";
import { getStore } from "@/lib/db";
import { getCurrentParticipant, nextStepPath } from "@/lib/participant";
import { participantDict } from "@/lib/i18n-server";
import { DEFAULT_SETTINGS } from "@/lib/types";
import { ParticipantShell } from "@/components/ParticipantShell";
import { AdStep } from "./AdStep";
import { submitAdAction } from "../../actions";

export const dynamic = "force-dynamic";

export default async function AdPage(props: PageProps<"/p/[slug]/ad/[n]">) {
  const { slug, n } = await props.params;
  const store = getStore();
  const exp = await store.getExperimentBySlug(slug);
  if (!exp) notFound();
  const { locale, d } = participantDict(exp);
  const p = await getCurrentParticipant(exp);
  if (!p) redirect(`/p/${slug}`);
  const exposures = await store.listExposures(p.id);
  if (p.status !== "pre_done") redirect(nextStepPath(slug, p, exposures));

  const idx = Number(n) - 1;
  const exposure = exposures[idx];
  // 순서를 건너뛰거나 이미 끝난 노출로 접근하면 올바른 단계로 돌려보낸다
  const expected = exposures.find((x) => x.duration_ms === null);
  if (!exposure || !expected || exposure.id !== expected.id) {
    redirect(nextStepPath(slug, p, exposures));
  }

  const ads = await store.listAds(exp.id);
  const ad = ads.find((a) => a.id === exposure.ad_id);
  if (!ad) notFound();

  const items = (await store.listItems(exp.id)).filter((i) => i.phase === "post_ad");
  const settings = { ...DEFAULT_SETTINGS, ...exp.settings };
  const action = submitAdAction.bind(null, slug, exposure.id);

  return (
    <ParticipantShell
      title={d.adTitle(idx + 1, exposures.length)}
      lang={locale}
      step={idx + 2}
      totalSteps={exposures.length + 2}
    >
      <AdStep
        slug={slug}
        exposureId={exposure.id}
        ad={ad}
        label={exposure.label_snapshot}
        items={items}
        action={action}
        minSeconds={settings.min_exposure_seconds}
        text={{
          instruction: d.adInstruction,
          waitTemplate: d.adWait,
          surveyHeading: d.adSurveyHeading,
          adWord: d.adLabel,
          next: d.next,
          sending: d.sending,
          missing: d.missing,
        }}
      />
    </ParticipantShell>
  );
}
