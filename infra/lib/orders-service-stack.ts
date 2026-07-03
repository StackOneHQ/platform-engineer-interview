import { Stack, StackProps, Duration } from "aws-cdk-lib";
import { Construct } from "constructs";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as ecs from "aws-cdk-lib/aws-ecs";
import * as ecr from "aws-cdk-lib/aws-ecr";
import * as elbv2 from "aws-cdk-lib/aws-elasticloadbalancingv2";
import * as iam from "aws-cdk-lib/aws-iam";
import * as secretsmanager from "aws-cdk-lib/aws-secretsmanager";
import * as rds from "aws-cdk-lib/aws-rds";

interface OrdersServiceStackProps extends StackProps {
  vpc: ec2.Vpc;
  cluster: rds.DatabaseCluster;
  sharedSg: ec2.SecurityGroup;
}

/**
 * The existing orders-api Fargate service, behind an internet-facing ALB.
 * DB credentials come from Secrets Manager; the task role is scoped to just
 * the secret it needs.
 */
export class OrdersServiceStack extends Stack {
  constructor(scope: Construct, id: string, props: OrdersServiceStackProps) {
    super(scope, id, props);
    const { vpc, cluster } = props;

    const ecsCluster = new ecs.Cluster(this, "OrdersCluster", {
      vpc,
      containerInsights: true,
    });

    const repo = ecr.Repository.fromRepositoryName(this, "OrdersRepo", "acme/orders-api");

    const dbSecret = secretsmanager.Secret.fromSecretNameV2(
      this,
      "OrdersDbSecret",
      "acme/core/db-credentials",
    );

    const taskDef = new ecs.FargateTaskDefinition(this, "OrdersTaskDef", {
      cpu: 512,
      memoryLimitMiB: 1024,
    });

    taskDef.taskRole.addToPrincipalPolicy(
      new iam.PolicyStatement({
        actions: ["secretsmanager:GetSecretValue"],
        resources: [dbSecret.secretArn],
      }),
    );

    taskDef.addContainer("orders", {
      image: ecs.ContainerImage.fromEcrRepository(repo, "1.8.2"),
      logging: ecs.LogDrivers.awsLogs({ streamPrefix: "orders-api" }),
      portMappings: [{ containerPort: 8080 }],
      environment: {
        NODE_ENV: "production",
        PORT: "8080",
      },
      secrets: {
        DATABASE_URL: ecs.Secret.fromSecretsManager(dbSecret, "url"),
      },
    });

    const serviceSg = new ec2.SecurityGroup(this, "OrdersServiceSg", {
      vpc,
      description: "orders-api tasks",
      allowAllOutbound: true,
    });

    const service = new ecs.FargateService(this, "OrdersService", {
      cluster: ecsCluster,
      taskDefinition: taskDef,
      desiredCount: 3,
      securityGroups: [serviceSg],
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
      healthCheckGracePeriod: Duration.seconds(60),
    });

    const alb = new elbv2.ApplicationLoadBalancer(this, "OrdersAlb", {
      vpc,
      internetFacing: true,
    });

    const listener = alb.addListener("Https", { port: 443, open: true });

    listener.addTargets("OrdersTargets", {
      port: 8080,
      targets: [service],
      healthCheck: { path: "/healthz", interval: Duration.seconds(15) },
      deregistrationDelay: Duration.seconds(30),
    });

    // Only the ALB may reach the task app port.
    serviceSg.connections.allowFrom(alb, ec2.Port.tcp(8080), "ALB to orders tasks");

    cluster.connections.allowDefaultPortFrom(serviceSg, "orders-api to core");
  }
}
