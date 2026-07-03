# Acme Platform — Current Architecture

_Platform team onboarding notes. Kept short on purpose._

## Overview

Acme runs a small TypeScript monorepo (pnpm workspaces + Turborepo) on AWS. Everything lives in a single region, **eu-west-2**. Infrastructure is defined in **AWS CDK (TypeScript)** under `infra/` and deployed from CI.

> A separate, in-flight effort is migrating the infrastructure from CDK to **Terraform**. That work is tracked elsewhere and is not part of this repo. Assume production stays live throughout the migration.

## Runtime

- **Compute:** AWS ECS Fargate, fronted by an **Application Load Balancer (ALB)**.
- **Services:**
  - `orders-api` — live, serving production traffic today.
  - `billing-api` — incoming, see PR #1.
- **Database:** Aurora PostgreSQL, the **"core"** cluster. One writer, one reader. Holds orders and (soon) billing data.
- **Cache:** ElastiCache for Redis, the "core" cache.
- **Shared code:** `@acme/shared`, consumed by every service.

## Networking

- One VPC, two AZs.
- Three subnet tiers: **public** (ALB + NAT), **private-with-egress** (Fargate tasks), **isolated** (Aurora, Redis).
- One NAT gateway for egress from private subnets.
- The internet-facing ALB terminates TLS. Tasks are reachable only from the ALB; east-west traffic stays inside the VPC.

## CI/CD

- GitHub Actions.
- On every PR, CI **runs the full test suite across the monorepo** plus a build. Thorough but slow — a full run is **~35 minutes**.
- Production deploys run from `main` after merge.

## Conventions

- Secrets live in **AWS Secrets Manager** and are injected into tasks at runtime. They are not baked into task definitions or container images.
- Security groups are scoped so only the ALB can reach a service's app port. Traffic between services stays inside the VPC.
- Container images are published to ECR and referenced by **immutable** tags.
- Stateful resources (Aurora, ElastiCache) use `RETAIN` removal policies.
