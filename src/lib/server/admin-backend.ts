import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function adminBackendBase() {
  return (process.env.INTERNAL_API_URL || process.env.API_URL || "http://chifaglow_backend:8000").replace(/\/$/, "");
}

export function adminAuthHeaders(req: NextRequest): HeadersInit {
  const cookie = req.headers.get("cookie") || "";
  const authHeader = req.headers.get("authorization") || "";
  return {
    ...(cookie ? { cookie } : {}),
    ...(authHeader ? { authorization: authHeader } : {}),
  };
}

export async function proxyAdminJson(req: NextRequest, path: string) {
  const targetUrl = `${adminBackendBase()}${path}`;
  const body = (await req.text()).trim() || "{}";
  const backendRes = await fetch(targetUrl, {
    method: "POST",
    cache: "no-store",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...adminAuthHeaders(req),
    },
    body,
  });
  const rawText = await backendRes.text();
  let data: unknown;
  try {
    data = JSON.parse(rawText);
  } catch {
    data = { raw: rawText };
  }
  const payload = data && typeof data === "object" && !Array.isArray(data) ? (data as Record<string, unknown>) : { backend_response: data };
  return NextResponse.json(
    { ...payload, proxied_status: backendRes.status, target_url: targetUrl },
    { status: backendRes.status },
  );
}

export async function proxyAdminBody(req: NextRequest, path: string, accept: string) {
  const targetUrl = `${adminBackendBase()}${path}`;
  const body = await req.text();
  const backendRes = await fetch(targetUrl, {
    method: "POST",
    cache: "no-store",
    headers: {
      Accept: accept,
      "Content-Type": "application/json",
      ...adminAuthHeaders(req),
    },
    body,
  });
  const contentType = backendRes.headers.get("content-type") || "";
  if (contentType.includes("application/json") || backendRes.status >= 400) {
    const rawText = await backendRes.text();
    try {
      return NextResponse.json(JSON.parse(rawText), { status: backendRes.status });
    } catch {
      return NextResponse.json({ success: false, detail: rawText || "proxy_failed" }, { status: backendRes.status });
    }
  }
  const buf = await backendRes.arrayBuffer();
  const headers = new Headers();
  headers.set("Content-Type", contentType || "application/octet-stream");
  const disposition = backendRes.headers.get("content-disposition");
  if (disposition) headers.set("Content-Disposition", disposition);
  return new NextResponse(buf, { status: backendRes.status, headers });
}
