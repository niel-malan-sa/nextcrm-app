"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { updateProposal } from "@/actions/proposals/update-proposal";
import { crm_Proposal_Status } from "@prisma/client";
import {
  PROPOSAL_TEMPLATES,
  ProposalBrand,
  ProposalLineItem,
  ProposalSection,
  ProposalTemplateKey,
  createEmptyBrand,
  createSectionsFromTemplate,
} from "@/lib/proposals";
import { Copy, Plus, Save, ArrowUp, ArrowDown, Trash2, Lock } from "lucide-react";
import { ProposalPreview } from "./ProposalPreview";

function newSection(type: ProposalSection["type"]): ProposalSection {
  const id = crypto.randomUUID();
  switch (type) {
    case "hero":
      return {
        id,
        type,
        eyebrow: "Proposal",
        title: "Client proposal",
        subtitle: "A premium, no-code proposal experience.",
        description: "Edit this content without touching code.",
        ctaLabel: "Accept proposal",
      };
    case "scope":
      return {
        id,
        type,
        title: "What’s included",
        intro: "Write the offer in human language.",
        bullets: ["Deliverable one", "Deliverable two", "Deliverable three"],
      };
    case "process":
      return {
        id,
        type,
        title: "Delivery process",
        intro: "Show the client how the work unfolds.",
        steps: [
          { title: "Step 1", detail: "Discovery" },
          { title: "Step 2", detail: "Build" },
          { title: "Step 3", detail: "Launch" },
        ],
      };
    case "pricing":
      return {
        id,
        type,
        title: "Pricing",
        intro: "Line items and totals stay editable.",
      };
    case "terms":
      return {
        id,
        type,
        title: "Terms",
        body: "Payment is due on acceptance. Work begins after approval.",
      };
    case "cta":
    default:
      return {
        id,
        type: "cta",
        title: "Ready to start?",
        body: "Accept the proposal and we’ll kick off onboarding.",
        buttonLabel: "Accept and continue",
      };
  }
}

export function ProposalBuilder({
  proposal,
}: {
  proposal: any;
}) {
  const router = useRouter();
  const params = useParams<{ locale?: string }>();
  const locale = params?.locale || "en";

  const [title, setTitle] = useState(proposal.title ?? "New proposal");
  const [summary, setSummary] = useState(proposal.summary ?? "");
  const [templateKey, setTemplateKey] = useState<ProposalTemplateKey>(
    (proposal.templateKey as ProposalTemplateKey) || "consulting"
  );
  const [status, setStatus] = useState<crm_Proposal_Status>(proposal.status ?? "DRAFT");
  const [brand, setBrand] = useState<ProposalBrand>(
    proposal.brandJson || createEmptyBrand(proposal.account?.name || proposal.opportunity?.assigned_account?.name || "Your company")
  );
  const [sections, setSections] = useState<ProposalSection[]>(
    (proposal.sections as ProposalSection[])?.length
      ? (proposal.sections as ProposalSection[])
      : createSectionsFromTemplate(templateKey, {
          opportunityName: proposal.opportunity?.name,
          accountName: proposal.account?.name || proposal.opportunity?.assigned_account?.name,
        })
  );
  const [lineItems, setLineItems] = useState<ProposalLineItem[]>(
    (proposal.lineItems?.length ? proposal.lineItems : []).map((item: any) => ({
      id: item.id,
      name: item.name,
      description: item.description,
      quantity: Number(item.quantity ?? 1),
      unitPrice: Number(item.unitPrice ?? item.unit_price ?? 0),
      discountValue: Number(item.discountValue ?? item.discount_value ?? 0),
      lineTotal: Number(item.lineTotal ?? item.line_total ?? 0),
      currency: item.currency,
      sortOrder: Number(item.sortOrder ?? item.sort_order ?? 0),
    })) || []
  );
  const [selectedSectionId, setSelectedSectionId] = useState<string>(sections[0]?.id ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"content" | "pricing" | "brand">("content");

  const selectedSection = sections.find((section) => section.id === selectedSectionId) || sections[0];

  const subtotal = useMemo(
    () => lineItems.reduce((sum, item) => sum + Number(item.lineTotal || 0), 0),
    [lineItems]
  );

  const publicLink = `${typeof window !== "undefined" ? window.location.origin : ""}/${locale}/proposal/${proposal.publicToken}`;

  function updateSection(id: string, patch: Partial<ProposalSection>) {
    setSections((current) =>
      current.map((section) => (section.id === id ? { ...section, ...patch } as ProposalSection : section))
    );
  }

  function moveSection(id: string, direction: -1 | 1) {
    setSections((current) => {
      const index = current.findIndex((section) => section.id === id);
      const target = index + direction;
      if (index < 0 || target < 0 || target >= current.length) return current;
      const next = [...current];
      const [item] = next.splice(index, 1);
      next.splice(target, 0, item);
      return next;
    });
  }

  function removeSection(id: string) {
    setSections((current) => current.filter((section) => section.id !== id));
    setSelectedSectionId((current) => (current === id ? sections[0]?.id ?? "" : current));
  }

  function applyTemplate(nextTemplate: ProposalTemplateKey) {
    const nextSections = createSectionsFromTemplate(nextTemplate, {
      opportunityName: proposal.opportunity?.name,
      accountName: proposal.account?.name || proposal.opportunity?.assigned_account?.name,
    });
    setTemplateKey(nextTemplate);
    setSections(nextSections);
    setSelectedSectionId(nextSections[0]?.id ?? "");
  }

  function addLineItem() {
    setLineItems((current) => [
      ...current,
      {
        id: crypto.randomUUID(),
        name: "New item",
        description: "Describe the value this line item delivers.",
        quantity: 1,
        unitPrice: 0,
        discountValue: 0,
        lineTotal: 0,
        currency: proposal.currency || "USD",
        sortOrder: current.length,
      },
    ]);
  }

  function updateLineItem(id: string, patch: Partial<ProposalLineItem>) {
    setLineItems((current) =>
      current.map((item) => {
        if (item.id !== id) return item;
        const next = { ...item, ...patch };
        next.lineTotal = Number(((next.quantity || 0) * (next.unitPrice || 0) - (next.discountValue || 0)).toFixed(2));
        return next;
      })
    );
  }

  function removeLineItem(id: string) {
    setLineItems((current) => current.filter((item) => item.id !== id));
  }

  async function persist(nextStatus = status, lockVersion = false) {
    setIsSaving(true);
    try {
      const result = await updateProposal({
        id: proposal.id,
        title,
        summary,
        templateKey,
        status: nextStatus,
        brand,
        sections,
        lineItems,
        lockVersion,
      });

      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success(lockVersion ? "Version locked" : nextStatus === "SENT" ? "Proposal published" : "Proposal saved");
      router.refresh();
    } finally {
      setIsSaving(false);
    }
  }

  async function copyPublicLink() {
    if (!navigator?.clipboard) return;
    await navigator.clipboard.writeText(publicLink);
    toast.success("Public link copied");
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[380px_minmax(0,1fr)]">
      <aside className="space-y-4 rounded-2xl border bg-background p-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Badge>{status}</Badge>
            <Badge variant="outline">{templateKey}</Badge>
          </div>
          <h2 className="text-lg font-semibold">No-code proposal configurator</h2>
          <p className="text-sm text-muted-foreground">
            Build the proposal with templates, sections, pricing, and brand controls. No client coding.
          </p>
        </div>

        <div className="space-y-3 rounded-xl border p-3">
          <div className="grid gap-2">
            <label className="text-xs font-medium uppercase text-muted-foreground">Template</label>
            <div className="grid gap-2">
              {(Object.entries(PROPOSAL_TEMPLATES) as [ProposalTemplateKey, (typeof PROPOSAL_TEMPLATES)[ProposalTemplateKey]][]).map(([key, template]) => (
                <Button
                  key={key}
                  type="button"
                  variant={templateKey === key ? "default" : "secondary"}
                  onClick={() => applyTemplate(key)}
                  className="justify-start"
                >
                  {template.label}
                </Button>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <Button type="button" variant={activeTab === "content" ? "default" : "secondary"} onClick={() => setActiveTab("content")} className="flex-1">Content</Button>
            <Button type="button" variant={activeTab === "pricing" ? "default" : "secondary"} onClick={() => setActiveTab("pricing")} className="flex-1">Pricing</Button>
            <Button type="button" variant={activeTab === "brand" ? "default" : "secondary"} onClick={() => setActiveTab("brand")} className="flex-1">Brand</Button>
          </div>
        </div>

        {activeTab === "content" ? (
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Proposal details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <label className="text-xs font-medium uppercase text-muted-foreground">Title</label>
                  <Input value={title} onChange={(e) => setTitle(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium uppercase text-muted-foreground">Summary</label>
                  <Textarea value={summary} onChange={(e) => setSummary(e.target.value)} rows={4} />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium uppercase text-muted-foreground">Status</label>
                  <select value={status} onChange={(e) => setStatus(e.target.value as crm_Proposal_Status)} className="h-10 w-full rounded-md border bg-background px-3 text-sm">
                    <option value="DRAFT">DRAFT</option>
                    <option value="READY">READY</option>
                    <option value="SENT">SENT</option>
                    <option value="VIEWED">VIEWED</option>
                    <option value="ACCEPTED">ACCEPTED</option>
                    <option value="SIGNED">SIGNED</option>
                    <option value="ARCHIVED">ARCHIVED</option>
                  </select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between text-base">
                  <span>Sections</span>
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" variant="secondary" onClick={() => setSections((current) => [...current, newSection("hero")])}>
                      <Plus className="mr-2 h-4 w-4" /> Hero
                    </Button>
                    <Button size="sm" variant="secondary" onClick={() => setSections((current) => [...current, newSection("scope")])}>
                      <Plus className="mr-2 h-4 w-4" /> Scope
                    </Button>
                    <Button size="sm" variant="secondary" onClick={() => setSections((current) => [...current, newSection("process")])}>
                      <Plus className="mr-2 h-4 w-4" /> Process
                    </Button>
                    <Button size="sm" variant="secondary" onClick={() => setSections((current) => [...current, newSection("pricing")])}>
                      <Plus className="mr-2 h-4 w-4" /> Pricing
                    </Button>
                    <Button size="sm" variant="secondary" onClick={() => setSections((current) => [...current, newSection("terms")])}>
                      <Plus className="mr-2 h-4 w-4" /> Terms
                    </Button>
                    <Button size="sm" variant="secondary" onClick={() => setSections((current) => [...current, newSection("cta")])}>
                      <Plus className="mr-2 h-4 w-4" /> CTA
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {sections.map((section, index) => (
                  <div key={section.id} className={`rounded-xl border p-3 ${selectedSection?.id === section.id ? "border-primary bg-primary/5" : ""}`}>
                    <div className="flex items-center justify-between gap-2">
                      <button type="button" className="text-left" onClick={() => setSelectedSectionId(section.id)}>
                        <div className="text-sm font-medium capitalize">{section.type}</div>
                        <div className="text-xs text-muted-foreground">{section.type === "hero" ? (section as any).title : (section as any).title}</div>
                      </button>
                      <div className="flex items-center gap-1">
                        <Button size="icon" variant="ghost" onClick={() => moveSection(section.id, -1)} disabled={index === 0} aria-label="Move up"><ArrowUp className="h-4 w-4" /></Button>
                        <Button size="icon" variant="ghost" onClick={() => moveSection(section.id, 1)} disabled={index === sections.length - 1} aria-label="Move down"><ArrowDown className="h-4 w-4" /></Button>
                        <Button size="icon" variant="ghost" onClick={() => removeSection(section.id)} aria-label="Delete section"><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {selectedSection ? (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Edit {selectedSection.type}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {selectedSection.type === "hero" ? (
                    <>
                      <Input value={selectedSection.eyebrow} onChange={(e) => updateSection(selectedSection.id, { eyebrow: e.target.value } as any)} placeholder="Eyebrow" />
                      <Input value={selectedSection.title} onChange={(e) => updateSection(selectedSection.id, { title: e.target.value } as any)} placeholder="Title" />
                      <Input value={selectedSection.subtitle} onChange={(e) => updateSection(selectedSection.id, { subtitle: e.target.value } as any)} placeholder="Subtitle" />
                      <Textarea rows={4} value={selectedSection.description} onChange={(e) => updateSection(selectedSection.id, { description: e.target.value } as any)} placeholder="Description" />
                      <Input value={selectedSection.ctaLabel} onChange={(e) => updateSection(selectedSection.id, { ctaLabel: e.target.value } as any)} placeholder="CTA label" />
                    </>
                  ) : null}
                  {selectedSection.type === "scope" ? (
                    <>
                      <Input value={selectedSection.title} onChange={(e) => updateSection(selectedSection.id, { title: e.target.value } as any)} placeholder="Title" />
                      <Textarea rows={3} value={selectedSection.intro} onChange={(e) => updateSection(selectedSection.id, { intro: e.target.value } as any)} placeholder="Intro" />
                      <Textarea
                        rows={5}
                        value={selectedSection.bullets.join("\n")}
                        onChange={(e) => updateSection(selectedSection.id, { bullets: e.target.value.split("\n").filter(Boolean) } as any)}
                        placeholder="One bullet per line"
                      />
                    </>
                  ) : null}
                  {selectedSection.type === "process" ? (
                    <>
                      <Input value={selectedSection.title} onChange={(e) => updateSection(selectedSection.id, { title: e.target.value } as any)} placeholder="Title" />
                      <Textarea rows={3} value={selectedSection.intro} onChange={(e) => updateSection(selectedSection.id, { intro: e.target.value } as any)} placeholder="Intro" />
                      <Textarea
                        rows={6}
                        value={selectedSection.steps.map((step) => `${step.title} | ${step.detail}`).join("\n")}
                        onChange={(e) => updateSection(selectedSection.id, { steps: e.target.value.split("\n").filter(Boolean).map((line) => {
                          const [title, detail] = line.split("|");
                          return { title: (title || "").trim(), detail: (detail || "").trim() };
                        }) } as any)}
                        placeholder="Title | Detail"
                      />
                    </>
                  ) : null}
                  {selectedSection.type === "pricing" ? (
                    <>
                      <Input value={selectedSection.title} onChange={(e) => updateSection(selectedSection.id, { title: e.target.value } as any)} placeholder="Title" />
                      <Textarea rows={3} value={selectedSection.intro} onChange={(e) => updateSection(selectedSection.id, { intro: e.target.value } as any)} placeholder="Intro" />
                    </>
                  ) : null}
                  {selectedSection.type === "terms" ? (
                    <>
                      <Input value={selectedSection.title} onChange={(e) => updateSection(selectedSection.id, { title: e.target.value } as any)} placeholder="Title" />
                      <Textarea rows={5} value={selectedSection.body} onChange={(e) => updateSection(selectedSection.id, { body: e.target.value } as any)} placeholder="Terms body" />
                    </>
                  ) : null}
                  {selectedSection.type === "cta" ? (
                    <>
                      <Input value={selectedSection.title} onChange={(e) => updateSection(selectedSection.id, { title: e.target.value } as any)} placeholder="Title" />
                      <Textarea rows={4} value={selectedSection.body} onChange={(e) => updateSection(selectedSection.id, { body: e.target.value } as any)} placeholder="CTA body" />
                      <Input value={selectedSection.buttonLabel} onChange={(e) => updateSection(selectedSection.id, { buttonLabel: e.target.value } as any)} placeholder="Button label" />
                    </>
                  ) : null}
                </CardContent>
              </Card>
            ) : null}
          </div>
        ) : null}

        {activeTab === "pricing" ? (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-base">
                <span>Line items</span>
                <Button size="sm" variant="secondary" onClick={addLineItem}><Plus className="mr-2 h-4 w-4" /> Add item</Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {lineItems.map((item, index) => (
                <div key={item.id} className="rounded-xl border p-3">
                  <div className="grid gap-3 md:grid-cols-2">
                    <Input value={item.name} onChange={(e) => updateLineItem(item.id, { name: e.target.value })} placeholder="Item name" />
                    <Input value={item.description ?? ""} onChange={(e) => updateLineItem(item.id, { description: e.target.value })} placeholder="Description" />
                    <Input type="number" value={item.quantity} onChange={(e) => updateLineItem(item.id, { quantity: Number(e.target.value) || 0 })} placeholder="Quantity" />
                    <Input type="number" value={item.unitPrice} onChange={(e) => updateLineItem(item.id, { unitPrice: Number(e.target.value) || 0 })} placeholder="Unit price" />
                    <Input type="number" value={item.discountValue ?? 0} onChange={(e) => updateLineItem(item.id, { discountValue: Number(e.target.value) || 0 })} placeholder="Discount" />
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-sm text-muted-foreground">{item.currency}</div>
                      <Button size="sm" variant="ghost" onClick={() => removeLineItem(item.id)}><Trash2 className="mr-2 h-4 w-4" /> Remove</Button>
                    </div>
                  </div>
                </div>
              ))}
              <div className="rounded-xl bg-muted/40 p-4 text-sm">
                Subtotal: <span className="font-semibold">{new Intl.NumberFormat("en-US", { style: "currency", currency: proposal.currency || "USD" }).format(subtotal)}</span>
              </div>
            </CardContent>
          </Card>
        ) : null}

        {activeTab === "brand" ? (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Brand settings</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-2">
              <Input value={brand.companyName} onChange={(e) => setBrand((current) => ({ ...current, companyName: e.target.value }))} placeholder="Company name" />
              <Input value={brand.logoUrl ?? ""} onChange={(e) => setBrand((current) => ({ ...current, logoUrl: e.target.value }))} placeholder="Logo URL" />
              <Input value={brand.primaryColor} onChange={(e) => setBrand((current) => ({ ...current, primaryColor: e.target.value }))} placeholder="Primary color" />
              <Input value={brand.accentColor} onChange={(e) => setBrand((current) => ({ ...current, accentColor: e.target.value }))} placeholder="Accent color" />
              <Input value={brand.websiteUrl ?? ""} onChange={(e) => setBrand((current) => ({ ...current, websiteUrl: e.target.value }))} placeholder="Website URL" />
              <Input value={brand.contactEmail ?? ""} onChange={(e) => setBrand((current) => ({ ...current, contactEmail: e.target.value }))} placeholder="Contact email" />
              <Input value={brand.contactName ?? ""} onChange={(e) => setBrand((current) => ({ ...current, contactName: e.target.value }))} placeholder="Contact name" />
              <Input value={brand.footerNote ?? ""} onChange={(e) => setBrand((current) => ({ ...current, footerNote: e.target.value }))} placeholder="Footer note" />
            </CardContent>
          </Card>
        ) : null}

        <div className="space-y-3 rounded-2xl border bg-background p-4">
          <div className="flex flex-wrap items-center gap-2">
            <Button onClick={() => persist(status, false)} disabled={isSaving}><Save className="mr-2 h-4 w-4" /> Save</Button>
            <Button variant="secondary" onClick={() => persist("SENT", true)} disabled={isSaving}><Lock className="mr-2 h-4 w-4" /> Publish</Button>
            <Button variant="secondary" onClick={() => persist(status, true)} disabled={isSaving}>Lock version</Button>
            <Button variant="outline" onClick={copyPublicLink}><Copy className="mr-2 h-4 w-4" /> Copy link</Button>
          </div>
          <div className="rounded-xl bg-muted/40 p-3 text-xs text-muted-foreground break-all">{publicLink}</div>
          <Separator />
          <ProposalPreview
            title={title}
            summary={summary}
            brand={brand}
            sections={sections}
            lineItems={lineItems}
            currency={proposal.currency || "USD"}
            status={status}
            opportunityName={proposal.opportunity?.name}
            accountName={proposal.account?.name || proposal.opportunity?.assigned_account?.name}
          />
        </div>
      </aside>
    </div>
  );
}
