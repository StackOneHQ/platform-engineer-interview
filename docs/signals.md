# Incident Snapshot — for the live round

A point-in-time capture from a page that fired earlier. We'll work through it together on the call, so there's no need to prepare an answer. It's here so you can see the same picture we did.

## Datadog — `core` / `orders-api`

- **p99 latency** on `orders-api` climbing from ~120ms to ~900ms over about 15 minutes.
- **ECS running task count** for `orders-api` sawtoothing between **6 and 2** — tasks coming up, failing health checks, getting replaced, repeating.
- **ALB 5xx rate** rising in step with the latency.
- **Aurora `core`** writer CPU and connection count both elevated.

## Deploy markers

- `billing-api` deploy — **20 minutes ago**.
- No `orders-api` deploy in the last 24h.

## Slack — #platform-oncall

> **09:14** did anyone change the core RDS parameter group? seeing connection saturation on the writer
> **09:15** billing went out ~20 min ago, could be related
> **09:16** orders tasks are flapping, health checks timing out

## AWS cost — last full month

| Line item | Cost |
| --- | --- |
| NAT Gateway — data processing | **$4,180** |
| Aurora (core) | $3,050 |
| ECS Fargate | $2,110 |
| Inter-AZ data transfer | **$1,870** |
| CloudWatch + Datadog log ingestion | $920 |

_NAT data processing and inter-AZ transfer are both running noticeably hotter than we'd expect for this traffic level._
