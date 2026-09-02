import { NextResponse } from "next/server";
import { recordPageView } from "@/lib/server/page-views";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      kind?: string;
      product_slug?: string | null;
      path?: string | null;
    };
    const kind = body.kind === "product" ? "product" : body.kind === "store" ? "store" : null;
    if (!kind) return NextResponse.json({ ok: false, detail: "invalid_kind" }, { status: 400 });
    const saved = await recordPageView({
      kind,
      productSlug: body.product_slug,
      path: body.path,
    });
    return NextResponse.json({ ok: Boolean(saved) });
  } catch (err) {
    console.error("page_view_failed", err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
