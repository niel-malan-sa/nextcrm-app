import Container from "@/app/[locale]/(routes)/components/ui/Container";
import { getOpportunities } from "@/actions/crm/get-opportunities";
import { serializeDecimalsList } from "@/lib/serialize-decimals";
import { CreateProposalForm } from "../components/CreateProposalForm";

export default async function NewProposalPage({
  searchParams,
}: {
  searchParams: Promise<{ opportunityId?: string }>;
}) {
  const params = await searchParams;
  const opportunities = serializeDecimalsList(await getOpportunities().catch(() => []));

  return (
    <Container title="New proposal" description="Start from a CRM opportunity.">
      <CreateProposalForm opportunities={opportunities as any[]} defaultOpportunityId={params.opportunityId} />
    </Container>
  );
}
