#!/usr/bin/env node
import { App } from "aws-cdk-lib";
import { NetworkStack } from "../lib/network-stack";
import { DataStack } from "../lib/data-stack";
import { OrdersServiceStack } from "../lib/orders-service-stack";
import { BillingServiceStack } from "../lib/billing-service-stack";

const app = new App();
const env = { account: process.env.CDK_DEFAULT_ACCOUNT, region: "eu-west-2" };

const network = new NetworkStack(app, "AcmeNetwork", { env });

const data = new DataStack(app, "AcmeData", {
  env,
  vpc: network.vpc,
});

new OrdersServiceStack(app, "AcmeOrders", {
  env,
  vpc: network.vpc,
  cluster: data.cluster,
  sharedSg: network.sharedSg,
});

new BillingServiceStack(app, "AcmeBilling", {
  env,
  vpc: network.vpc,
});

app.synth();
