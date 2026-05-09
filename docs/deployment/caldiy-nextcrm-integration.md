# Cal.diy + NextCRM integration runbook

## Scope

This is the internal-pilot integration for `calcom/cal.diy`.

- Cal.diy remains the scheduling system of record.
- NextCRM receives Cal.diy booking lifecycle webhooks.
- NextCRM writes or updates `crm_Activities` with `type = meeting`.
- The integration does not share databases, auth sessions, or Prisma clients.

## NextCRM configuration

Set these in the NextCRM runtime environment:

```env
CALDIY_BASE_URL=https://calendar.example.com
CALDIY_WEBHOOK_SECRET=<same-secret-configured-in-caldiy-webhook>
CALDIY_API_KEY=<optional-read-only-reconciliation-key>
```

`CALDIY_WEBHOOK_SECRET` is required. The webhook route rejects requests unless the `X-Cal-Signature-256` HMAC matches the raw request body.

## Cal.diy webhook configuration

Create a Cal.diy webhook with:

- Subscriber URL: `https://<nextcrm-domain>/api/integrations/cal/webhook`
- Secret: same value as `CALDIY_WEBHOOK_SECRET`
- Triggers:
  - `BOOKING_CREATED`
  - `BOOKING_REQUESTED`
  - `BOOKING_RESCHEDULED`
  - `BOOKING_CONFIRMED`
  - `BOOKING_CANCELLED`
  - `BOOKING_REJECTED`
  - `BOOKING_COMPLETED`
  - `BOOKING_NO_SHOW`
  - `BOOKING_NO_SHOW_UPDATED`

## Data mapping

- Booking UID is stored at `crm_Activities.metadata.caldiy.bookingUid`.
- Duplicate lifecycle events update the existing activity instead of creating a new one.
- Attendee email is matched against `crm_Contacts.email` and `crm_Contacts.personal_email`.
- Matched contacts get a `crm_ActivityLinks` row with `entityType = contact`.
- Unmatched bookings still create an unlinked meeting activity when the webhook includes a start time.

## Deployment checks

1. Deploy NextCRM with `CALDIY_WEBHOOK_SECRET` set.
2. Deploy Cal.diy separately with its own database and production-grade secrets.
3. Configure the webhook in Cal.diy.
4. Create a test contact in NextCRM with the same email as the test booking attendee.
5. Create, reschedule, and cancel a Cal.diy booking.
6. Confirm one NextCRM meeting activity exists and changes status across lifecycle events.

## Rollback

- Disable or delete the webhook in Cal.diy.
- Redeploy the previous NextCRM image/commit if needed.
- Existing Cal.diy-created activities are normal CRM activity rows and can be soft-deleted from NextCRM if they were test data.


## Optional embedded UI comparison

NextCRM also includes a `booking-calendar` UI add-on at `/scheduling` for internal UX comparison. Configure `CALDIY_API_URL`, `CALDIY_API_KEY`, and `CALDIY_EVENT_TYPE_ID` after Cal.diy is deployed. The add-on does not replace the webhook sync; Cal.diy webhooks remain the CRM activity reconciliation path.
