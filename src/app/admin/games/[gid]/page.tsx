import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { getStore } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { adminDict } from "@/lib/i18n-server";
import { LOCALES, LOCALE_NAMES, type Dict } from "@/lib/i18n";
import { cardStats, gameSettings, likingShift } from "@/lib/game";
import { defaultImageModel, IMAGE_MODELS, imageGenAvailable } from "@/lib/imagegen";
import type { GameCard } from "@/lib/types";
import { SaveForm } from "@/components/admin/SaveForm";
import { ConfirmButton } from "@/components/admin/ConfirmButton";
import { btn, btnDanger, btnGhost, Card, Field, input } from "@/components/admin/ui";
import { deleteCardAction, deleteGameAction, generateCardImageAction, saveCardAction, updateGameAction } from "../../game-actions";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

const CARD_PROMPT =
  "Fashion campaign photograph for a mass-market apparel brand: a Japanese woman in her 20s wearing a plain white linen shirt and beige wide trousers, standing in a bright minimal studio, three-quarter body, natural expression, soft daylight, realistic skin and fabric texture, 50mm lens. No text, no letters, no logo, no watermark.";

function CardForm({ gameId, c, d }: { gameId: string; c?: GameCard; d: Dict["a"] }) {
  return (
    <SaveForm action={saveCardAction.bind(null, gameId)} savedText={d.saved} className="space-y-3">
      {c && <input type="hidden" name="id" value={c.id} />}
      <input type="hidden" name="sort_order" value={c?.sort_order ?? 99} />
      <div className="grid gap-3 md:grid-cols-3">
        <Field title={d.brandName}>
          <input name="brand_name" defaultValue={c?.brand_name ?? ""} className={input} />
        </Field>
        <Field title={d.headline}>
          <input name="headline" defaultValue={c?.headline ?? ""} className={input} />
        </Field>
        <Field title={d.bodyText}>
          <input name="body_text" defaultValue={c?.body_text ?? ""} className={input} />
        </Field>
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        <Field title={d.gameColType}>
          <select name="is_ai" defaultValue={c ? String(c.is_ai) : "true"} className={input}>
            <option value="true">{d.gameIsAi}</option>
            <option value="false">{d.gameIsHuman}</option>
          </select>
        </Field>
        <Field title={d.imageUrl}>
          <input name="image_url" defaultValue={c?.image_url ?? ""} className={input} />
        </Field>
        <Field title={d.imageUpload}>
          <input name="image_file" type="file" accept="image/*" className="text-sm" />
        </Field>
      </div>
      <Field title={d.gameSourceNote}>
        <input name="source_note" defaultValue={c?.source_note ?? ""} className={input} placeholder={d.gameSourceHint} />
      </Field>
      <button className={btn}>{c ? d.save : d.add}</button>
    </SaveForm>
  );
}

export default async function GameAdminPage(props: PageProps<"/admin/games/[gid]">) {
  await requireAdmin();
  const { gid } = await props.params;
  const { d } = await adminDict();
  const store = getStore();
  const game = await store.getGame(gid);
  if (!game) notFound();
  const settings = gameSettings(game);
  const [cards, sessions, answers, experiments] = await Promise.all([
    store.listGameCards(gid),
    store.listGameSessions(gid),
    store.listGameAnswersByGame(gid),
    store.listExperiments(),
  ]);
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const playUrl = `${proto}://${host}/g/${game.slug}`;
  const done = sessions.filter((s) => s.completed_at);
  const overallAcc = answers.length ? Math.round((answers.filter((a) => a.correct).length / answers.length) * 100) : null;
  const shift = likingShift(answers, cards);
  const stats = cardStats(cards, answers);
  const available = imageGenAvailable();
  const fmt = (x: number | null, digits = 1) => (x === null ? "—" : x.toFixed(digits));

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/games" className="text-xs text-neutral-500">
          ← {d.gamesTitle}
        </Link>
        <h1 className="text-xl font-bold">{game.title}</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card title={d.gameStats}>
          <div className="text-3xl font-bold">{overallAcc === null ? "—" : `${overallAcc}%`}</div>
          <div className="text-xs text-neutral-500">{d.gameAccuracy}</div>
          <p className="mt-3 text-sm">{d.gameSessions(sessions.length, done.length)}</p>
        </Card>
        <Card title={d.gameLikingShift}>
          <dl className="space-y-1 text-sm">
            <div className="flex justify-between">
              <dt>🤖 AI</dt>
              <dd className="tabular-nums">
                {shift.ai ? `${fmt(shift.ai.before)} → ${fmt(shift.ai.after)} (n=${shift.ai.n})` : "—"}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt>🧑‍🎨 Human</dt>
              <dd className="tabular-nums">
                {shift.human ? `${fmt(shift.human.before)} → ${fmt(shift.human.after)} (n=${shift.human.n})` : "—"}
              </dd>
            </div>
          </dl>
        </Card>
        <Card title={d.gamePlayUrl}>
          <code className="block break-all rounded bg-neutral-100 p-2 text-xs">{playUrl}</code>
          <div className="mt-3">
            <Link href={`/g/${game.slug}`} target="_blank" className={btnGhost}>
              {d.open}
            </Link>
          </div>
          <p className="mt-2 text-xs text-neutral-500">{d.activeOnlyHint}</p>
        </Card>
      </div>

      <Card title={d.settings}>
        <SaveForm action={updateGameAction.bind(null, gid)} savedText={d.saved} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Field name="title" title={d.title}>
              <input id="title" name="title" defaultValue={game.title} className={input} />
            </Field>
            <Field name="status" title={d.publishState}>
              <select id="status" name="status" defaultValue={game.status} className={input}>
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
          <Field name="intro_text" title={d.gameIntro}>
            <textarea id="intro_text" name="intro_text" defaultValue={game.intro_text} rows={4} className={input} />
          </Field>
          <div className="grid gap-4 md:grid-cols-3">
            <Field name="cards_per_round" title={d.gameCardsPerRound}>
              <input id="cards_per_round" name="cards_per_round" type="number" min={0} defaultValue={settings.cards_per_round} className={input} />
            </Field>
            <Field name="link_experiment_slug" title={d.gameLinkExperiment}>
              <input id="link_experiment_slug" name="link_experiment_slug" defaultValue={settings.link_experiment_slug} className={input} list="exp-slugs" />
              <datalist id="exp-slugs">
                {experiments.map((e) => (
                  <option key={e.id} value={e.slug}>
                    {e.title}
                  </option>
                ))}
              </datalist>
            </Field>
            <label className="flex items-end gap-2 pb-2 text-sm">
              <input type="checkbox" name="ask_liking" defaultChecked={settings.ask_liking} />
              {d.gameAskLiking}
            </label>
          </div>
          <button className={btn}>{d.save}</button>
        </SaveForm>
      </Card>

      <Card title={`${d.gameCards} (${cards.length})`}>
        <p className="mb-3 text-xs text-neutral-500">{d.gameSourceHint}</p>
        {stats.length > 0 && (
          <div className="mb-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs text-neutral-500">
                <tr>
                  <th className="py-1 text-left">#</th>
                  <th className="py-1 text-left">{d.gameColType}</th>
                  <th className="py-1 text-right">{d.gameColAnswers}</th>
                  <th className="py-1 text-right">{d.gameColAccuracy}</th>
                  <th className="py-1 text-right">{d.gameColBefore}</th>
                  <th className="py-1 text-right">{d.gameColAfter}</th>
                  <th className="py-1 text-right">{d.gameColShift}</th>
                </tr>
              </thead>
              <tbody>
                {stats.map((s, i) => (
                  <tr key={s.card.id} className="border-t border-neutral-100">
                    <td className="py-1">{i + 1}</td>
                    <td className="py-1">{s.card.is_ai ? "🤖 AI" : "🧑‍🎨 Human"}</td>
                    <td className="py-1 text-right tabular-nums">{s.n}</td>
                    <td className="py-1 text-right tabular-nums">{s.accuracy === null ? "—" : `${Math.round(s.accuracy * 100)}%`}</td>
                    <td className="py-1 text-right tabular-nums">{fmt(s.before)}</td>
                    <td className="py-1 text-right tabular-nums">{fmt(s.after)}</td>
                    <td className="py-1 text-right tabular-nums">
                      {s.before !== null && s.after !== null ? `${s.after - s.before >= 0 ? "+" : ""}${(s.after - s.before).toFixed(1)}` : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="space-y-4">
          {cards.map((c, i) => (
            <div key={c.id} className="rounded-lg border border-neutral-200 p-4">
              <div className="mb-3 flex items-center justify-between">
                <div className="text-sm font-semibold">
                  #{i + 1} {c.is_ai ? "🤖" : "🧑‍🎨"} {c.brand_name || d.gameCard}
                  {c.gen_model && <span className="ml-2 text-xs font-normal text-neutral-500">{c.gen_model}</span>}
                </div>
                <ConfirmButton action={deleteCardAction.bind(null, gid, c.id)} message={d.gameDeleteCardConfirm} className={btnDanger}>
                  {d.delete}
                </ConfirmButton>
              </div>
              <div className="grid gap-4 md:grid-cols-[140px_1fr]">
                <div className="aspect-square w-36 overflow-hidden rounded-md bg-neutral-100">
                  {c.image_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={c.image_url} alt="" className="h-full w-full object-cover" />
                  )}
                </div>
                <div className="space-y-3">
                  <CardForm gameId={gid} c={c} d={d} />
                  {available && (
                    <SaveForm action={generateCardImageAction.bind(null, gid, c.id)} savedText={d.saved} className="rounded-md border border-dashed border-neutral-300 bg-neutral-50 p-3">
                      <div className="text-xs font-semibold">{d.gameGenerate}</div>
                      <textarea name="prompt" rows={3} defaultValue={c.gen_prompt || CARD_PROMPT} className={`${input} mt-2`} />
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <select name="model" defaultValue={defaultImageModel()} className={`${input} max-w-xs`}>
                          {IMAGE_MODELS.map((m) => (
                            <option key={m.id} value={m.id}>
                              {m.label}
                            </option>
                          ))}
                        </select>
                        <button className={btn}>{d.genButton}</button>
                      </div>
                    </SaveForm>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-6 rounded-lg border border-neutral-200 bg-neutral-50 p-4">
          <h3 className="mb-3 text-sm font-semibold">{d.gameAddCard}</h3>
          <CardForm gameId={gid} d={d} />
        </div>
      </Card>

      <Card title={d.danger}>
        <ConfirmButton action={deleteGameAction.bind(null, gid)} message={d.gameDeleteConfirm} className={btnDanger}>
          {d.gameDelete}
        </ConfirmButton>
      </Card>
    </div>
  );
}
