import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { calApiFetch, requireBookingCalendarSession } from "@/lib/booking-calendar/server";

const bookingRequestSchema = z.object({
  eventTypeId: z.union([z.string(), z.number()]),
  start: z.string().datetime(),
  attendee: z.object({
    name: z.string().min(1),
    email: z.string().email(),
    timeZone: z.string().min(1),
  }),
  metadata: z.record(z.string(), z.string().optional()).optional(),
  guests: z.array(z.string().email()).optional(),
  bookingFieldsResponses: z.record(z.string(), z.string()).optional(),
});

export async function POST(request: NextRequest) {
  const { response: unauthorized } = await requireBookingCalendarSession();
  if (unauthorized) return unauthorized;

  const parsed = bookingRequestSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid booking request" }, { status: 400 });
  }

  const eventTypeId = Number(parsed.data.eventTypeId);
  if (!Number.isInteger(eventTypeId) || eventTypeId <= 0) {
    return NextResponse.json({ error: "Invalid eventTypeId" }, { status: 400 });
  }

  const notes = parsed.data.metadata?.notes || "No additional notes provided";
  const body = {
    start: parsed.data.start,
    attendee: {
      name: parsed.data.attendee.name,
      email: parsed.data.attendee.email,
      timeZone: parsed.data.attendee.timeZone,
      language: "en",
    },
    eventTypeId,
    bookingFieldsResponses: {
      name: parsed.data.attendee.name,
      email: parsed.data.attendee.email,
      notes,
      ...(parsed.data.metadata?.referralSource && {
        "discovery-method": parsed.data.metadata.referralSource,
      }),
    },
    ...(parsed.data.guests?.length ? { guests: parsed.data.guests } : {}),
  };

  return calApiFetch("/bookings", { method: "POST", body: JSON.stringify(body) }, "2024-08-13");
}
