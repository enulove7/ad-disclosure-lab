import "server-only";
import { cookies } from "next/headers";
import { asLocale, t, type Dict, type Locale } from "./i18n";
import type { Experiment } from "./types";

export const ADMIN_LOCALE_COOKIE = "adl_lang";

/** 관리자 화면 언어: 쿠키 → 기본 ko */
export async function getAdminLocale(): Promise<Locale> {
  const jar = await cookies();
  const v = jar.get(ADMIN_LOCALE_COOKIE)?.value;
  return v ? asLocale(v) : "ko";
}

export async function adminDict(): Promise<{ locale: Locale; d: Dict["a"] }> {
  const locale = await getAdminLocale();
  return { locale, d: t(locale).a };
}

/** 참가자 화면 언어: 실험 설정 */
export function experimentLocale(exp: Experiment): Locale {
  return asLocale(exp.settings?.locale);
}

export function participantDict(exp: Experiment): { locale: Locale; d: Dict["p"] } {
  const locale = experimentLocale(exp);
  return { locale, d: t(locale).p };
}
