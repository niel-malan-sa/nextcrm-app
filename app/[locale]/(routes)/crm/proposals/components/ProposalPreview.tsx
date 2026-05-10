"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  ProposalBrand,
  ProposalLineItem,
  ProposalSection,
} from "@/lib/proposals";

function money(amount: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(amount);
}

function fallbackColor(color?: string, fallback = "#111827") {
  return color || fallback;
}

export function ProposalPreview(props: {
  title: string;
  summary?: string | null;
  brand: ProposalBrand;
  sections: ProposalSection[];
  lineItems: ProposalLineItem[];
  currency: string;
  status?: string;
  opportunityName?: string | null;
  accountName?: string | null;
  actionLabel?: string;
  onAction?: () => void;
  actionHref?: string;
  compact?: boolean;
}) {
  const subtotal = props.lineItems.reduce((sum, item) => sum + item.lineTotal, 0);
  const primary = fallbackColor(props.brand.primaryColor, "#6d28d9");
  const accent = fallbackColor(props.brand.accentColor, "#111827");
  const heroSection = props.sections.find((section) => section.type === "hero");

  return (
    <article className="overflow-hidden rounded-3xl border bg-background shadow-sm">
      <section
        className="relative overflow-hidden p-8 text-white md:p-12"
        style={{ background: `linear-gradient(135deg, ${accent}, ${primary})` }}
      >
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage:
            "radial-gradient(circle at top left, rgba(255,255,255,.45), transparent 38%), radial-gradient(circle at bottom right, rgba(255,255,255,.18), transparent 32%)",
        }} />
        <div className="relative flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
          <div className="max-w-3xl space-y-4">
            <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.22em] text-white/70">
              <Badge variant="secondary" className="bg-white/12 text-white hover:bg-white/20">
                {props.status ?? "Draft"}
              </Badge>
              {props.accountName ? <span>{props.accountName}</span> : null}
            </div>
            <div className="space-y-2">
              <p className="text-sm uppercase tracking-[0.3em] text-white/70">
                {heroSection?.type === "hero" ? heroSection.eyebrow : "Proposal"}
              </p>
              <h1 className="text-3xl font-semibold leading-tight md:text-5xl">
                {props.title}
              </h1>
              <p className="max-w-2xl text-base text-white/80 md:text-lg">
                {heroSection?.type === "hero"
                  ? heroSection.subtitle
                  : props.summary || "A polished proposal your client can review and accept without code."}
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-sm">
            <div className="text-xs uppercase tracking-[0.2em] text-white/65">Prepared for</div>
            <div className="mt-1 text-lg font-medium">{props.opportunityName || props.title}</div>
            <div className="text-sm text-white/75">{props.brand.companyName}</div>
            <Separator className="my-4 bg-white/15" />
            <div className="space-y-1 text-sm text-white/75">
              <div>{props.brand.contactName || "Proposal team"}</div>
              {props.brand.contactEmail ? <div>{props.brand.contactEmail}</div> : null}
              {props.brand.websiteUrl ? <div>{props.brand.websiteUrl}</div> : null}
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 p-6 md:grid-cols-[minmax(0,1.35fr)_360px] md:p-8">
        <div className="space-y-6">
          {props.sections.map((section) => {
            if (section.type === "hero") return null;
            if (section.type === "scope") {
              return (
                <div key={section.id} className="rounded-2xl border p-6">
                  <p className="text-sm font-semibold">{section.title}</p>
                  <p className="mt-2 text-sm text-muted-foreground">{section.intro}</p>
                  <div className="mt-4 grid gap-2">
                    {section.bullets.map((bullet) => (
                      <div key={bullet} className="flex items-start gap-2 text-sm">
                        <span className="mt-1 h-2 w-2 rounded-full bg-primary" />
                        <span>{bullet}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            }
            if (section.type === "process") {
              return (
                <div key={section.id} className="rounded-2xl border p-6">
                  <p className="text-sm font-semibold">{section.title}</p>
                  <p className="mt-2 text-sm text-muted-foreground">{section.intro}</p>
                  <div className="mt-4 grid gap-3 md:grid-cols-3">
                    {section.steps.map((step) => (
                      <div key={step.title} className="rounded-xl bg-muted/40 p-4">
                        <div className="font-medium">{step.title}</div>
                        <div className="mt-1 text-sm text-muted-foreground">{step.detail}</div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            }
            if (section.type === "pricing") {
              return (
                <div key={section.id} className="rounded-2xl border p-6">
                  <p className="text-sm font-semibold">{section.title}</p>
                  <p className="mt-2 text-sm text-muted-foreground">{section.intro}</p>
                  <div className="mt-4 overflow-hidden rounded-xl border">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-muted/40 text-muted-foreground">
                        <tr>
                          <th className="px-4 py-3 font-medium">Item</th>
                          <th className="px-4 py-3 font-medium">Qty</th>
                          <th className="px-4 py-3 font-medium text-right">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {props.lineItems.map((item) => (
                          <tr key={item.id} className="border-t">
                            <td className="px-4 py-3">
                              <div className="font-medium">{item.name}</div>
                              {item.description ? (
                                <div className="text-xs text-muted-foreground">{item.description}</div>
                              ) : null}
                            </td>
                            <td className="px-4 py-3">{item.quantity}</td>
                            <td className="px-4 py-3 text-right">{money(item.lineTotal, props.currency)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            }
            if (section.type === "terms") {
              return (
                <div key={section.id} className="rounded-2xl border p-6">
                  <p className="text-sm font-semibold">{section.title}</p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{section.body}</p>
                </div>
              );
            }
            if (section.type === "cta") {
              return (
                <div key={section.id} className="rounded-2xl border bg-muted/30 p-6">
                  <p className="text-sm font-semibold">{section.title}</p>
                  <p className="mt-2 text-sm text-muted-foreground">{section.body}</p>
                  {props.actionLabel ? (
                    <div className="mt-4">
                      <Button asChild={Boolean(props.actionHref)} onClick={props.onAction}>
                        {props.actionHref ? <a href={props.actionHref}>{section.buttonLabel || props.actionLabel}</a> : section.buttonLabel || props.actionLabel}
                      </Button>
                    </div>
                  ) : null}
                </div>
              );
            }
            return null;
          })}
        </div>

        <aside className="space-y-4">
          <div className="rounded-2xl border p-6">
            <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Summary</div>
            <div className="mt-2 text-2xl font-semibold">{money(subtotal, props.currency)}</div>
            <div className="mt-2 text-sm text-muted-foreground">
              {props.summary || "Client-ready pricing and acceptance flow in one link."}
            </div>
          </div>

          <div className="rounded-2xl border p-6">
            <div className="text-sm font-semibold">Brand</div>
            <div className="mt-3 space-y-2 text-sm text-muted-foreground">
              <div>{props.brand.companyName}</div>
              {props.brand.footerNote ? <div>{props.brand.footerNote}</div> : null}
              <div className="flex gap-2 pt-2">
                <span className="h-5 w-10 rounded-full" style={{ backgroundColor: primary }} />
                <span className="h-5 w-10 rounded-full" style={{ backgroundColor: accent }} />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border p-6">
            <div className="text-sm font-semibold">Client journey</div>
            <ol className="mt-3 space-y-3 text-sm text-muted-foreground">
              <li>1. Open proposal link</li>
              <li>2. Review pricing and scope</li>
              <li>3. Accept and start onboarding</li>
            </ol>
          </div>
        </aside>
      </section>
    </article>
  );
}
