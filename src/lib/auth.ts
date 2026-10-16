import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createHash, timingSafeEqual } from "node:crypto";

export const ADMIN_COOKIE = "adl_admin";

export function adminSessionValue(): string {
  const pw = process.env.ADMIN_PASSWORD ?? "";
  return createHash("sha256").update(`adl-admin:${pw}`).digest("hex");
}

export function checkPassword(input: string): boolean {
  const expected = process.env.ADMIN_PASSWORD ?? "";
  if (!expected) return false;
  const a = Buffer.from(input);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function isAdmin(): Promise<boolean> {
  if (!process.env.ADMIN_PASSWORD) return false;
  const jar = await cookies();
  return jar.get(ADMIN_COOKIE)?.value === adminSessionValue();
}

/** 서버 액션·페이지 안에서 호출. 미인증이면 로그인 페이지로 보낸다. */
export async function requireAdmin(): Promise<void> {
  if (!(await isAdmin())) redirect("/admin/login");
}
