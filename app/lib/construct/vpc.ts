import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import { vpcInfo, subnetInfo, subnetKey } from "../../parameter";

/*
╔═════════════════════════════════════════════════════════════════════════╗
║ Interface                                                               ║
╚═════════════════════════════════════════════════════════════════════════╝
*/
export interface VpcProps extends cdk.StackProps {
  pseudo: cdk.ScopedAws;
  ngwVpc: vpcInfo;
  ngwSubnets: subnetInfo;
  cloudshellVpc: vpcInfo;
  cloudshellSubnets: subnetInfo;
}

/*
╔═════════════════════════════════════════════════════════════════════════╗
║ Class                                                                   ║
╚═════════════════════════════════════════════════════════════════════════╝
*/
export class Network extends Construct {
  public readonly ngwVpc: ec2.CfnVPC;
  public readonly ngwSubnets: Record<subnetKey, ec2.CfnSubnet>;
  public readonly cloudshellVpc: ec2.CfnVPC;
  public readonly cloudshellSubnets: Record<subnetKey, ec2.CfnSubnet>;

  constructor(scope: Construct, id: string, props: VpcProps) {
    super(scope, id);

    /**************
    NGW VPC
    **************/
    this.ngwVpc = new ec2.CfnVPC(this, props.ngwVpc.id, {
      cidrBlock: props.ngwVpc.cidrBlock,
      enableDnsHostnames: props.ngwVpc.dnsHost,
      enableDnsSupport: props.ngwVpc.dnsSupport,
    });
    for (const tag of props.ngwVpc.tags) {
      cdk.Tags.of(this.ngwVpc).add(tag.key, tag.value);
    }
    /**************
    NGW Subnet
    **************/
    this.ngwSubnets = this.createSubnet(
      this,
      props.pseudo,
      this.ngwVpc,
      props.ngwSubnets,
    );
    /**************
    Internet Gateway
    **************/
    const igw = new ec2.CfnInternetGateway(this, "Igw", {
      tags: [
        {
          key: "Name",
          value: "igw",
        },
      ],
    });
    const igwAttach = new ec2.CfnVPCGatewayAttachment(this, "IgwAttach", {
      vpcId: this.ngwVpc.attrVpcId,
      internetGatewayId: igw.attrInternetGatewayId,
    });
    /**************
    NAT Gateway
    **************/
    const eip = new ec2.CfnEIP(this, "Eip", {
      tags: [
        {
          key: "Name",
          value: "ngw-eip-a",
        },
      ],
    });
    const ngwAzA = new ec2.CfnNatGateway(this, "NgwAzA", {
      subnetId: this.ngwSubnets["public-a"].attrSubnetId,
      allocationId: eip.attrAllocationId,
      availabilityMode: "zonal",
      connectivityType: "public",
      tags: [
        {
          key: "Name",
          value: "ngw-az-a",
        },
      ],
    });
    ngwAzA.addDependency(igwAttach);
    /**************
    CloudShell VPC
    **************/
    this.cloudshellVpc = new ec2.CfnVPC(this, props.cloudshellVpc.id, {
      cidrBlock: props.cloudshellVpc.cidrBlock,
      enableDnsHostnames: props.cloudshellVpc.dnsHost,
      enableDnsSupport: props.cloudshellVpc.dnsSupport,
    });
    for (const tag of props.cloudshellVpc.tags) {
      cdk.Tags.of(this.cloudshellVpc).add(tag.key, tag.value);
    }
    this.cloudshellSubnets = this.createSubnet(
      this,
      props.pseudo,
      this.cloudshellVpc,
      props.cloudshellSubnets,
    );
  }
  /*
  ╔═══════════════════════════════════════════════════════════════════════╗
  ║ Private Method                                                        ║
  ╚═══════════════════════════════════════════════════════════════════════╝
  */
  private createSubnet(
    scope: Construct,
    pseudo: cdk.ScopedAws,
    vpc: ec2.CfnVPC,
    subnets: subnetInfo,
  ): Record<subnetKey, ec2.CfnSubnet> {
    const subnetsObject = {} as Record<subnetKey, ec2.CfnSubnet>;
    for (const subnetDef of subnets) {
      const subnet = new ec2.CfnSubnet(scope, subnetDef.id, {
        vpcId: vpc.attrVpcId,
        cidrBlock: subnetDef.cidrBlock,
        availabilityZone: `${pseudo.region}${subnetDef.availabilityZone}`,
        mapPublicIpOnLaunch: subnetDef.mapPublicIpOnLaunch,
      });
      for (const tag of subnetDef.tags) {
        cdk.Tags.of(subnet).add(tag.key, tag.value);
      }
      subnetsObject[subnetDef.key] = subnet;
    }
    return subnetsObject;
  }
}
