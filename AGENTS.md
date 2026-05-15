# AGENTS.md

This file is the authoritative guide for AI agents (Claude Code and other LLM agents) working in the `nextcrm-app` project. It covers context management, available superpowers/skills, current repo status, and available MCP servers.

---

## 1. Context-Mode

**What it is**: The `context-mode` MCP plugin intercepts large tool outputs and stores them in a local FTS5 SQLite sandbox, returning only a compact reference instead of flooding the context window.

### Tool Hierarchy

| Priority | Tool                                                                      | Use When                                                             |
| -------- | ------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| 1        | `mcp__plugin_context-mode_context-mode__ctx_batch_execute`                | Primary research — runs commands, auto-indexes, searches in one call |
| 2        | `mcp__plugin_context-mode_context-mode__ctx_search`                       | Follow-up questions — pass multiple queries in one call              |
| 3        | `mcp__plugin_context-mode_context-mode__ctx_execute` / `ctx_execute_file` | Data processing, API calls, large log analysis                       |

### Forbidden Actions

- **Never** use `Bash` for commands producing >20 lines of output
- **Never** use `Read` for analysis (use `ctx_execute_file` instead; `Read` is correct only for files you intend to `Edit`)
- **Never** use `WebFetch` — use `ctx_fetch_and_index` instead

### Trigger Commands

| Command        | Action                                                                            |
| -------------- | --------------------------------------------------------------------------------- |
| `/ctx-stats`   | Call `ctx_stats` MCP tool, display output verbatim                                |
| `/ctx-doctor`  | Call `ctx_doctor` MCP tool, execute returned shell command, display as checklist  |
| `/ctx-upgrade` | Call `ctx_upgrade` MCP tool, execute returned shell command, display as checklist |

---

## 2. Superpowers (Skills System)

**What it is**: The `.claude/skills/` directory contains `SKILL.md` files that define rigid and flexible agent behaviors.

**Core rule**: Check for applicable skills **before** any response. Invoke via the `Skill` tool.

**Priority order**: User instructions > Superpowers skills > Default behavior

### Available Skills

| Skill                          | Path                                             | Type     |
| ------------------------------ | ------------------------------------------------ | -------- |
| using-superpowers              | `.claude/skills/using-superpowers/`              | Rigid    |
| brainstorming                  | `.claude/skills/brainstorming/`                  | Rigid    |
| test-driven-development        | `.claude/skills/test-driven-development/`        | Rigid    |
| systematic-debugging           | `.claude/skills/systematic-debugging/`           | Rigid    |
| writing-plans                  | `.claude/commands/write-plan.md`                 | Flexible |
| executing-plans                | `.claude/skills/executing-plans/`                | Flexible |
| dispatching-parallel-agents    | `.claude/skills/dispatching-parallel-agents/`    | Flexible |
| subagent-driven-development    | `.claude/skills/subagent-driven-development/`    | Flexible |
| using-git-worktrees            | `.claude/skills/using-git-worktrees/`            | Flexible |
| finishing-a-development-branch | `.claude/skills/finishing-a-development-branch/` | Flexible |
| requesting-code-review         | `.claude/skills/requesting-code-review/`         | Flexible |
| receiving-code-review          | `.claude/skills/receiving-code-review/`          | Flexible |

---

## 3. Prisma Decimal Serialization

**Problem**: Prisma returns `Decimal` objects for decimal/numeric columns. These are **not serializable** across the React Server Action boundary or when passing data to Client Components. Symptoms include: silent failures, `undefined` return values, hydration mismatches, or broken `router.push()` after a server action call.

**Solution**: Always use `serializeDecimals()` from `lib/serialize-decimals.ts`.

```ts
import { serializeDecimals } from "@/lib/serialize-decimals";

// Single object — wraps Prisma result before returning from server actions
return serializeDecimals(invoice);

// Lists — use serializeDecimalsList for arrays
import { serializeDecimalsList } from "@/lib/serialize-decimals";
return serializeDecimalsList(invoices);
```

**When to apply**:
- Every server action (`"use server"`) that returns a Prisma object containing Decimal fields
- Every Server Component that passes Prisma objects with Decimal fields as props to Client Components
- Any data crossing the server → client boundary where the Prisma model has `Decimal` columns

**Do NOT** strip returns to `{ id }` only — use `serializeDecimals()` so the full object remains available to the caller.

---

## 4. Git Workflow & Release Management

This project uses a **trunk-based flow with `dev` as the integration branch** and `main` as the release branch. There are no long-lived feature branches.

### Branches

- **`dev`** — integration branch. All local development happens directly here. Deployed to the **remote dev environment** for integration testing.
- **`main`** — release branch. Deployed to production. Updated only via PR from `dev`.

### Development loop

1. **Work locally on `dev`** — commit feature, fix, and refactor work directly to the `dev` branch. Do not create feature branches for routine work.
2. **Push to `origin/dev`** — triggers the remote dev deployment. Verify the feature works end-to-end in the deployed dev environment, not just locally.
3. **Open PR `dev → main`** — only after remote dev is green. This PR is the release gate.

```bash
# After work is committed locally on dev:
git push origin dev

# After validating remote dev deploy:
gh pr create --base main --head dev --title "<type>: <summary>" --body "..."
```

### Rules for agents

- **Default base branch for PRs is `main`**, head branch is `dev`. Do NOT use `--base dev` unless the user explicitly asks for a feature-branch-style PR.
- **Never force-push `dev` or `main`.** If mistakes land on `dev`, create a follow-up commit.
- **Never commit directly to `main`.** Changes reach `main` only via a reviewed `dev → main` PR.
- **Release automation**: `release-please` runs on `main` to manage version bumps and changelog generation. Do not manually edit `CHANGELOG.md` or `package.json` version fields.
- When the user says "create a PR" without further context, assume `dev → main`.

---

---

## 5. Branch State: `caldiy-scheduling-pilot` (as of May 2026)

### What is built and complete

Both custom features are ~95% done and committed.

**Cal.diy scheduling integration**
- Webhook receiver at `/api/integrations/cal/webhook` — HMAC-validated, maps all booking lifecycle events to `crm_Activities`
- Contact matching by email, deduplication by booking UID
- Booking calendar comparison UI at `/scheduling` with full Cal.com v2 API proxy routes
- Sidebar nav entry: already wired (`Scheduling` with CalendarClock icon)
- Deployment runbook: `docs/deployment/caldiy-nextcrm-integration.md`

**Proposals module (BetterProposals-style)**
- 3 database tables: `crm_Proposals`, `crm_Proposal_Line_Items`, `crm_Proposal_Versions`
- Migration SQL at `prisma/migrations/20260510000000_add_proposals_module/migration.sql`
- Full builder UI at `/crm/proposals` — sections editor, line items, brand settings, status workflow, version locking
- Public client-facing page at `/proposal/[token]` — client can view and one-click accept; view/accept timestamps tracked
- Demo mode: `/proposal/demo` works without a database record
- "Create proposal" button in opportunity detail actions
- Proposals nav: already in CRM sidebar menu under "Sales"

**Styling**
- AffluentOS dark theme applied: chartreuse primary (`77 91% 64%`), dark navy background (`240 13% 4%`)
- Dark mode set as default in `app/[locale]/layout.tsx`

### Why sessions stopped

The last code commit fixed a Prisma schema back-reference
(`proposalLineItems crm_Proposal_Line_Items[]` added to `crm_Products`).
The schema is now correct but `prisma generate` was never run after the fix.
The generated Prisma client is stale — it has no knowledge of the proposal models,
causing TypeScript errors across all proposal files and a broken build.

### Revival checklist — run these on the NextCRM server

```bash
# 1. Regenerate Prisma client (picks up all 3 proposal models + product back-ref)
pnpm prisma generate

# 2. Apply the proposal migration to the database
pnpm prisma migrate deploy

# 3. Verify clean compile
pnpm build
```

### Required environment variables

```env
# Cal.diy webhook (required for scheduling sync)
CALDIY_WEBHOOK_SECRET=<same-secret-as-in-caldiy-webhook-settings>

# Cal.diy API (for the /scheduling comparison UI — optional if webhook-only)
CALDIY_BASE_URL=https://your-caldiy-deployment.example.com
CALDIY_API_URL=https://your-caldiy-deployment.example.com/api/v2
CALDIY_API_KEY=cal_live_...
CALDIY_EVENT_TYPE_ID=123
CALDIY_EVENT_LENGTH_MINUTES=30
```

### Files changed in the AffluentOS theming pass

| File | What changed |
|------|-------------|
| `app/[locale]/globals.css` | Full AffluentOS CSS variable palette (dark + light) |
| `app/[locale]/layout.tsx` | `defaultTheme="dark"` on ThemeProvider |

---
