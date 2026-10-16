import Link from "next/link";
import { headers } from "next/headers";
import { storeKind } from "@/lib/db";
import { adminDict } from "@/lib/i18n-server";
import { LocaleToggle } from "@/components/admin/LocaleToggle";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const kind = storeKind();
  const { locale, d } = await adminDict();
  const h = await headers();
  const back = h.get("x-pathname") ?? "/admin";
  return (
    <div lang={locale} className="flex min-h-full flex-1 flex-col">
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-3">
          <Link href="/admin" className="font-bold">
            {d.brand} <span className="text-xs font-normal text-neutral-500">admin</span>
          </Link>
          <div className="flex items-center gap-3">
            <span
              className={`rounded-full px-2 py-0.5 text-xs ${
                kind === "supabase" ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"
              }`}
              title={kind === "supabase" ? d.storeSupabase : d.storeLocal}
            >
              {kind === "supabase" ? "Supabase" : "Local JSON"}
            </span>
            <LocaleToggle current={locale} back={back} />
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">{children}</main>
    </div>
  );
}
