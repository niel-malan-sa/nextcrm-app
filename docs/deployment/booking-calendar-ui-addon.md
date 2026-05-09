# booking-calendar UI add-on

## Purpose

This adds a comparison-only scheduling UI at `/scheduling` so operators can compare the embedded `booking-calendar` experience against the native Cal.diy hosted booking page after Cal.diy is deployed.

## Source

- Donor repo: `https://github.com/vladimir-siedykh/booking-calendar`
- Donor commit inspected: `a88f7293d48e1d1d07eafed991f4bb1b28986cd7`
- License: MIT

## Runtime contract

The add-on does not own scheduling state. It calls Cal.diy or a Cal.com-compatible v2 API through authenticated NextCRM proxy routes:

- `GET /api/booking-calendar/slots`
- `POST /api/booking-calendar/book`
- `POST /api/booking-calendar/reschedule`
- `POST /api/booking-calendar/cancel`
- `GET /api/booking-calendar/event-types`

NextCRM's existing Cal.diy webhook receiver remains the source for CRM activity sync.

## Env

```env
CALDIY_BASE_URL=https://calendar.example.com
CALDIY_API_URL=https://calendar.example.com/api/v2
CALDIY_API_KEY=cal_...
CALDIY_EVENT_TYPE_ID=123
CALDIY_EVENT_LENGTH_MINUTES=30
```

`CALDIY_API_URL` can be omitted if Cal.diy serves v2 API at `${CALDIY_BASE_URL}/api/v2`.

## Safety boundaries

- The page is behind the existing NextCRM authenticated app layout.
- Proxy routes require a NextCRM session.
- No opportunity stage movement is done by the widget.
- No CRM activity is written directly by the widget; webhook reconciliation owns that path.
- Do not expose this as a public booking page without adding public abuse controls and tenant-aware booking policy.
