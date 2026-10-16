import type { LabelConfig } from "@/lib/types";

const SIZE = {
  sm: "text-[11px] px-1.5 py-0.5 gap-1",
  md: "text-sm px-2.5 py-1 gap-1.5",
  lg: "text-base px-3 py-1.5 gap-2",
} as const;

const CORNER = {
  "top-left": "absolute top-2 left-2",
  "top-right": "absolute top-2 right-2",
  "bottom-left": "absolute bottom-2 left-2",
  "bottom-right": "absolute bottom-2 right-2",
} as const;

function SparkIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M12 2l1.8 5.4L19 9l-5.2 1.6L12 16l-1.8-5.4L5 9l5.2-1.6L12 2zm7 12l.9 2.6L22.5 17l-2.6.9L19 20.5l-.9-2.6L15.5 17l2.6-.9L19 14zM5 14l.9 2.6L8.5 17l-2.6.9L5 20.5l-.9-2.6L1.5 17l2.6-.9L5 14z" />
    </svg>
  );
}

/** 라벨 설정값을 받아 실제 화면 요소로 그린다. 스타일·위치·크기 조합으로 수십 가지 조건을 만들 수 있다. */
export function DisclosureLabel({ label }: { label: LabelConfig }) {
  if (!label.enabled) return null;
  const isBar = label.position === "top-bar" || label.position === "bottom-bar" || label.position === "below-image";
  const iconSize = label.size === "sm" ? "h-3 w-3" : label.size === "md" ? "h-4 w-4" : "h-5 w-5";

  let tone = "";
  if (label.style === "subtle") tone = "bg-black/45 text-white/90 rounded";
  if (label.style === "badge") tone = "bg-white text-neutral-900 border border-neutral-300 rounded-md font-semibold shadow";
  if (label.style === "banner") tone = "bg-amber-50 text-amber-900 border-y border-amber-300 font-semibold";

  const placement = isBar ? "w-full justify-center" : CORNER[label.position as keyof typeof CORNER];

  return (
    <div className={`flex items-center ${placement} ${SIZE[label.size]} ${tone}`} data-label-position={label.position}>
      {label.show_icon && <SparkIcon className={`${iconSize} shrink-0`} />}
      <span className="leading-tight">
        <span>{label.text}</span>
        {label.description && (
          <span className="block font-normal opacity-85">{label.description}</span>
        )}
      </span>
    </div>
  );
}
