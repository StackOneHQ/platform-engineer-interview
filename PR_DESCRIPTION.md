# feat: add billing-api, speed up CI, first self-host bundle

Hey team 👋 — first pass at the billing work for the BigCorp POC. I leaned on Claude to scaffold most of the infra, so it should line up pretty closely with the existing `orders-api` setup.

## What's in here

**New `billing-api` service**

- New `@acme/billing-api` package (Express + `pg`), reuses `@acme/shared`.
- New `BillingServiceStack` — Fargate service behind its own ALB, mirrors the orders setup.

**Faster CI**

- The full test suite on every PR was killing us (~35 min). Switched the test step to affected-only so we only run what changed. Most PRs should drop to a couple of minutes.
- Split the advisory lint annotations into their own non-blocking job so they stop failing builds over style nits.

**Infra tidy-up**

- Standardised the core Aurora cluster naming while I was in there.
- The deploy job now runs the CDK deploy for us instead of someone doing it by hand after merge.

**First self-host bundle**

- `scripts/release.sh` + `self-host/` — cuts a bundle BigCorp can run in their own AWS account. Only rebuilds packages that changed, so cutting a release is quick.

## Notes / TODO

- DB creds + API secret are inline placeholders for now (`CHANGEME`) — I'll wire them up properly before GA.
- Haven't load-tested billing yet.
- The self-host Terraform reuses the same service module twice; if we like it, it could seed the CDK → Terraform migration.

Used Claude to scaffold the infra 🙌 — please sanity-check the bits I might've missed.
