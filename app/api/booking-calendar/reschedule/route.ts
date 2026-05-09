import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { calApiFetch, requireBookingCalendarSession } from "@/lib/booking-calendar/server";

const rescheduleRequestSchema = z.object({
  bookingUid: z.string().min(1),
  start: z.string().datetime(),
  rescheduledBy: z.string().optional(),
  reschedulingReason: z.string().optional(),
});

export async function POST(request: NextRequest) {
  const { response: unauthorized } = await requireBookingCalendarSession();
  if (unauthorized) return unauthorized;

  const parsed = rescheduleRequestSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid reschedule request" }, { status: 400 });
  }

  return calApiFetch(
    `/bookings/${encodeURIComponent(parsed.data.bookingUid)}/reschedule`,
    {
      method: "POST",
      body: JSON.stringify({
        start: parsed.data.start,
        rescheduledBy: parsed.data.rescheduledBy || "User",
        reschedulingReason: parsed.data.reschedulingReason || "User requested reschedule",
      }),
    },
    "2024-08-13"
  );
}
