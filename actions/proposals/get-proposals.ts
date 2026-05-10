import { prismadb } from "@/lib/prisma";

export const getProposals = async () => {
  return prismadb.crm_Proposals.findMany({
    where: { deletedAt: null },
    include: {
      opportunity: {
        select: {
          id: true,
          name: true,
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
    },
    orderBy: { updatedAt: "desc" },
  });
};
