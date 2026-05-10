-- CreateEnum
CREATE TYPE "crm_Proposal_Status" AS ENUM ('DRAFT', 'READY', 'SENT', 'VIEWED', 'ACCEPTED', 'SIGNED', 'ARCHIVED');

-- CreateTable
CREATE TABLE "crm_Proposals" (
    "id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT,
    "templateKey" TEXT NOT NULL DEFAULT 'consulting',
    "status" "crm_Proposal_Status" NOT NULL DEFAULT 'DRAFT',
    "publicToken" TEXT NOT NULL,
    "currency" VARCHAR(3) NOT NULL,
    "sections" JSONB NOT NULL,
    "brandJson" JSONB,
    "metadataJson" JSONB,
    "subtotal" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "discountTotal" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "taxTotal" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "opportunityId" UUID,
    "accountId" UUID,
    "sentAt" TIMESTAMP(3),
    "viewedAt" TIMESTAMP(3),
    "acceptedAt" TIMESTAMP(3),
    "signedAt" TIMESTAMP(3),
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" UUID,
    "updatedBy" UUID,
    "deletedAt" TIMESTAMP(3),
    "deletedBy" UUID,

    CONSTRAINT "crm_Proposals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crm_Proposal_Line_Items" (
    "id" UUID NOT NULL,
    "proposalId" UUID NOT NULL,
    "productId" UUID,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unitPrice" DECIMAL(18,2) NOT NULL,
    "discountValue" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "lineTotal" DECIMAL(18,2) NOT NULL,
    "currency" VARCHAR(3) NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" UUID,
    "updatedBy" UUID,

    CONSTRAINT "crm_Proposal_Line_Items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crm_Proposal_Versions" (
    "id" UUID NOT NULL,
    "proposalId" UUID NOT NULL,
    "version" INTEGER NOT NULL,
    "snapshot" JSONB NOT NULL,
    "html" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" UUID,

    CONSTRAINT "crm_Proposal_Versions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "crm_Proposals_publicToken_key" ON "crm_Proposals"("publicToken");
CREATE INDEX "crm_Proposals_opportunityId_idx" ON "crm_Proposals"("opportunityId");
CREATE INDEX "crm_Proposals_accountId_idx" ON "crm_Proposals"("accountId");
CREATE INDEX "crm_Proposals_status_idx" ON "crm_Proposals"("status");
CREATE INDEX "crm_Proposals_publicToken_idx" ON "crm_Proposals"("publicToken");
CREATE INDEX "crm_Proposals_createdAt_idx" ON "crm_Proposals"("createdAt");
CREATE INDEX "crm_Proposals_deletedAt_idx" ON "crm_Proposals"("deletedAt");
CREATE INDEX "crm_Proposal_Line_Items_proposalId_idx" ON "crm_Proposal_Line_Items"("proposalId");
CREATE INDEX "crm_Proposal_Line_Items_productId_idx" ON "crm_Proposal_Line_Items"("productId");
CREATE UNIQUE INDEX "crm_Proposal_Versions_proposalId_version_key" ON "crm_Proposal_Versions"("proposalId", "version");
CREATE INDEX "crm_Proposal_Versions_proposalId_idx" ON "crm_Proposal_Versions"("proposalId");
CREATE INDEX "crm_Proposal_Versions_createdAt_idx" ON "crm_Proposal_Versions"("createdAt");

-- AddForeignKey
ALTER TABLE "crm_Proposals" ADD CONSTRAINT "crm_Proposals_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "crm_Opportunities"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "crm_Proposals" ADD CONSTRAINT "crm_Proposals_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "crm_Accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "crm_Proposals" ADD CONSTRAINT "crm_Proposals_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "crm_Proposals" ADD CONSTRAINT "crm_Proposals_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "crm_Proposal_Line_Items" ADD CONSTRAINT "crm_Proposal_Line_Items_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "crm_Proposals"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "crm_Proposal_Line_Items" ADD CONSTRAINT "crm_Proposal_Line_Items_productId_fkey" FOREIGN KEY ("productId") REFERENCES "crm_Products"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "crm_Proposal_Line_Items" ADD CONSTRAINT "crm_Proposal_Line_Items_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "crm_Proposal_Line_Items" ADD CONSTRAINT "crm_Proposal_Line_Items_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "crm_Proposal_Versions" ADD CONSTRAINT "crm_Proposal_Versions_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "crm_Proposals"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "crm_Proposal_Versions" ADD CONSTRAINT "crm_Proposal_Versions_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
