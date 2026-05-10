"use server";

import { getSession } from "@/lib/auth-server";
import { prismadb } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import {
  calcLineItemTotal,
  calcProposalSubtotal,
  createDefaultLineItems,
  createEmptyBrand,
  createSectionsFromTemplate,
  ProposalTemplateKey,
} from "@/lib/proposals";

export const createProposal = async (data: {
  title?: string;
  summary?: string;
  opportunityId?: string;
  templateKey?: ProposalTemplateKey;
}) => {
  const session = await getSession();
  if (!session) return { error: "Unauthorized" };

  const templateKey = data.templateKey ?? "consulting";
  const opportunity = data.opportunityId
    ? await prismadb.crm_Opportunities.findFirst({
        where: { id: data.opportunityId, deletedAt: null },
        include: {
          assigned_account: {
            select: { id: true, name: true },
          },
          lineItems: {
            orderBy: { sort_order: "asc" },
          },
        },
      })
    : null;

  try {
    const opportunityLineItems = opportunity?.lineItems?.map((item) => ({
      name: item.name,
      description: item.description,
      quantity: item.quantity ?? 1,
      unitPrice: Number(item.unit_price ?? 0),
    }));

    const lineItems = createDefaultLineItems({
      name: opportunity?.name,
      currency: opportunity?.currency ?? "USD",
      items: opportunityLineItems,
    });

    const subtotal = calcProposalSubtotal(lineItems);
    const proposal = await prismadb.crm_Proposals.create({
      data: {
        title: data.title || opportunity?.name || "New proposal",
        summary: data.summary || opportunity?.description || null,
        templateKey,
        status: "DRAFT",
        currency: opportunity?.currency || "USD",
        sections: createSectionsFromTemplate(templateKey, {
          opportunityName: opportunity?.name,
          accountName: opportunity?.assigned_account?.name,
        }) as any,
        brandJson: createEmptyBrand(opportunity?.assigned_account?.name || "Your company") as any,
        metadataJson: {
          source: opportunity
            ? {
                opportunityId: opportunity.id,
                accountId: opportunity.account,
              }
            : null,
        },
        subtotal,
        discountTotal: 0,
        taxTotal: 0,
        total: subtotal,
        opportunityId: opportunity?.id,
        accountId: opportunity?.account || undefined,
        createdBy: session.user.id,
        updatedBy: session.user.id,
        lineItems: {
          create: lineItems.map((item) => ({
            name: item.name,
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            discountValue: item.discountValue ?? 0,
            lineTotal: calcLineItemTotal(item),
            currency: item.currency,
            sortOrder: item.sortOrder,
            createdBy: session.user.id,
            updatedBy: session.user.id,
          })),
        },
        versions: {
          create: {
            version: 1,
            snapshot: {
              title: data.title || opportunity?.name || "New proposal",
              summary: data.summary || opportunity?.description || null,
              templateKey,
              sections: createSectionsFromTemplate(templateKey, {
                opportunityName: opportunity?.name,
                accountName: opportunity?.assigned_account?.name,
              }),
              brand: createEmptyBrand(opportunity?.assigned_account?.name || "Your company"),
              lineItems,
            },
            createdBy: session.user.id,
          },
        },
      },
      include: {
        lineItems: true,
      },
    });

    if (opportunity?.id) {
      revalidatePath("/[locale]/(routes)/crm/opportunities/[opportunityId]", "page");
    }
    revalidatePath("/[locale]/(routes)/crm/proposals", "page");
    return { data: proposal };
  } catch (error) {
    console.error("[CREATE_PROPOSAL]", error);
    return { error: "Failed to create proposal" };
  }
};
