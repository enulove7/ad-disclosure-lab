import { NextResponse } from "next/server";
import { getStore } from "@/lib/db";
import { isAdmin } from "@/lib/auth";
import { buildLongCsv, buildWideCsv } from "@/lib/export";

export const dynamic = "force-dynamic";

export async function GET(req: Request, ctx: RouteContext<"/admin/[id]/export">) {
  if (!(await isAdmin())) return new NextResponse("unauthorized", { status: 401 });
  const { id } = await ctx.params;
  const format = new URL(req.url).searchParams.get("format") === "wide" ? "wide" : "long";
  const store = getStore();
  const exp = await store.getExperiment(id);
  if (!exp) return new NextResponse("not found", { status: 404 });

  const [conditions, ads, items, participants, exposures, responses] = await Promise.all([
    store.listConditions(id),
    store.listAds(id),
    store.listItems(id),
    store.listParticipants(id),
    store.listExposuresByExperiment(id),
    store.listResponsesByExperiment(id),
  ]);
  const data = { conditions, ads, items, participants, exposures, responses };
  const csv = format === "wide" ? buildWideCsv(data) : buildLongCsv(data);
  const name = `${exp.slug}_${format}_${new Date().toISOString().slice(0, 10)}.csv`;
  // BOM을 붙여 Excel(일본어 환경)에서 바로 열리게 한다
  return new NextResponse("﻿" + csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${name}"`,
    },
  });
}
