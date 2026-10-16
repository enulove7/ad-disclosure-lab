import Link from "next/link";
import { getStore } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { adminDict } from "@/lib/i18n-server";
import { LOCALE_NAMES } from "@/lib/i18n";
import { asLocale } from "@/lib/i18n";
import { btn, btnGhost, Card } from "@/components/admin/ui";
import { logoutAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function AdminHome() {
  await requireAdmin();
  const { d } = await adminDict();
  const store = getStore();
  const experiments = await store.listExperiments();
  const counts = await Promise.all(
    experiments.map(async (e) => {
      const ps = await store.listParticipants(e.id);
      return { total: ps.length, done: ps.filter((p) => p.status === "completed").length };
    }),
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">{d.experiments}</h1>
        <div className="flex gap-2">
          <form action={logoutAction}>
            <button className={btnGhost}>{d.logout}</button>
          </form>
          <Link href="/admin/new" className={btn}>
            {d.newExperiment}
          </Link>
        </div>
      </div>

      {experiments.length === 0 ? (
        <Card>
          <p className="text-sm text-neutral-600">{d.noExperiments}</p>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {experiments.map((e, i) => (
            <Link key={e.id} href={`/admin/${e.id}`} className="block">
              <Card>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-semibold">{e.title}</div>
                    <div className="mt-0.5 text-xs text-neutral-500">
                      /p/{e.slug} · {LOCALE_NAMES[asLocale(e.settings?.locale)]}
                    </div>
                  </div>
                  <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs">{d.status[e.status]}</span>
                </div>
                <div className="mt-3 text-sm text-neutral-600">{d.participated(counts[i].total, counts[i].done)}</div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
