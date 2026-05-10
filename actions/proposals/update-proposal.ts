"use server";

import { getSession } from "@/lib/auth-server";
import { prismadb } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import {
  calcLineItemTotal,
  calcProposalSubtotal,
  ProposalBrand,
  ProposalLineItem,
  ProposalSection,
  ProposalTemplateKey,
} from "@/lib/proposals";
import { crm_Proposal_Status } from "@prisma/client";

export const updateProposal = async (data: {
  id: string;
  title?: string;
  summary?: string;
  templateKey?: ProposalTemplateKey;
  status?: crm_Proposal_Status;
  brand?: ProposalBrand;
  sections?: ProposalSection[];
  lineItems?: ProposalLineItem[];
  lockVersion?: boolean;
}) => {
  const session = await getSession();
  if (!session) return { error: "Unauthorized" };

  const existing = await prismadb.crm_Proposals.findFirst({
    where: { id: data.id, deletedAt: null },
    include: { versions: { orderBy: { version: "desc" }, take: 1 } },
  });

  if (!existing) return { error: "Proposal not found" };

  const sections = data.sections ?? (existing.sections as ProposalSection[]);
  const brand = data.brand ?? (existing.brandJson as ProposalBrand | null) ?? undefined;
  const lineItems =
    data.lineItems ??
    (await prismadb.crm_Proposal_Line_Items.findMany({
      where: { proposalId: existing.id },
      orderBy: { sortOrder: "asc" },
    })).map((item) => ({
      id: item.id,
      name: item.name,
      description: item.description,
      quantity: item.quantity,
      unitPrice: Number(item.unitPrice),
      discountValue: Number(item.discountValue),
      lineTotal: Number(item.lineTotal),
      currency: item.currency,
      sortOrder: item.sortOrder,
    }));
  const subtotal = calcProposalSubtotal(lineItems);
  const nextVersion = (existing.versions[0]?.version ?? 0) + 1;

  try {
    const proposal = await prismadb.crm_Proposals.update({
      where: { id: existing.id },
      data: {
        title: data.title ?? existing.title,
        summary: data.summary ?? existing.summary,
        templateKey: data.templateKey ?? existing.templateKey,
        status: data.status ?? existing.status,
        brandJson: brand as any,
        sections: sections as any,
        subtotal,
        discountTotal: 0,
        taxTotal: 0,
        total: subtotal,
        updatedBy: session.user.id,
        publishedAt: data.status === "SENT" && !existing.publishedAt ? new Date() : existing.publishedAt,
        sentAt: data.status === "SENT" && !existing.sentAt ? new Date() : existing.sentAt,
        lineItems: {
          deleteMany: {},
          create: lineItems.map((item, index) => ({
            name: item.name,
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            discountValue: item.discountValue ?? 0,
            lineTotal: calcLineItemTotal(item),
            currency: item.currency,
            sortOrder: item.sortOrder ?? index,
            createdBy: session.user.id,
            updatedBy: session.user.id,
          })),
        },
        versions: data.lockVersion
          ? {
              create: {
                version: nextVersion,
                snapshot: {
                  title: data.title ?? existing.title,
                  summary: data.summary ?? existing.summary,
                  templateKey: data.templateKey ?? existing.templateKey,
                  status: data.status ?? existing.status,
                  sections,
                  brand,
                  lineItems,
                },
                createdBy: session.user.id,
              },
            }
          : undefined,
      },
      include: {
        lineItems: true,
        versions: true,
      },
    });

    revalidatePath("/[locale]/(routes)/crm/proposals/[proposalId]", "page");
    revalidatePath("/[locale]/(routes)/crm/proposals", "page");
    if (proposal.opportunityId) {
      revalidatePath("/[locale]/(routes)/crm/opportunities/[opportunityId]", "page");
    }
    revalidatePath("/[locale]/proposal/[token]", "page");

    return { data: proposal };
  } catch (error) {
    console.error("[UPDATE_PROPOSAL]", error);
    return { error: "Failed to update proposal" };
  }
};
