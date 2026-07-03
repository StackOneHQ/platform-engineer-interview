import { Stack, StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import * as ec2 from "aws-cdk-lib/aws-ec2";

/**
 * Core networking: one VPC across two AZs with three subnet tiers
 * (public / private-with-egress / isolated) and one NAT gateway.
 */
export class NetworkStack extends Stack {
  public readonly vpc: ec2.Vpc;
  public readonly sharedSg: ec2.SecurityGroup;

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    this.vpc = new ec2.Vpc(this, "CoreVpc", {
      maxAzs: 2,
      natGateways: 1,
      subnetConfiguration: [
        { name: "public", subnetType: ec2.SubnetType.PUBLIC, cidrMask: 24 },
        { name: "private", subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS, cidrMask: 24 },
        { name: "data", subnetType: ec2.SubnetType.PRIVATE_ISOLATED, cidrMask: 24 },
      ],
    });

    // Shared SG for internal Fargate services. Egress open; ingress is added
    // per-service so only the ALB can reach a service's app port.
    this.sharedSg = new ec2.SecurityGroup(this, "SharedServiceSg", {
      vpc: this.vpc,
      description: "Shared SG for internal Fargate services",
      allowAllOutbound: true,
    });
  }
}
