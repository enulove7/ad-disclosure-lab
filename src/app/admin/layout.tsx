import Link from "next/link";
import { storeKind } from "@/lib/db";

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  const kind = storeKind();
  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-3">
          <Link href="/admin" className="font-bold">
            Ad Disclosure Lab <span className="text-xs font-normal text-neutral-500">admin</span>
          </Link>
          <span
            className={`rounded-full px-2 py-0.5 text-xs ${
              kind === "supabase" ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"
            }`}
            title={kind === "supabase" ? "Supabaseに保存中" : "ローカルの data/db.json に保存中"}
          >
            {kind === "supabase" ? "Supabase" : "Local JSON"}
          </span>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">{children}</main>
    </div>
  );
}
