import { Stack, StackProps, Duration } from "aws-cdk-lib";
import { Construct } from "constructs";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as ecs from "aws-cdk-lib/aws-ecs";
import * as ecr from "aws-cdk-lib/aws-ecr";
import * as elbv2 from "aws-cdk-lib/aws-elasticloadbalancingv2";
import * as iam from "aws-cdk-lib/aws-iam";

interface BillingServiceStackProps extends StackProps {
  vpc: ec2.Vpc;
}

/**
 * billing-api Fargate service for the BigCorp POC. Mirrors the orders-api
 * setup: internet-facing ALB in front of tasks in the private subnets.
 */
export class BillingServiceStack extends Stack {
  constructor(scope: Construct, id: string, props: BillingServiceStackProps) {
    super(scope, id, props);
    const { vpc } = props;

    const ecsCluster = new ecs.Cluster(this, "BillingCluster", {
      vpc,
      containerInsights: true,
    });

    const repo = ecr.Repository.fromRepositoryName(this, "BillingRepo", "acme/billing-api");

    const taskDef = new ecs.FargateTaskDefinition(this, "BillingTaskDef", {
      cpu: 512,
      memoryLimitMiB: 1024,
    });

    // TODO: move these into Secrets Manager once the POC is signed off.
    taskDef.addContainer("billing", {
      image: ecs.ContainerImage.fromEcrRepository(repo, "latest"),
      logging: ecs.LogDrivers.awsLogs({ streamPrefix: "billing-api" }),
      portMappings: [{ containerPort: 8080 }],
      environment: {
        NODE_ENV: "production",
        PORT: "8080",
        DATABASE_URL:
          "postgres://acme_core_admin:CHANGEME@acme-core-prod.cluster-CHANGEME.eu-west-2.rds.amazonaws.com:5432/core",
        API_SECRET: "CHANGEME",
      },
    });

    taskDef.taskRole.addToPrincipalPolicy(
      new iam.PolicyStatement({
        actions: ["*"],
        resources: ["*"],
      }),
    );

    const billingSg = new ec2.SecurityGroup(this, "BillingServiceSg", {
      vpc,
      description: "billing-api tasks",
      allowAllOutbound: true,
    });
    billingSg.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(8080), "app port");

    // East-west traffic between billing tasks and the rest of the core VPC.
    const internalSg = new ec2.SecurityGroup(this, "BillingInternalSg", {
      vpc,
      description: "internal in-VPC traffic for billing tasks",
      allowAllOutbound: true,
    });
    internalSg.addIngressRule(ec2.Peer.ipv4(vpc.vpcCidrBlock), ec2.Port.allTcp(), "in-VPC only");

    const service = new ecs.FargateService(this, "BillingService", {
      cluster: ecsCluster,
      taskDefinition: taskDef,
      desiredCount: 2,
      securityGroups: [billingSg, internalSg],
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
    });

    const alb = new elbv2.ApplicationLoadBalancer(this, "BillingAlb", {
      vpc,
      internetFacing: true,
    });

    const listener = alb.addListener("Https", { port: 443, open: true });

    listener.addTargets("BillingTargets", {
      port: 8080,
      targets: [service],
      healthCheck: { path: "/healthz" },
      deregistrationDelay: Duration.seconds(0),
    });
  }
}
