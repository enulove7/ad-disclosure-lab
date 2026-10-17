import Link from "next/link";
import type { Dict } from "@/lib/i18n";

export const input =
  "w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm focus:border-neutral-900 focus:outline-none";
export const label = "block text-xs font-medium text-neutral-600 mb-1";
export const btn =
  "inline-flex items-center justify-center rounded-md bg-neutral-900 px-3 py-2 text-sm font-semibold text-white hover:bg-neutral-700 disabled:bg-neutral-400";
export const btnGhost =
  "inline-flex items-center justify-center rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm font-medium hover:bg-neutral-100";
export const btnDanger =
  "inline-flex items-center justify-center rounded-md border border-red-300 bg-white px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50";

export function Field({
  name,
  title,
  children,
  className = "",
}: {
  name?: string;
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className={label} htmlFor={name}>
        {title}
      </label>
      {children}
    </div>
  );
}

export function Card({ title, children, right }: { title?: string; children: React.ReactNode; right?: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-neutral-200 bg-white p-5">
      {(title || right) && (
        <div className="mb-4 flex items-center justify-between">
          {title && <h2 className="text-base font-semibold">{title}</h2>}
          {right}
        </div>
      )}
      {children}
    </section>
  );
}

export function Tabs({ id, active, d }: { id: string; active: string; d: Dict["a"] }) {
  const tabs: Array<[string, string]> = [
    ["", d.tabs.overview],
    ["conditions", d.tabs.conditions],
    ["ads", d.tabs.ads],
    ["survey", d.tabs.survey],
    ["preview", d.tabs.preview],
    ["participants", d.tabs.participants],
    ["results", d.tabs.results],
  ];
  return (
    <nav className="mb-6 flex flex-wrap gap-1 border-b border-neutral-200">
      {tabs.map(([seg, name]) => {
        const on = seg === active;
        return (
          <Link
            key={seg}
            href={`/admin/${id}${seg ? "/" + seg : ""}`}
            className={`-mb-px border-b-2 px-3 py-2 text-sm ${
              on ? "border-neutral-900 font-semibold" : "border-transparent text-neutral-500 hover:text-neutral-900"
            }`}
          >
            {name}
          </Link>
        );
      })}
    </nav>
  );
}
