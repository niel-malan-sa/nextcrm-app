import { prismadb } from "@/lib/prisma";

export const getProposal = async (proposalId: string) => {
  return prismadb.crm_Proposals.findFirst({
    where: { id: proposalId, deletedAt: null },
    include: {
      opportunity: {
        include: {
          assigned_account: {
            select: { name: true },
          },
          lineItems: {
            orderBy: { sort_order: "asc" },
          },
        },
      },
      account: {
        select: {
          id: true,
          name: true,
        },
      },
      lineItems: {
        orderBy: { sortOrder: "asc" },
      },
      versions: {
        orderBy: { version: "desc" },
      },
    },
  });
};

export const getProposalByToken = async (publicToken: string) => {
  return prismadb.crm_Proposals.findFirst({
    where: { publicToken, deletedAt: null },
    include: {
      account: {
        select: { name: true },
      },
      opportunity: {
        select: {
          name: true,
          assigned_account: {
            select: { name: true },
          },
        },
      },
      lineItems: {
        orderBy: { sortOrder: "asc" },
      },
    },
  });
};
