import { NextRequest, NextResponse } from "next/server";
import { calApiFetch, getRequiredSearchParam, requireBookingCalendarSession } from "@/lib/booking-calendar/server";

export async function GET(request: NextRequest) {
  const { response: unauthorized } = await requireBookingCalendarSession();
  if (unauthorized) return unauthorized;

  const eventTypeId = getRequiredSearchParam(request, "eventTypeId");
  const dateFrom = getRequiredSearchParam(request, "dateFrom");
  const dateTo = getRequiredSearchParam(request, "dateTo");

  if (!eventTypeId || !dateFrom || !dateTo) {
    return NextResponse.json(
      { error: "Missing required parameters: eventTypeId, dateFrom, dateTo" },
      { status: 400 }
    );
  }

  const startTime = new Date(`${dateFrom}T00:00:00.000Z`).toISOString();
  const endTime = new Date(`${dateTo}T23:59:59.999Z`).toISOString();
  const params = new URLSearchParams({ eventTypeId, start: startTime, end: endTime });

  const response = await calApiFetch(`/slots?${params.toString()}`, { method: "GET" }, "2024-09-04");
  const data = await response.json();

  if (response.ok && data?.status === "success" && data.data) {
    return NextResponse.json(data.data);
  }

  return NextResponse.json(data, { status: response.status });
}
