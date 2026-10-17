import type { Ad, LabelConfig } from "@/lib/types";
import { DisclosureLabel } from "./DisclosureLabel";

/**
 * 광고 카드. SNS 피드의 스폰서 게시물처럼 보이도록 구성하고,
 * 이미지 위에 조건별 공개 라벨을 CSS로 오버레이한다.
 * 이미지 자체는 모든 조건에서 동일하므로 라벨 외의 차이가 생기지 않는다.
 */
export function AdCard({ ad, label, adWord = "AD" }: { ad: Ad; label: LabelConfig; adWord?: string }) {
  const topBar = label.enabled && label.position === "top-bar";
  const bottomBar = label.enabled && label.position === "bottom-bar";
  const below = label.enabled && label.position === "below-image";
  const corner = label.enabled && !topBar && !bottomBar && !below;

  return (
    <article className="mx-auto w-full max-w-md overflow-hidden rounded-xl border border-neutral-200 bg-white text-neutral-900 shadow-sm">
      <header className="flex items-center gap-3 px-4 py-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-neutral-700 to-neutral-900 text-sm font-bold text-white">
          {ad.brand_name.slice(0, 1)}
        </div>
        <div className="min-w-0 flex-1 leading-tight">
          <div className="flex items-center gap-1 text-sm font-semibold">
            <span className="truncate">{ad.brand_name}</span>
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 shrink-0 text-sky-500" fill="currentColor" aria-hidden="true">
              <path d="M12 2l2.4 2.1 3.1-.5 1 3 2.9 1.3-.6 3.1 2 2.5-2 2.5.6 3.1-2.9 1.3-1 3-3.1-.5L12 22l-2.4-2.1-3.1.5-1-3-2.9-1.3.6-3.1L1.2 12l2-2.5-.6-3.1 2.9-1.3 1-3 3.1.5L12 2zm-1.2 13.4l5.3-5.3-1.4-1.4-3.9 3.9-1.8-1.8-1.4 1.4 3.2 3.2z" />
            </svg>
          </div>
          <div className="text-xs text-neutral-500">{adWord}</div>
        </div>
        <span className="text-neutral-400" aria-hidden="true">···</span>
      </header>

      {topBar && <DisclosureLabel label={label} />}

      <div className="relative aspect-square w-full bg-neutral-100">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={ad.image_url} alt="" className="h-full w-full object-cover" draggable={false} />
        {corner && <DisclosureLabel label={label} />}
      </div>

      {bottomBar && <DisclosureLabel label={label} />}

      {ad.cta_text && (
        <div className="flex items-center justify-between border-b border-neutral-100 px-4 py-2.5 text-sm font-semibold">
          <span>{ad.cta_text}</span>
          <span aria-hidden="true">›</span>
        </div>
      )}

      {below && <DisclosureLabel label={label} />}

      <div className="flex items-center gap-4 px-4 pt-3 text-neutral-800" aria-hidden="true">
        <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 21s-7-4.6-9.3-9A5.2 5.2 0 0 1 12 6a5.2 5.2 0 0 1 9.3 6c-2.3 4.4-9.3 9-9.3 9z" /></svg>
        <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 21l1.9-5.4A8 8 0 1 1 21 12z" /></svg>
        <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" /></svg>
        <svg viewBox="0 0 24 24" className="ml-auto h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M6 3h12v18l-6-4-6 4V3z" /></svg>
      </div>

      <div className="px-4 pb-4 pt-2">
        <p className="text-sm">
          <span className="font-semibold">{ad.brand_name}</span>{" "}
          <span className="font-semibold">{ad.headline}</span>
        </p>
        <p className="mt-0.5 text-sm text-neutral-700">{ad.body_text}</p>
      </div>
    </article>
  );
}
