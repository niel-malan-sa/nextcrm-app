"use client";

import { createProposal } from "@/actions/proposals/create-proposal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PROPOSAL_TEMPLATES, ProposalTemplateKey } from "@/lib/proposals";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";

export function CreateProposalForm({
  opportunities,
  defaultOpportunityId,
}: {
  opportunities: { id: string; name?: string | null }[];
  defaultOpportunityId?: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const presetOpportunityId = defaultOpportunityId || searchParams.get("opportunityId") || opportunities[0]?.id || "";
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [opportunityId, setOpportunityId] = useState(presetOpportunityId);
  const [templateKey, setTemplateKey] = useState<ProposalTemplateKey>("consulting");
  const [isSaving, setIsSaving] = useState(false);

  async function handleCreate() {
    setIsSaving(true);
    try {
      const result = await createProposal({
        title,
        summary,
        opportunityId: opportunityId || undefined,
        templateKey,
      });

      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success("Proposal created");
      if (!result.data) {
        toast.error("Proposal created but missing id");
        return;
      }

      router.push(`/crm/proposals/${result.data.id}`);
      router.refresh();
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="grid gap-4 lg:max-w-2xl">
      <div className="grid gap-2">
        <label className="text-sm font-medium">Proposal title</label>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="New proposal" />
      </div>

      <div className="grid gap-2">
        <label className="text-sm font-medium">Summary</label>
        <Textarea value={summary} onChange={(e) => setSummary(e.target.value)} placeholder="Optional summary" rows={4} />
      </div>

      <div className="grid gap-2">
        <label className="text-sm font-medium">Template</label>
        <div className="grid gap-2 md:grid-cols-3">
          {(Object.entries(PROPOSAL_TEMPLATES) as [ProposalTemplateKey, (typeof PROPOSAL_TEMPLATES)[ProposalTemplateKey]][]).map(([key, template]) => (
            <Button key={key} type="button" variant={templateKey === key ? "default" : "secondary"} onClick={() => setTemplateKey(key)} className="justify-start">
              {template.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid gap-2">
        <label className="text-sm font-medium">Opportunity</label>
        <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={opportunityId} onChange={(e) => setOpportunityId(e.target.value)}>
          <option value="">Blank proposal</option>
          {opportunities.map((opportunity) => (
            <option key={opportunity.id} value={opportunity.id}>
              {opportunity.name ?? "Untitled opportunity"}
            </option>
          ))}
        </select>
      </div>

      <div>
        <Button onClick={handleCreate} disabled={isSaving}>
          {isSaving ? "Creating..." : "Create proposal"}
        </Button>
      </div>
    </div>
  );
}
