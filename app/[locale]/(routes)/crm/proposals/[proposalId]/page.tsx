import Container from "@/app/[locale]/(routes)/components/ui/Container";
import { getProposal } from "@/actions/proposals/get-proposal";
import { getOpportunities } from "@/actions/crm/get-opportunities";
import { serializeDecimals } from "@/lib/serialize-decimals";
import { ProposalBuilder } from "../components/ProposalBuilder";

export default async function ProposalPage({
  params,
}: {
  params: Promise<{ proposalId: string }>;
}) {
  const { proposalId } = await params;
  const proposal = await getProposal(proposalId);

  if (!proposal) {
    return (
      <Container title="Proposal" description="Proposal not found.">
        <div className="rounded-lg border bg-background p-6">Proposal not found.</div>
      </Container>
    );
  }

  const opportunities = serializeDecimals(await getOpportunities().catch(() => []));

  return (
    <Container title={proposal.title} description={proposal.summary || "Proposal builder"}>
      <ProposalBuilder proposal={serializeDecimals({ ...proposal, opportunities })} />
    </Container>
  );
}
