import type { Ad, LabelConfig } from "@/lib/types";
import { DisclosureLabel } from "./DisclosureLabel";

/**
 * 광고 카드. 이미지 위에 조건별 공개 라벨을 CSS로 오버레이한다.
 * 이미지 자체는 모든 조건에서 동일하므로 라벨 외의 차이가 생기지 않는다.
 */
export function AdCard({ ad, label }: { ad: Ad; label: LabelConfig }) {
  const topBar = label.enabled && label.position === "top-bar";
  const bottomBar = label.enabled && label.position === "bottom-bar";
  const below = label.enabled && label.position === "below-image";
  const corner = label.enabled && !topBar && !bottomBar && !below;

  return (
    <article className="mx-auto w-full max-w-md overflow-hidden rounded-xl border border-neutral-200 bg-white text-neutral-900 shadow-sm">
      <header className="flex items-center gap-3 px-4 py-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-neutral-200 text-sm font-bold">
          {ad.brand_name.slice(0, 1)}
        </div>
        <div className="leading-tight">
          <div className="text-sm font-semibold">{ad.brand_name}</div>
          <div className="text-xs text-neutral-500">広告</div>
        </div>
      </header>

      {topBar && <DisclosureLabel label={label} />}

      <div className="relative aspect-square w-full bg-neutral-100">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={ad.image_url} alt="" className="h-full w-full object-cover" draggable={false} />
        {corner && <DisclosureLabel label={label} />}
      </div>

      {bottomBar && <DisclosureLabel label={label} />}
      {below && <DisclosureLabel label={label} />}

      <div className="px-4 py-3">
        <h3 className="text-base font-bold">{ad.headline}</h3>
        <p className="mt-1 text-sm text-neutral-700">{ad.body_text}</p>
        {ad.cta_text && (
          <div className="mt-3 inline-block rounded-md bg-neutral-900 px-4 py-2 text-sm font-semibold text-white">
            {ad.cta_text}
          </div>
        )}
      </div>
    </article>
  );
}
