import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-start justify-center gap-4 px-4 py-16">
      <h1 className="text-2xl font-bold">Ad Disclosure Lab</h1>
      <p className="text-sm text-neutral-600">
        AI広告の開示方法が消費者の反応に与える影響を測定する実験プラットフォーム。
      </p>
      <Link href="/admin" className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-semibold text-white">
        管理画面へ
      </Link>
    </main>
  );
}
