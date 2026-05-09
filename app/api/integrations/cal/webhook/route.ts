import { NextRequest, NextResponse } from "next/server";
import {
  processCalDiyWebhook,
  verifyCalDiyWebhookSignature,
} from "@/lib/integrations/caldiy/webhook";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("X-Cal-Signature-256");

  if (!verifyCalDiyWebhookSignature(body, signature)) {
    return NextResponse.json({ error: "Invalid Cal.diy webhook signature" }, { status: 401 });
  }

  try {
    const result = await processCalDiyWebhook(body);
    return NextResponse.json(result, { status: result.ok ? 200 : 400 });
  } catch (error) {
    console.error("Cal.diy webhook error:", error);
    return NextResponse.json({ error: "Invalid Cal.diy webhook payload" }, { status: 400 });
  }
}
