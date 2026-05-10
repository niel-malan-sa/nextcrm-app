"use client";

import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { ProposalPreview } from "@/app/[locale]/(routes)/crm/proposals/components/ProposalPreview";
import { createEmptyBrand } from "@/lib/proposals";

export function PublicProposalClient({
  proposal,
  locale,
}: {
  proposal: any;
  locale: string;
}) {
  const [accepted, setAccepted] = useState(Boolean(proposal.acceptedAt));
  const viewedOnce = useRef(false);

  useEffect(() => {
    if (viewedOnce.current) return;
    viewedOnce.current = true;
    fetch(`/api/proposals/${proposal.publicToken}/view`, { method: "POST" }).catch(() => undefined);
  }, [proposal.publicToken]);

  async function acceptProposal() {
    const res = await fetch(`/api/proposals/${proposal.publicToken}/accept`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ acceptedBy: "client" }),
    });

    if (!res.ok) {
      toast.error("Unable to accept proposal");
      return;
    }

    toast.success("Proposal accepted");
    setAccepted(true);
  }

  return (
    <div className="space-y-6">
      <ProposalPreview
        title={proposal.title}
        summary={proposal.summary}
        brand={proposal.brandJson || createEmptyBrand(proposal.account?.name || proposal.opportunity?.assigned_account?.name || "Your company")}
        sections={proposal.sections}
        lineItems={proposal.lineItems}
        currency={proposal.currency}
        status={proposal.status}
        opportunityName={proposal.opportunity?.name}
        accountName={proposal.account?.name || proposal.opportunity?.assigned_account?.name}
        actionLabel={accepted ? "Accepted" : "Accept proposal"}
        actionHref={accepted ? undefined : undefined}
        onAction={acceptProposal}
      />

      <div className="rounded-2xl border bg-background p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="text-sm font-semibold">Client action</div>
            <div className="text-sm text-muted-foreground">
              {accepted ? "This proposal has been accepted." : "Review the details and accept when ready."}
            </div>
          </div>
          {!accepted ? <Button onClick={acceptProposal}>Accept proposal</Button> : <Button disabled>Accepted</Button>}
        </div>
      </div>
    </div>
  );
}
