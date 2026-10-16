import { NextResponse, type NextRequest } from "next/server";

const ADMIN_COOKIE = "adl_admin";

async function sha256Hex(input: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** /admin 하위 경로를 쿠키 기반으로 보호한다. 실제 검증은 각 서버 액션에서도 다시 한다. */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname === "/admin/login") return NextResponse.next();
  const pw = process.env.ADMIN_PASSWORD ?? "";
  const expected = pw ? await sha256Hex(`adl-admin:${pw}`) : "";
  const got = request.cookies.get(ADMIN_COOKIE)?.value;
  if (!pw || got !== expected) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = { matcher: ["/admin/:path*"] };
