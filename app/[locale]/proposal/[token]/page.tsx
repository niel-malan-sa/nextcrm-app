import Container from "@/app/[locale]/(routes)/components/ui/Container";
import { getProposalByToken } from "@/actions/proposals/get-proposal";
import { createDemoProposal } from "@/lib/proposals";
import { PublicProposalClient } from "./components/PublicProposalClient";

export default async function PublicProposalPage({
  params,
}: {
  params: Promise<{ locale: string; token: string }>;
}) {
  const { locale, token } = await params;
  const found = token === "demo" ? null : await getProposalByToken(token);
  const demo = createDemoProposal();
  const proposal = found ? found : { ...demo, brandJson: demo.brand };

  return (
    <Container title={proposal.title} description={proposal.summary || "Client proposal"}>
      <PublicProposalClient proposal={proposal} locale={locale} />
    </Container>
  );
}
