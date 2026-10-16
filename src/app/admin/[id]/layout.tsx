import { notFound } from "next/navigation";
import { getStore } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { adminDict } from "@/lib/i18n-server";

export default async function ExperimentLayout(props: LayoutProps<"/admin/[id]">) {
  await requireAdmin();
  const { d } = await adminDict();
  const { id } = await props.params;
  const exp = await getStore().getExperiment(id);
  if (!exp) notFound();
  return (
    <div>
      <div className="mb-4">
        <h1 className="text-xl font-bold">{exp.title}</h1>
        <p className="text-xs text-neutral-500">
          {d.joinUrl}: <code>/p/{exp.slug}</code>
        </p>
      </div>
      {props.children}
    </div>
  );
}
