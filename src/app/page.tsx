import Link from "next/link";
import { adminDict } from "@/lib/i18n-server";
import { t } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export default async function Home() {
  const { locale } = await adminDict();
  const d = t(locale).p;
  return (
    <main lang={locale} className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-start justify-center gap-4 px-4 py-16">
      <h1 className="text-2xl font-bold">{d.appTitle}</h1>
      <p className="text-sm text-neutral-600">{d.homeDesc}</p>
      <Link href="/admin" className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-semibold text-white">
        {d.toAdmin}
      </Link>
    </main>
  );
}
