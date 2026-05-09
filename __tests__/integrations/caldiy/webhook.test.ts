jest.mock("@/lib/prisma", () => ({
  prismadb: {
    crm_Contacts: { findFirst: jest.fn() },
    crm_Activities: { findFirst: jest.fn(), create: jest.fn(), update: jest.fn() },
    crm_ActivityLinks: { findFirst: jest.fn(), create: jest.fn() },
  },
}));

import { createHmac } from "crypto";
import { prismadb } from "@/lib/prisma";
import { processCalDiyWebhook, verifyCalDiyWebhookSignature } from "@/lib/integrations/caldiy/webhook";

const body = JSON.stringify({
  triggerEvent: "BOOKING_CREATED",
  createdAt: "2026-05-09T10:00:00.000Z",
  payload: {
    uid: "bkg_123",
    bookingId: 123,
    title: "Discovery call",
    startTime: "2026-05-10T09:00:00.000Z",
    endTime: "2026-05-10T09:30:00.000Z",
    attendees: [{ email: "buyer@example.com", name: "Buyer" }],
    organizer: { email: "sales@example.com" },
  },
});

describe("Cal.diy webhook integration", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.CALDIY_WEBHOOK_SECRET = "test-secret";
    (prismadb.crm_Contacts.findFirst as jest.Mock).mockResolvedValue(null);
    (prismadb.crm_Activities.findFirst as jest.Mock).mockResolvedValue(null);
    (prismadb.crm_ActivityLinks.findFirst as jest.Mock).mockResolvedValue(null);
    (prismadb.crm_Activities.create as jest.Mock).mockResolvedValue({ id: "activity-1" });
    (prismadb.crm_Activities.update as jest.Mock).mockResolvedValue({ id: "activity-1" });
  });

  afterEach(() => {
    delete process.env.CALDIY_WEBHOOK_SECRET;
  });

  it("verifies Cal.diy HMAC signatures", () => {
    const signature = createHmac("sha256", "test-secret").update(body).digest("hex");

    expect(verifyCalDiyWebhookSignature(body, signature)).toBe(true);
    expect(verifyCalDiyWebhookSignature(body, `sha256=${signature}`)).toBe(true);
    expect(verifyCalDiyWebhookSignature(body, "bad-signature")).toBe(false);
  });

  it("creates a scheduled meeting activity and links the matching contact", async () => {
    (prismadb.crm_Contacts.findFirst as jest.Mock).mockResolvedValue({
      id: "contact-1",
      assigned_to: "user-1",
      createdBy: null,
    });

    const result = await processCalDiyWebhook(body);

    expect(result).toEqual({ ok: true, action: "created", activityId: "activity-1", bookingUid: "bkg_123" });
    expect(prismadb.crm_Activities.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        type: "meeting",
        title: "Discovery call",
        date: new Date("2026-05-10T09:00:00.000Z"),
        duration: 30,
        status: "scheduled",
        createdBy: "user-1",
        updatedBy: "user-1",
        metadata: expect.objectContaining({
          caldiy: expect.objectContaining({ bookingUid: "bkg_123", attendeeEmail: "buyer@example.com" }),
        }),
      }),
    });
    expect(prismadb.crm_ActivityLinks.create).toHaveBeenCalledWith({
      data: { activityId: "activity-1", entityType: "contact", entityId: "contact-1" },
    });
  });

  it("updates the existing activity for duplicate or lifecycle webhooks", async () => {
    (prismadb.crm_Activities.findFirst as jest.Mock).mockResolvedValue({
      id: "activity-1",
      metadata: { caldiy: { bookingUid: "bkg_123" } },
      links: [],
    });

    const cancelBody = JSON.stringify({
      triggerEvent: "BOOKING_CANCELLED",
      createdAt: "2026-05-09T10:05:00.000Z",
      payload: {
        uid: "bkg_123",
        title: "Discovery call",
        startTime: "2026-05-10T09:00:00.000Z",
        endTime: "2026-05-10T09:30:00.000Z",
        cancellationReason: "No longer needed",
        attendees: [{ email: "buyer@example.com" }],
      },
    });

    const result = await processCalDiyWebhook(cancelBody);

    expect(result).toEqual(expect.objectContaining({ ok: true, action: "updated" }));
    expect(prismadb.crm_Activities.create).not.toHaveBeenCalled();
    expect(prismadb.crm_Activities.update).toHaveBeenCalledWith({
      where: { id: "activity-1" },
      data: expect.objectContaining({
        status: "cancelled",
        outcome: "No longer needed",
        metadata: expect.objectContaining({
          caldiy: expect.objectContaining({ triggerEvent: "BOOKING_CANCELLED" }),
        }),
      }),
    });
  });

  it("ignores unsupported triggers and unmatched no-start payloads", async () => {
    await expect(
      processCalDiyWebhook(JSON.stringify({ triggerEvent: "FORM_SUBMITTED", payload: { uid: "form-1" } }))
    ).resolves.toEqual({ ok: true, action: "ignored" });

    await expect(
      processCalDiyWebhook(JSON.stringify({ triggerEvent: "BOOKING_NO_SHOW_UPDATED", payload: { bookingUid: "bkg_999" } }))
    ).resolves.toEqual({ ok: true, action: "ignored", bookingUid: "bkg_999" });
  });
});
