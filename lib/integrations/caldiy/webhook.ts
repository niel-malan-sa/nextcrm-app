import { createHmac, timingSafeEqual } from "crypto";
import { z } from "zod";
import { prismadb } from "@/lib/prisma";

const CALDIY_SOURCE = "caldiy";

const bookingAttendeeSchema = z
  .object({
    email: z.string().email().optional(),
    name: z.string().optional().nullable(),
    timeZone: z.string().optional().nullable(),
  })
  .passthrough();

const bookingPayloadSchema = z
  .object({
    uid: z.string().optional().nullable(),
    bookingUid: z.string().optional().nullable(),
    bookingId: z.union([z.string(), z.number()]).optional().nullable(),
    title: z.string().optional().nullable(),
    eventTitle: z.string().optional().nullable(),
    startTime: z.string().datetime().optional().nullable(),
    endTime: z.string().datetime().optional().nullable(),
    length: z.number().optional().nullable(),
    status: z.string().optional().nullable(),
    cancellationReason: z.string().optional().nullable(),
    rescheduleUid: z.string().optional().nullable(),
    attendees: z.array(bookingAttendeeSchema).optional().nullable(),
    organizer: z
      .object({
        email: z.string().email().optional(),
        name: z.string().optional().nullable(),
      })
      .passthrough()
      .optional()
      .nullable(),
  })
  .passthrough();

const webhookEnvelopeSchema = z
  .object({
    triggerEvent: z.string(),
    createdAt: z.string().optional(),
    payload: bookingPayloadSchema,
  })
  .passthrough();

type BookingPayload = z.infer<typeof bookingPayloadSchema>;
type WebhookEnvelope = z.infer<typeof webhookEnvelopeSchema>;

type ActivityStatus = "scheduled" | "completed" | "cancelled";

type CalDiyWebhookResult =
  | { ok: true; action: "created" | "updated" | "ignored"; activityId?: string; bookingUid?: string }
  | { ok: false; error: string };

const TRIGGER_STATUS: Record<string, ActivityStatus | undefined> = {
  BOOKING_CREATED: "scheduled",
  BOOKING_REQUESTED: "scheduled",
  BOOKING_RESCHEDULED: "scheduled",
  BOOKING_CONFIRMED: "scheduled",
  BOOKING_CANCELLED: "cancelled",
  BOOKING_REJECTED: "cancelled",
  BOOKING_COMPLETED: "completed",
  BOOKING_NO_SHOW: "completed",
  BOOKING_NO_SHOW_UPDATED: "completed",
};

export function verifyCalDiyWebhookSignature(body: string, signature: string | null): boolean {
  const secret = process.env.CALDIY_WEBHOOK_SECRET;
  if (!secret || !signature) return false;

  const normalizedSignature = signature.startsWith("sha256=")
    ? signature.slice("sha256=".length)
    : signature;
  const expected = createHmac("sha256", secret).update(body).digest("hex");

  try {
    const expectedBuffer = Buffer.from(expected, "hex");
    const receivedBuffer = Buffer.from(normalizedSignature, "hex");
    return expectedBuffer.length === receivedBuffer.length && timingSafeEqual(expectedBuffer, receivedBuffer);
  } catch {
    return false;
  }
}

function getBookingUid(payload: BookingPayload): string | null {
  return payload.uid ?? payload.bookingUid ?? null;
}

function getPrimaryAttendee(payload: BookingPayload) {
  return payload.attendees?.find((attendee) => attendee.email) ?? null;
}

function getDurationMinutes(payload: BookingPayload): number | undefined {
  if (typeof payload.length === "number" && Number.isFinite(payload.length)) return payload.length;
  if (!payload.startTime || !payload.endTime) return undefined;

  const start = new Date(payload.startTime).getTime();
  const end = new Date(payload.endTime).getTime();
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return undefined;

  return Math.round((end - start) / 60000);
}

function buildTitle(payload: BookingPayload): string {
  return payload.title ?? payload.eventTitle ?? "Cal.diy booking";
}

function buildDescription(envelope: WebhookEnvelope): string | undefined {
  const attendee = getPrimaryAttendee(envelope.payload);
  const parts = [
    attendee?.email ? `Attendee: ${attendee.name ? `${attendee.name} <${attendee.email}>` : attendee.email}` : null,
    envelope.payload.organizer?.email ? `Organizer: ${envelope.payload.organizer.email}` : null,
    envelope.payload.cancellationReason ? `Cancellation reason: ${envelope.payload.cancellationReason}` : null,
    `Cal.diy trigger: ${envelope.triggerEvent}`,
  ].filter(Boolean);

  return parts.length > 0 ? parts.join("\n") : undefined;
}

function buildMetadata(envelope: WebhookEnvelope, bookingUid: string, previousMetadata?: unknown) {
  const existing =
    previousMetadata && typeof previousMetadata === "object" && !Array.isArray(previousMetadata)
      ? (previousMetadata as Record<string, unknown>)
      : {};
  const attendee = getPrimaryAttendee(envelope.payload);

  return {
    ...existing,
    [CALDIY_SOURCE]: {
      bookingUid,
      bookingId: envelope.payload.bookingId ?? null,
      triggerEvent: envelope.triggerEvent,
      status: envelope.payload.status ?? null,
      attendeeEmail: attendee?.email ?? null,
      organizerEmail: envelope.payload.organizer?.email ?? null,
      rescheduleUid: envelope.payload.rescheduleUid ?? null,
      lastWebhookAt: envelope.createdAt ?? new Date().toISOString(),
    },
  };
}

async function findMatchingContact(email: string | null) {
  if (!email) return null;

  return (prismadb as any).crm_Contacts.findFirst({
    where: {
      deletedAt: null,
      OR: [{ email }, { personal_email: email }],
    },
    orderBy: { created_on: "desc" },
    select: { id: true, assigned_to: true, createdBy: true },
  });
}

async function findExistingActivity(bookingUid: string) {
  return (prismadb as any).crm_Activities.findFirst({
    where: {
      deletedAt: null,
      metadata: { path: [CALDIY_SOURCE, "bookingUid"], equals: bookingUid },
    },
    include: { links: true },
  });
}

async function ensureContactLink(activityId: string, contactId: string) {
  const existing = await (prismadb as any).crm_ActivityLinks.findFirst({
    where: { activityId, entityType: "contact", entityId: contactId },
  });
  if (existing) return;

  await (prismadb as any).crm_ActivityLinks.create({
    data: { activityId, entityType: "contact", entityId: contactId },
  });
}

export async function processCalDiyWebhook(body: string): Promise<CalDiyWebhookResult> {
  const parsedJson = JSON.parse(body) as unknown;
  const envelope = webhookEnvelopeSchema.parse(parsedJson);
  const status = TRIGGER_STATUS[envelope.triggerEvent];
  if (!status) return { ok: true, action: "ignored" };

  const bookingUid = getBookingUid(envelope.payload);
  if (!bookingUid) return { ok: true, action: "ignored" };

  const start = envelope.payload.startTime ? new Date(envelope.payload.startTime) : null;
  const existing = await findExistingActivity(bookingUid);

  if (!existing && !start) {
    return { ok: true, action: "ignored", bookingUid };
  }

  const attendee = getPrimaryAttendee(envelope.payload);
  const contact = await findMatchingContact(attendee?.email ?? null);
  const ownerId = contact?.assigned_to ?? contact?.createdBy ?? null;
  const metadata = buildMetadata(envelope, bookingUid, existing?.metadata);

  if (existing) {
    const updated = await (prismadb as any).crm_Activities.update({
      where: { id: existing.id },
      data: {
        title: buildTitle(envelope.payload),
        description: buildDescription(envelope),
        ...(start && { date: start }),
        duration: getDurationMinutes(envelope.payload),
        outcome: envelope.payload.cancellationReason ?? undefined,
        status,
        metadata,
        ...(ownerId && { updatedBy: ownerId }),
      },
    });

    if (contact?.id) await ensureContactLink(updated.id, contact.id);
    return { ok: true, action: "updated", activityId: updated.id, bookingUid };
  }

  const created = await (prismadb as any).crm_Activities.create({
    data: {
      type: "meeting",
      title: buildTitle(envelope.payload),
      description: buildDescription(envelope),
      date: start,
      duration: getDurationMinutes(envelope.payload),
      outcome: envelope.payload.cancellationReason ?? undefined,
      status,
      metadata,
      ...(ownerId && { createdBy: ownerId, updatedBy: ownerId }),
    },
  });

  if (contact?.id) await ensureContactLink(created.id, contact.id);
  return { ok: true, action: "created", activityId: created.id, bookingUid };
}
