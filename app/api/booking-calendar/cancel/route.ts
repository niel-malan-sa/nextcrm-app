import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { calApiFetch, requireBookingCalendarSession } from "@/lib/booking-calendar/server";

const cancelRequestSchema = z.object({
  bookingUid: z.string().min(1),
  cancellationReason: z.string().optional(),
});

export async function POST(request: NextRequest) {
  const { response: unauthorized } = await requireBookingCalendarSession();
  if (unauthorized) return unauthorized;

  const parsed = cancelRequestSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid cancellation request" }, { status: 400 });
  }

  return calApiFetch(
    `/bookings/${encodeURIComponent(parsed.data.bookingUid)}/cancel`,
    {
      method: "POST",
      body: JSON.stringify({ cancellationReason: parsed.data.cancellationReason || "User requested cancellation" }),
    },
    "2024-08-13"
  );
}
