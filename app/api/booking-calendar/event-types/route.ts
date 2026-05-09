import { NextRequest } from "next/server";
import { calApiFetch, requireBookingCalendarSession } from "@/lib/booking-calendar/server";

export async function GET(_request: NextRequest) {
  const { response: unauthorized } = await requireBookingCalendarSession();
  if (unauthorized) return unauthorized;

  return calApiFetch("/event-types", { method: "GET" }, "2024-06-14");
}
