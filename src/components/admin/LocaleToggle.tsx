import { LOCALES, LOCALE_NAMES, type Locale } from "@/lib/i18n";
import { setAdminLocaleAction } from "@/app/admin/actions";

/** 관리자 화면 언어 토글. 선택 즉시 쿠키에 저장하고 같은 페이지로 돌아온다. */
export function LocaleToggle({ current, back }: { current: Locale; back: string }) {
  return (
    <div className="flex overflow-hidden rounded-md border border-neutral-300 text-xs">
      {LOCALES.map((l) => (
        <form key={l} action={setAdminLocaleAction}>
          <input type="hidden" name="locale" value={l} />
          <input type="hidden" name="back" value={back} />
          <button
            type="submit"
            className={`px-2 py-1 ${l === current ? "bg-neutral-900 text-white" : "bg-white text-neutral-600 hover:bg-neutral-100"}`}
            aria-pressed={l === current}
          >
            {LOCALE_NAMES[l]}
          </button>
        </form>
      ))}
    </div>
  );
}
