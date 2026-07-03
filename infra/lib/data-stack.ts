import { Stack, StackProps, RemovalPolicy } from "aws-cdk-lib";
import { Construct } from "constructs";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as rds from "aws-cdk-lib/aws-rds";
import * as elasticache from "aws-cdk-lib/aws-elasticache";

interface DataStackProps extends StackProps {
  vpc: ec2.Vpc;
}

/**
 * Stateful "core" tier: the Aurora Postgres cluster and the Redis cache.
 * Both live in isolated subnets and are retained on stack deletion.
 */
export class DataStack extends Stack {
  public readonly cluster: rds.DatabaseCluster;

  constructor(scope: Construct, id: string, props: DataStackProps) {
    super(scope, id, props);
    const { vpc } = props;

    this.cluster = new rds.DatabaseCluster(this, "CoreCluster", {
      clusterIdentifier: "acme-core",
      engine: rds.DatabaseClusterEngine.auroraPostgres({
        version: rds.AuroraPostgresEngineVersion.VER_15_4,
      }),
      credentials: rds.Credentials.fromGeneratedSecret("acme_core_admin", {
        secretName: "acme/core/db-credentials",
      }),
      writer: rds.ClusterInstance.provisioned("writer", {
        instanceType: ec2.InstanceType.of(ec2.InstanceClass.R6G, ec2.InstanceSize.LARGE),
        publiclyAccessible: false,
      }),
      readers: [
        rds.ClusterInstance.provisioned("reader1", {
          instanceType: ec2.InstanceType.of(ec2.InstanceClass.R6G, ec2.InstanceSize.LARGE),
        }),
      ],
      vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_ISOLATED },
      storageEncrypted: true,
      removalPolicy: RemovalPolicy.RETAIN,
    });

    const redisSubnets = new elasticache.CfnSubnetGroup(this, "RedisSubnets", {
      description: "core redis subnets",
      subnetIds: vpc.selectSubnets({ subnetType: ec2.SubnetType.PRIVATE_ISOLATED }).subnetIds,
    });

    new elasticache.CfnReplicationGroup(this, "CoreRedis", {
      replicationGroupDescription: "core cache",
      engine: "redis",
      cacheNodeType: "cache.r6g.large",
      numCacheClusters: 2,
      cacheSubnetGroupName: redisSubnets.ref,
      atRestEncryptionEnabled: true,
      transitEncryptionEnabled: true,
    });
  }
}
