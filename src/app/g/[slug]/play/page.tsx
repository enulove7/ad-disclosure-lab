import { notFound, redirect } from "next/navigation";
import { getStore } from "@/lib/db";
import { asLocale, t, type Locale } from "@/lib/i18n";
import { gameSettings, getCurrentGameSession } from "@/lib/game";
import { Play, type PlayText } from "./Play";

export const dynamic = "force-dynamic";

function playText(locale: Locale): PlayText {
  const g = t(locale).g;
  return {
    likingQ: g.likingQ,
    likingLow: g.likingLow,
    likingHigh: g.likingHigh,
    guessQ: g.guessQ,
    guessAi: g.guessAi,
    guessHuman: g.guessHuman,
    correct: g.correct,
    wrong: g.wrong,
    revealAi: g.revealAi,
    revealHuman: g.revealHuman,
    likingAfterQ: g.likingAfterQ,
    next: g.next,
    finish: g.finish,
  };
}

export default async function PlayPage(props: PageProps<"/g/[slug]/play">) {
  const { slug } = await props.params;
  const store = getStore();
  const game = await store.getGameBySlug(slug);
  if (!game) notFound();
  const settings = gameSettings(game);
  const locale = asLocale(settings.locale);
  const session = await getCurrentGameSession(game);
  if (!session) redirect(`/g/${slug}`);
  if (session.completed_at) redirect(`/g/${slug}/result`);

  const allCards = await store.listGameCards(game.id);
  const byId = new Map(allCards.map((c) => [c.id, c]));
  const cards = session.card_ids.map((id) => byId.get(id)).filter((c): c is NonNullable<typeof c> => Boolean(c));
  const answered = new Set((await store.listGameAnswers(session.id)).map((a) => a.card_id));
  const startIndex = cards.findIndex((c) => !answered.has(c.id));
  if (startIndex < 0) redirect(`/g/${slug}/result`);

  // 클라이언트에는 정답(is_ai)을 포함해 보내되, 화면에서는 판정 후에만 보여준다.
  // (게임 목적이라 엄격한 비밀 유지가 필요하지 않다. 연구용 자극물로 쓸 때는 별도 실험 흐름을 쓴다.)
  return (
    <Play
      slug={slug}
      locale={locale}
      cards={cards.map((c) => ({ id: c.id, brand_name: c.brand_name, headline: c.headline, body_text: c.body_text, image_url: c.image_url, is_ai: c.is_ai }))}
      startIndex={startIndex}
      askLiking={settings.ask_liking}
      text={playText(locale)}
    />
  );
}
