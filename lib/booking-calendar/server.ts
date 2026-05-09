import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-server";

export type CalApiVersion = "2024-06-14" | "2024-08-13" | "2024-09-04";

export async function requireBookingCalendarSession() {
  const session = await getSession();
  if (!session) {
    return { session: null, response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  return { session, response: null };
}

export function getCalApiConfig() {
  const apiKey = process.env.CALDIY_API_KEY || process.env.CALCOM_API_KEY;
  const explicitApiUrl = process.env.CALDIY_API_URL || process.env.CALCOM_API_URL;
  const baseUrl = process.env.CALDIY_BASE_URL;
  const apiUrl = explicitApiUrl || (baseUrl ? `${baseUrl.replace(/\/$/, "")}/api/v2` : undefined);

  if (!apiKey || !apiUrl) {
    return { ok: false as const, error: "Cal.diy API URL/key not configured" };
  }

  return { ok: true as const, apiKey, apiUrl: apiUrl.replace(/\/$/, "") };
}

export async function calApiFetch(path: string, init: RequestInit, version: CalApiVersion) {
  const config = getCalApiConfig();
  if (!config.ok) {
    return NextResponse.json({ error: config.error }, { status: 500 });
  }

  const response = await fetch(`${config.apiUrl}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.apiKey}`,
      "cal-api-version": version,
      ...(init.headers || {}),
    },
  });

  const text = await response.text();
  let payload: unknown = null;
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = { message: text };
    }
  }

  if (!response.ok) {
    console.error("Booking calendar Cal API error", {
      path,
      status: response.status,
      statusText: response.statusText,
    });
    return NextResponse.json(
      { error: "Cal.diy API request failed", status: response.status },
      { status: response.status }
    );
  }

  return NextResponse.json(payload ?? { ok: true });
}

export function getRequiredSearchParam(request: NextRequest, name: string) {
  return request.nextUrl.searchParams.get(name);
}
