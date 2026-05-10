import { NextRequest, NextResponse } from "next/server";
import { prismadb } from "@/lib/prisma";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const proposal = await prismadb.crm_Proposals.findFirst({ where: { publicToken: token, deletedAt: null } });
  if (!proposal) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prismadb.crm_Proposals.update({
    where: { id: proposal.id },
    data: {
      acceptedAt: new Date(),
      status: "ACCEPTED",
      viewedAt: proposal.viewedAt || new Date(),
    },
  });

  return NextResponse.json({ ok: true });
}
