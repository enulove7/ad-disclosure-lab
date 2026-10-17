import { notFound, redirect } from "next/navigation";
import { getStore } from "@/lib/db";
import { asLocale, t } from "@/lib/i18n";
import { gameSettings, getCurrentGameSession } from "@/lib/game";
import { StartForm } from "./StartForm";

export const dynamic = "force-dynamic";

export default async function GameIntroPage(props: PageProps<"/g/[slug]">) {
  const { slug } = await props.params;
  const game = await getStore().getGameBySlug(slug);
  if (!game) notFound();
  const locale = asLocale(gameSettings(game).locale);
  const d = t(locale).g;
  const session = await getCurrentGameSession(game);
  if (session) redirect(session.completed_at ? `/g/${slug}/result` : `/g/${slug}/play`);

  return (
    <main lang={locale} className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-10">
      <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
        <div className="mb-3 text-4xl" aria-hidden="true">🤖 vs 🧑‍🎨</div>
        <h1 className="text-2xl font-bold leading-tight">{game.title}</h1>
        <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-neutral-700">{game.intro_text}</p>
        {game.status !== "active" ? (
          <p className="mt-6 rounded-lg bg-neutral-100 p-3 text-sm">{d.closed}</p>
        ) : (
          <StartForm slug={slug} label={d.start} pendingLabel={d.preparing} />
        )}
      </div>
    </main>
  );
}
