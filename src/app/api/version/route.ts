import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/** 배포된 커밋 확인용 (Vercel 이 주입하는 환경변수) */
export function GET() {
  return NextResponse.json({
    sha: process.env.VERCEL_GIT_COMMIT_SHA ?? null,
    ref: process.env.VERCEL_GIT_COMMIT_REF ?? null,
  });
}
