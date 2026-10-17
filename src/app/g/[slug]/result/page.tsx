import Link from "next/link";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { getStore } from "@/lib/db";
import { asLocale, t } from "@/lib/i18n";
import { gameSettings, getCurrentGameSession, likingShift, percentile } from "@/lib/game";
import { ShareButton } from "./ShareButton";
import { playAgainAction } from "../actions";

export const dynamic = "force-dynamic";

export default async function ResultPage(props: PageProps<"/g/[slug]/result">) {
  const { slug } = await props.params;
  const store = getStore();
  const game = await store.getGameBySlug(slug);
  if (!game) notFound();
  const settings = gameSettings(game);
  const locale = asLocale(settings.locale);
  const d = t(locale).g;
  const session = await getCurrentGameSession(game);
  if (!session) redirect(`/g/${slug}`);
  if (!session.completed_at) redirect(`/g/${slug}/play`);

  const [answers, cards, others] = await Promise.all([
    store.listGameAnswers(session.id),
    store.listGameCards(game.id),
    store.listGameSessions(game.id),
  ]);
  const pct = percentile(session.score, session.total, others.filter((s) => s.id !== session.id));
  const shift = likingShift(answers, cards);
  const cardById = new Map(cards.map((c) => [c.id, c]));
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const url = `${proto}://${host}/g/${slug}`;
  const rate = session.total ? Math.round((session.score / session.total) * 100) : 0;
  const fmtShift = (x: { before: number; after: number } | null) =>
    x ? `${x.before.toFixed(1)} → ${x.after.toFixed(1)} (${x.after - x.before >= 0 ? "+" : ""}${(x.after - x.before).toFixed(1)})` : d.shiftNone;

  return (
    <main lang={locale} className="mx-auto w-full max-w-md px-4 py-8">
      <section className="rounded-2xl border border-neutral-200 bg-white p-6 text-center shadow-sm">
        <h1 className="text-sm font-medium text-neutral-500">{d.resultTitle}</h1>
        <div className="mt-1 text-6xl font-bold tabular-nums">{rate}%</div>
        <p className="mt-1 text-sm text-neutral-700">{d.resultScore(session.score, session.total)}</p>
        <p className="mt-2 text-sm font-semibold">{pct === null ? d.resultFirst : d.resultPercentile(pct)}</p>
        <div className="mt-5 grid gap-2">
          <ShareButton label={d.share} copied={d.copied} text={d.shareText(session.score, session.total, url)} url={url} />
          {settings.link_experiment_slug && (
            <Link href={`/p/${settings.link_experiment_slug}`} className="rounded-xl border border-neutral-900 px-4 py-3 text-sm font-semibold">
              {d.toExperiment}
            </Link>
          )}
          <form action={playAgainAction.bind(null, slug)}>
            <button className="w-full rounded-xl px-4 py-2 text-sm text-neutral-600 underline">{d.playAgain}</button>
          </form>
        </div>
      </section>

      {settings.ask_liking && (
        <section className="mt-4 rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold">{d.shiftTitle}</h2>
          <dl className="mt-2 space-y-1 text-sm">
            <div className="flex justify-between">
              <dt className="text-neutral-600">🤖 {d.shiftAi}</dt>
              <dd className="tabular-nums">{fmtShift(shift.ai)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-neutral-600">🧑‍🎨 {d.shiftHuman}</dt>
              <dd className="tabular-nums">{fmtShift(shift.human)}</dd>
            </div>
          </dl>
        </section>
      )}

      <section className="mt-4 rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold">{d.recap}</h2>
        <ul className="mt-2 grid grid-cols-5 gap-2">
          {answers.map((a) => {
            const c = cardById.get(a.card_id);
            if (!c) return null;
            return (
              <li key={a.id} className="text-center">
                <div className={`overflow-hidden rounded-md border-2 ${a.correct ? "border-emerald-500" : "border-rose-500"}`}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={c.image_url} alt="" className="aspect-square w-full object-cover" />
                </div>
                <div className="mt-0.5 text-[10px] text-neutral-600">
                  {c.is_ai ? d.recapAi : d.recapHuman} / {d.yourAnswer}: {a.guess_ai ? d.recapAi : d.recapHuman}
                </div>
              </li>
            );
          })}
        </ul>
      </section>
    </main>
  );
}
