import { notFound } from "next/navigation";
import { getStore } from "@/lib/db";
import type { Ad } from "@/lib/types";
import { SaveForm } from "@/components/admin/SaveForm";
import { ConfirmButton } from "@/components/admin/ConfirmButton";
import { btn, btnDanger, Card, Field, input, Tabs } from "@/components/admin/ui";
import { deleteAdAction, saveAdAction } from "../../actions";

export const dynamic = "force-dynamic";

function AdForm({ experimentId, a }: { experimentId: string; a?: Ad }) {
  return (
    <SaveForm action={saveAdAction.bind(null, experimentId)} className="space-y-3">
      {a && <input type="hidden" name="id" value={a.id} />}
      <div className="grid gap-3 md:grid-cols-4">
        <Field name="code" title="コード">
          <input name="code" defaultValue={a?.code ?? ""} className={input} placeholder="AD3" />
        </Field>
        <Field name="name" title="管理用の名前">
          <input name="name" defaultValue={a?.name ?? ""} className={input} />
        </Field>
        <Field name="brand_name" title="ブランド名（架空）">
          <input name="brand_name" defaultValue={a?.brand_name ?? ""} className={input} />
        </Field>
        <Field name="product_category" title="製品カテゴリ（分析用）">
          <input name="product_category" defaultValue={a?.product_category ?? ""} className={input} placeholder="hedonic / utilitarian" />
        </Field>
      </div>
      <Field name="headline" title="見出し">
        <input name="headline" defaultValue={a?.headline ?? ""} className={input} />
      </Field>
      <Field name="body_text" title="本文">
        <textarea name="body_text" defaultValue={a?.body_text ?? ""} className={input} rows={2} />
      </Field>
      <div className="grid gap-3 md:grid-cols-3">
        <Field name="cta_text" title="ボタン文言">
          <input name="cta_text" defaultValue={a?.cta_text ?? ""} className={input} />
        </Field>
        <Field name="image_url" title="画像URL">
          <input name="image_url" defaultValue={a?.image_url ?? ""} className={input} placeholder="https://… または /demo/…" />
        </Field>
        <Field name="image_file" title="画像をアップロード（URLより優先）">
          <input name="image_file" type="file" accept="image/*" className="text-sm" />
        </Field>
      </div>
      <input type="hidden" name="sort_order" value={a?.sort_order ?? 99} />
      <button className={btn}>{a ? "保存" : "追加"}</button>
    </SaveForm>
  );
}

export default async function AdsPage(props: PageProps<"/admin/[id]/ads">) {
  const { id } = await props.params;
  const store = getStore();
  const exp = await store.getExperiment(id);
  if (!exp) notFound();
  const ads = await store.listAds(id);

  return (
    <div className="space-y-6">
      <Tabs id={id} active="ads" />
      <p className="text-sm text-neutral-600">
        画像は全条件で同じものを使い、ラベルだけが条件で変わります。正方形（1080×1080）の画像を推奨。
      </p>
      {ads.map((a) => (
        <Card
          key={a.id}
          title={`${a.code} ${a.name}`}
          right={
            <ConfirmButton action={deleteAdAction.bind(null, id, a.id)} message="この広告を削除しますか？" className={btnDanger}>
              削除
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
            <AdForm experimentId={id} a={a} />
          </div>
        </Card>
      ))}
      <Card title="広告を追加">
        <AdForm experimentId={id} />
      </Card>
    </div>
  );
}
