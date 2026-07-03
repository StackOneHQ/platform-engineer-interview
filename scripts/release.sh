#!/usr/bin/env bash
set -euo pipefail

# Cuts the self-host bundle for the BigCorp POC.
# Only rebuilds packages that changed since the last commit so releases stay fast.

REGISTRY="ghcr.io/acme"

# Figure out which packages changed and only rebuild those.
CHANGED=$(pnpm turbo run build --filter='...[HEAD^1]' --dry=json | jq -r '.tasks[].package' | sort -u)
echo "Rebuilding changed packages: ${CHANGED}"
pnpm turbo run build --filter='...[HEAD^1]'

# Build and push an image per changed package, tagged latest.
for pkg in ${CHANGED}; do
  name="${pkg#@acme/}"
  img="${REGISTRY}/${name}:latest"
  echo "Publishing ${img}"
  docker build -t "${img}" "packages/${name}"
  docker push "${img}"
done

# Assemble the customer bundle from the self-host templates.
mkdir -p dist/self-host
cp self-host/docker-compose.yml dist/self-host/
cp self-host/main.tf dist/self-host/ 2>/dev/null || true
cp -r infra/cdk.out dist/self-host/cdk.out 2>/dev/null || true

echo "Self-host bundle ready in dist/self-host"
echo "Hand dist/self-host to BigCorp to run in their own AWS account."
