# Thin self-host module for BigCorp — deploys the Acme services into the
# customer's own AWS account. Mirrors the internal CDK stacks closely enough
# for the POC, and doubles as an early reference for the CDK -> Terraform work.

terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.0"
    }
  }
}

variable "region" {
  type    = string
  default = "eu-west-2"
}

variable "database_url" {
  type      = string
  sensitive = true
}

variable "api_secret" {
  type      = string
  sensitive = true
}

provider "aws" {
  region = var.region
}

locals {
  registry = "ghcr.io/acme"
  images = {
    orders  = "${local.registry}/orders-api:latest"
    billing = "${local.registry}/billing-api:latest"
  }
}

# Customer runs `terraform apply` against their own account.
# Images are pulled by the `:latest` tag published by scripts/release.sh.
module "orders" {
  source    = "./modules/service"
  name      = "orders-api"
  image     = local.images.orders
  region    = var.region
  extra_env = { DATABASE_URL = var.database_url }
}

module "billing" {
  source    = "./modules/service"
  name      = "billing-api"
  image     = local.images.billing
  region    = var.region
  extra_env = { DATABASE_URL = var.database_url, API_SECRET = var.api_secret }
}
