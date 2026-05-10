import Link from "next/link";
import Container from "@/app/[locale]/(routes)/components/ui/Container";
import { Button } from "@/components/ui/button";
import { getProposals } from "@/actions/proposals/get-proposals";
import { Plus } from "lucide-react";

export default async function ProposalsPage() {
  const proposals = await getProposals();

  return (
    <Container title="Proposals" description="Create live, branded proposals from CRM opportunities.">
      <div className="flex justify-end py-5">
        <Link href="/crm/proposals/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New proposal
          </Button>
        </Link>
      </div>

      <div className="grid gap-4">
        {proposals.length === 0 ? (
          <div className="rounded-lg border bg-background p-6 text-sm text-muted-foreground">
            No proposals yet. Create one from an opportunity to start the BetterProposals-style flow.
          </div>
        ) : (
          proposals.map((proposal: any) => (
            <Link
              key={proposal.id}
              href={`/crm/proposals/${proposal.id}`}
              className="rounded-lg border bg-background p-5 transition hover:border-primary"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-base font-semibold">{proposal.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {proposal.opportunity?.name ?? "Standalone proposal"}
                    {proposal.account?.name ? ` · ${proposal.account.name}` : ""}
                  </p>
                </div>
                <div className="text-right text-sm">
                  <div className="font-medium">{proposal.status}</div>
                  <div className="text-muted-foreground">
                    {proposal.currency} {Number(proposal.total ?? 0).toFixed(2)}
                  </div>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </Container>
  );
}
