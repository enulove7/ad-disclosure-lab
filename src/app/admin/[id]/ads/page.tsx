import { notFound } from "next/navigation";
import { getStore } from "@/lib/db";
import type { Ad } from "@/lib/types";
import { adminDict } from "@/lib/i18n-server";
import type { Dict } from "@/lib/i18n";
import { SaveForm } from "@/components/admin/SaveForm";
import { ConfirmButton } from "@/components/admin/ConfirmButton";
import { btn, btnDanger, Card, Field, input, Tabs } from "@/components/admin/ui";
import { deleteAdAction, saveAdAction } from "../../actions";

export const dynamic = "force-dynamic";

function AdForm({ experimentId, a, d }: { experimentId: string; a?: Ad; d: Dict["a"] }) {
  return (
    <SaveForm action={saveAdAction.bind(null, experimentId)} savedText={d.saved} className="space-y-3">
      {a && <input type="hidden" name="id" value={a.id} />}
      <div className="grid gap-3 md:grid-cols-4">
        <Field name="code" title={d.code}>
          <input name="code" defaultValue={a?.code ?? ""} className={input} placeholder="AD3" />
        </Field>
        <Field name="name" title={d.adminName}>
          <input name="name" defaultValue={a?.name ?? ""} className={input} />
        </Field>
        <Field name="brand_name" title={d.brandName}>
          <input name="brand_name" defaultValue={a?.brand_name ?? ""} className={input} />
        </Field>
        <Field name="product_category" title={d.productCategory}>
          <input name="product_category" defaultValue={a?.product_category ?? ""} className={input} placeholder="hedonic / utilitarian" />
        </Field>
      </div>
      <Field name="headline" title={d.headline}>
        <input name="headline" defaultValue={a?.headline ?? ""} className={input} />
      </Field>
      <Field name="body_text" title={d.bodyText}>
        <textarea name="body_text" defaultValue={a?.body_text ?? ""} className={input} rows={2} />
      </Field>
      <div className="grid gap-3 md:grid-cols-3">
        <Field name="cta_text" title={d.ctaText}>
          <input name="cta_text" defaultValue={a?.cta_text ?? ""} className={input} />
        </Field>
        <Field name="image_url" title={d.imageUrl}>
          <input name="image_url" defaultValue={a?.image_url ?? ""} className={input} placeholder="https://… / /demo/…" />
        </Field>
        <Field name="image_file" title={d.imageUpload}>
          <input name="image_file" type="file" accept="image/*" className="text-sm" />
        </Field>
      </div>
      <input type="hidden" name="sort_order" value={a?.sort_order ?? 99} />
      <button className={btn}>{a ? d.save : d.add}</button>
    </SaveForm>
  );
}

export default async function AdsPage(props: PageProps<"/admin/[id]/ads">) {
  const { id } = await props.params;
  const { d } = await adminDict();
  const store = getStore();
  const exp = await store.getExperiment(id);
  if (!exp) notFound();
  const ads = await store.listAds(id);

  return (
    <div className="space-y-6">
      <Tabs id={id} active="ads" d={d} />
      <p className="text-sm text-neutral-600">{d.adsHelp}</p>
      {ads.map((a) => (
        <Card
          key={a.id}
          title={`${a.code} ${a.name}`}
          right={
            <ConfirmButton action={deleteAdAction.bind(null, id, a.id)} message={d.deleteAdConfirm} className={btnDanger}>
              {d.delete}
            </ConfirmButton>
          }
        >
          <div className="grid gap-4 md:grid-cols-[160px_1fr]">
            <div className="aspect-square w-40 overflow-hidden rounded-md bg-neutral-100">
              {a.image_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={a.image_url} alt="" className="h-full w-full object-cover" />
              )}
            </div>
            <AdForm experimentId={id} a={a} d={d} />
          </div>
        </Card>
      ))}
      <Card title={d.addAd}>
        <AdForm experimentId={id} d={d} />
      </Card>
    </div>
  );
}
