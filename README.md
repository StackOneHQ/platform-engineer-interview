# Acme Platform — Senior Platform Engineer Interview

Welcome, and thanks for making the time.

> **⚠️ Confidential interview material.** This is a private StackOne hiring exercise. Please don't fork it, share it, or post it (or your review) publicly. It's a synthetic scenario for a fictional company ("Acme") — not real StackOne infrastructure or production code, and not a reference implementation to copy from.

This repository is a small, deliberately realistic slice of the Acme platform. It is an **interview artifact, not a deployable app** — some things are stubbed and you should not expect `pnpm install` to produce a running system. Treat it the way you'd treat a real codebase you just got read access to.

## The task

You're reviewing **PR #1** (`feat/add-billing-service` → `main`) as if it's going to production this afternoon. A teammate put it together quickly (with a lot of AI assistance) to unblock the BigCorp proof-of-concept. It touches infrastructure, CI, and a new service.

Spend about **30 minutes** ahead of the call. Use any tools you like, including AI assistants — we do, and we'd rather see how you actually work than watch you pretend not to.

Come to the call ready to:

1. **Walk us through your review**, ranked by what worries you most about shipping this to prod. Assume you have merge rights and the author is waiting on you.
2. **Talk through the CDK → Terraform migration.** We're mid-flight moving this stack from AWS CDK to Terraform on live production. How would you sequence it without downtime?
3. **Reason about the monorepo CI and the self-host release.** We're standing up our first customer-run ("bring your own cloud") bundle for BigCorp. What do you make of the approach here?
4. **Work an incident.** `docs/signals.md` is a snapshot from a live page. We'll dig into it together.

## Getting oriented

- `docs/architecture.md` — how the platform runs today
- `docs/signals.md` — the incident snapshot for part 4
- `infra/` — AWS CDK (TypeScript)
- `packages/` — services and the shared library
- `.github/workflows/ci.yml` — CI
- `PR_DESCRIPTION.md` — the author's write-up of the PR (on the feature branch)

To see the change under review:

```bash
git diff main..feat/add-billing-service
```

There are no trick questions and no single "right" answer. We care about how you reason about risk, sequencing, and trade-offs on a live system. See you on the call.
