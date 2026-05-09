import { CalendarClock } from "lucide-react";
import Container from "../components/ui/Container";
import BookingWidget from "@/components/booking-calendar/booking-widget";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function SchedulingPage({
  searchParams,
}: {
  searchParams?: Promise<{ eventTypeId?: string; length?: string }>;
}) {
  const params = await searchParams;
  const eventTypeId = params?.eventTypeId || process.env.CALDIY_EVENT_TYPE_ID || "";
  const eventLength = Number(params?.length || process.env.CALDIY_EVENT_LENGTH_MINUTES || 30);
  const calBaseUrl = process.env.CALDIY_BASE_URL || "Not configured";

  return (
    <Container
      title="Scheduling UX comparison"
      description="Compare the lightweight booking-calendar add-on against the Cal.diy hosted booking page."
    >
      <div className="mb-6 grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <CalendarClock className="h-4 w-4" />
              booking-calendar add-on
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>Embedded NextCRM comparison UI using Cal.diy/Cal.com v2 API routes.</p>
            <Badge variant="secondary">comparison-only</Badge>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Backend source</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p className="break-all">{calBaseUrl}</p>
            <p>Cal.diy remains the scheduler source of truth; webhooks sync activity back to CRM.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Event type</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>{eventTypeId || "Not configured"}</p>
            <p>Override with `?eventTypeId=&lt;id&gt;&length=30` for quick comparisons.</p>
          </CardContent>
        </Card>
      </div>

      {!eventTypeId ? (
        <Alert>
          <AlertTitle>Cal.diy event type is not configured</AlertTitle>
          <AlertDescription>
            Set `CALDIY_EVENT_TYPE_ID` in NextCRM or open this page with `?eventTypeId=&lt;id&gt;` after Cal.diy is deployed.
          </AlertDescription>
        </Alert>
      ) : (
        <div className="rounded-2xl border bg-card p-4 shadow-sm">
          <BookingWidget
            eventTypeId={eventTypeId}
            eventLength={Number.isFinite(eventLength) ? eventLength : 30}
            title="Book a pilot meeting"
            description="This embedded widget is for UX/UI comparison against the native Cal.diy booking page."
            showHeader
          />
        </div>
      )}
    </Container>
  );
}
