import Link from "next/link";
import { getStore } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { adminDict } from "@/lib/i18n-server";
import { LOCALES, LOCALE_NAMES, asLocale } from "@/lib/i18n";
import { SaveForm } from "@/components/admin/SaveForm";
import { btn, btnGhost, Card, Field, input } from "@/components/admin/ui";
import { createGameAction } from "../game-actions";

export const dynamic = "force-dynamic";

export default async function GamesPage() {
  await requireAdmin();
  const { locale, d } = await adminDict();
  const store = getStore();
  const games = await store.listGames();
  const counts = await Promise.all(
    games.map(async (g) => {
      const ss = await store.listGameSessions(g.id);
      return { started: ss.length, done: ss.filter((s) => s.completed_at).length };
    }),
  );
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">{d.gamesTitle}</h1>
        <Link href="/admin" className={btnGhost}>
          {d.experiments}
        </Link>
      </div>
      {games.length === 0 ? (
        <Card>
          <p className="text-sm text-neutral-600">{d.noGames}</p>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {games.map((g, i) => (
            <Link key={g.id} href={`/admin/games/${g.id}`} className="block">
              <Card>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-semibold">{g.title}</div>
                    <div className="mt-0.5 text-xs text-neutral-500">
                      /g/{g.slug} · {LOCALE_NAMES[asLocale(g.settings?.locale)]}
                    </div>
                  </div>
                  <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs">{d.status[g.status]}</span>
                </div>
                <div className="mt-3 text-sm text-neutral-600">{d.gameSessions(counts[i].started, counts[i].done)}</div>
              </Card>
            </Link>
          ))}
        </div>
      )}
      <Card title={d.newGame}>
        <SaveForm action={createGameAction} savedText={d.saved} className="grid gap-3 md:grid-cols-[2fr_1fr_1fr_auto] md:items-end">
          <Field name="g_title" title={d.title}>
            <input id="g_title" name="title" className={input} required />
          </Field>
          <Field name="g_slug" title={d.slug}>
            <input id="g_slug" name="slug" className={input} placeholder="ai-or-human" />
          </Field>
          <Field name="g_locale" title={d.language}>
            <select id="g_locale" name="locale" defaultValue={locale} className={input}>
              {LOCALES.map((l) => (
                <option key={l} value={l}>
                  {LOCALE_NAMES[l]}
                </option>
              ))}
            </select>
          </Field>
          <button className={btn}>{d.create}</button>
        </SaveForm>
      </Card>
    </div>
  );
}
