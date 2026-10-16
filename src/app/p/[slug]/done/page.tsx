import { notFound } from "next/navigation";
import { getStore } from "@/lib/db";
import { ParticipantShell } from "@/components/ParticipantShell";

export const dynamic = "force-dynamic";

export default async function DonePage(props: PageProps<"/p/[slug]/done">) {
  const { slug } = await props.params;
  const exp = await getStore().getExperimentBySlug(slug);
  if (!exp) notFound();
  return (
    <ParticipantShell title="ご協力ありがとうございました">
      <section className="whitespace-pre-wrap rounded-lg border border-neutral-200 p-4 text-sm leading-relaxed">
        {exp.debrief_text}
      </section>
      <p className="mt-6 text-center text-xs text-neutral-500">このページを閉じて終了してください。</p>
    </ParticipantShell>
  );
}
