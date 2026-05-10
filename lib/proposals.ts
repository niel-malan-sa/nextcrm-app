export type ProposalTemplateKey = "consulting" | "project" | "retainer";

export type ProposalBrand = {
  companyName: string;
  logoUrl?: string;
  primaryColor: string;
  accentColor: string;
  websiteUrl?: string;
  contactName?: string;
  contactEmail?: string;
  footerNote?: string;
};

export type ProposalLineItem = {
  id: string;
  name: string;
  description?: string | null;
  quantity: number;
  unitPrice: number;
  discountValue?: number;
  lineTotal: number;
  currency: string;
  sortOrder: number;
};

export type ProposalSection =
  | {
      id: string;
      type: "hero";
      eyebrow: string;
      title: string;
      subtitle: string;
      description: string;
      ctaLabel: string;
    }
  | {
      id: string;
      type: "scope";
      title: string;
      intro: string;
      bullets: string[];
    }
  | {
      id: string;
      type: "process";
      title: string;
      intro: string;
      steps: { title: string; detail: string }[];
    }
  | {
      id: string;
      type: "pricing";
      title: string;
      intro: string;
    }
  | {
      id: string;
      type: "terms";
      title: string;
      body: string;
    }
  | {
      id: string;
      type: "cta";
      title: string;
      body: string;
      buttonLabel: string;
    };

export const PROPOSAL_TEMPLATES: Record<
  ProposalTemplateKey,
  {
    label: string;
    description: string;
    sections: ProposalSection[];
  }
> = {
  consulting: {
    label: "Consulting",
    description: "Strategy, advisory, and premium service engagements.",
    sections: [
      {
        id: "hero",
        type: "hero",
        eyebrow: "Proposal",
        title: "Strategic growth engagement",
        subtitle: "Clear scope. Premium delivery. Zero code for the client.",
        description:
          "Use this template when the buyer needs confidence, authority, and a polished buying experience.",
        ctaLabel: "Accept proposal",
      },
      {
        id: "scope",
        type: "scope",
        title: "What you get",
        intro: "The work is packaged into simple outcomes the client can understand.",
        bullets: [
          "Discovery and alignment workshop",
          "Implementation plan with milestones",
          "Weekly progress and stakeholder updates",
        ],
      },
      {
        id: "process",
        type: "process",
        title: "How we work",
        intro: "A lightweight, confident delivery process.",
        steps: [
          { title: "1. Kickoff", detail: "Confirm goals, scope, and success criteria." },
          { title: "2. Build", detail: "Deliver the work in focused milestone sprints." },
          { title: "3. Review", detail: "Share progress and finalize launch steps." },
        ],
      },
      { id: "pricing", type: "pricing", title: "Pricing", intro: "Select the options that fit the deal." },
      {
        id: "terms",
        type: "terms",
        title: "Terms",
        body: "This proposal remains valid for 14 days. Payment starts work once accepted.",
      },
      {
        id: "cta",
        type: "cta",
        title: "Ready to move forward?",
        body: "Accept the proposal and we will open the onboarding steps immediately.",
        buttonLabel: "Accept and continue",
      },
    ],
  },
  project: {
    label: "Project",
    description: "Delivery roadmap for websites, software, and implementation projects.",
    sections: [
      {
        id: "hero",
        type: "hero",
        eyebrow: "Project proposal",
        title: "Build, launch, and handover",
        subtitle: "Beautiful proposal pages that clients can approve fast.",
        description:
          "Use this template when the buyer wants milestones, deliverables, and clear implementation scope.",
        ctaLabel: "Review project",
      },
      {
        id: "scope",
        type: "scope",
        title: "Deliverables",
        intro: "Everything is laid out as a readable project plan.",
        bullets: [
          "Discovery and wireframes",
          "Design and build",
          "QA, launch, and handover",
        ],
      },
      {
        id: "process",
        type: "process",
        title: "Milestones",
        intro: "A fast project structure with visible checkpoints.",
        steps: [
          { title: "Week 1", detail: "Discovery and kickoff.", },
          { title: "Week 2-3", detail: "Design and implementation." },
          { title: "Week 4", detail: "Testing, launch, and handover." },
        ],
      },
      { id: "pricing", type: "pricing", title: "Investment", intro: "Flexible pricing tied to scope choices." },
      {
        id: "terms",
        type: "terms",
        title: "Project terms",
        body: "Changes outside scope are handled with a separate change order.",
      },
      {
        id: "cta",
        type: "cta",
        title: "Approve the plan",
        body: "Sign, pay, and move straight into the project kickoff.",
        buttonLabel: "Approve project",
      },
    ],
  },
  retainer: {
    label: "Retainer",
    description: "Ongoing monthly support and growth packages.",
    sections: [
      {
        id: "hero",
        type: "hero",
        eyebrow: "Retainer proposal",
        title: "Monthly support that feels premium",
        subtitle: "Clear packages, recurring fees, and an easy client decision.",
        description:
          "Use this template when the client needs a recurring relationship, not a one-off project.",
        ctaLabel: "Start retainer",
      },
      {
        id: "scope",
        type: "scope",
        title: "Monthly outputs",
        intro: "The client sees the recurring value in plain language.",
        bullets: [
          "Monthly strategy sessions",
          "Implementation and optimization support",
          "Reporting and recommendations",
        ],
      },
      {
        id: "process",
        type: "process",
        title: "Cadence",
        intro: "A stable rhythm the client can trust.",
        steps: [
          { title: "Week 1", detail: "Plan the month and prioritize work." },
          { title: "Week 2-3", detail: "Execute and optimize." },
          { title: "Week 4", detail: "Review results and adjust the plan." },
        ],
      },
      { id: "pricing", type: "pricing", title: "Monthly investment", intro: "Recurring pricing and optional add-ons." },
      {
        id: "terms",
        type: "terms",
        title: "Retainer terms",
        body: "This agreement renews monthly until canceled with written notice.",
      },
      {
        id: "cta",
        type: "cta",
        title: "Lock in the monthly plan",
        body: "Accept now and we will start onboarding the same day.",
        buttonLabel: "Activate retainer",
      },
    ],
  },
};

export function createEmptyBrand(companyName = "Your company"): ProposalBrand {
  return {
    companyName,
    primaryColor: "#6d28d9",
    accentColor: "#111827",
    websiteUrl: undefined,
    contactName: undefined,
    contactEmail: undefined,
    footerNote: "Prepared with the CRM proposal builder.",
  };
}

export function createSectionsFromTemplate(
  templateKey: ProposalTemplateKey,
  context?: { opportunityName?: string | null; accountName?: string | null }
): ProposalSection[] {
  const template = PROPOSAL_TEMPLATES[templateKey];
  return template.sections.map((section) => {
    if (section.type !== "hero") return structuredClone(section);
    return {
      ...section,
      title: context?.opportunityName ? `${context.opportunityName} proposal` : section.title,
      description: context?.accountName
        ? `${section.description} Built for ${context.accountName}.`
        : section.description,
    };
  });
}

export function createDefaultLineItems(input?: {
  name?: string | null;
  currency?: string | null;
  items?: { name: string; description?: string | null; quantity: number; unitPrice: number }[];
}): ProposalLineItem[] {
  const currency = input?.currency ?? "USD";
  const items = input?.items ?? [];
  if (items.length === 0) {
    return [
      {
        id: crypto.randomUUID(),
        name: input?.name ? `${input.name} package` : "Core package",
        description: "Strategy, execution, and handover.",
        quantity: 1,
        unitPrice: 0,
        lineTotal: 0,
        currency,
        sortOrder: 0,
      },
    ];
  }

  return items.map((item, index) => ({
    id: crypto.randomUUID(),
    name: item.name,
    description: item.description ?? undefined,
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    lineTotal: Number((item.unitPrice * item.quantity).toFixed(2)),
    currency,
    sortOrder: index,
  }));
}

export function calcLineItemTotal(item: { quantity: number; unitPrice: number; discountValue?: number }) {
  const line = item.quantity * item.unitPrice - (item.discountValue ?? 0);
  return Number(Math.max(line, 0).toFixed(2));
}

export function calcProposalSubtotal(items: ProposalLineItem[]) {
  return Number(items.reduce((sum, item) => sum + item.lineTotal, 0).toFixed(2));
}

export function createDemoProposal() {
  return {
    title: "Website growth proposal",
    summary: "A polished, client-friendly demo proposal with live preview and acceptance flow.",
    templateKey: "project" as ProposalTemplateKey,
    brand: {
      companyName: "NextCRM Studio",
      primaryColor: "#6d28d9",
      accentColor: "#111827",
      websiteUrl: "https://localhost",
      footerNote: "Demo preview for review.",
    } satisfies ProposalBrand,
    sections: createSectionsFromTemplate("project", {
      opportunityName: "Acme expansion",
      accountName: "Acme Group",
    }),
    lineItems: [
      {
        id: "demo-1",
        name: "Discovery and strategy",
        description: "Workshops, scoping, and roadmap.",
        quantity: 1,
        unitPrice: 2500,
        lineTotal: 2500,
        currency: "USD",
        sortOrder: 0,
      },
      {
        id: "demo-2",
        name: "Design and build",
        description: "Proposal-friendly delivery bundle.",
        quantity: 1,
        unitPrice: 7500,
        lineTotal: 7500,
        currency: "USD",
        sortOrder: 1,
      },
    ] satisfies ProposalLineItem[],
    currency: "USD",
    total: 10000,
    publicToken: "demo",
    status: "SENT" as const,
  };
}
