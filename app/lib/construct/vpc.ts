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
  public readonly ngwPublicSubnetRtb: ec2.CfnRouteTable;
  public readonly cloudshellPrivateSubnetRtb: ec2.CfnRouteTable;

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
      subnetId: this.ngwSubnets["public-ngw-a"].attrSubnetId,
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
    RouteTable
    **************/
    this.ngwPublicSubnetRtb = new ec2.CfnRouteTable(
      this,
      "NgwPublicNgwSubnetRtb",
      {
        vpcId: this.ngwVpc.attrVpcId,
        tags: [
          {
            key: "Name",
            value: "ngwvpc-public-ngw-subnet-rtb",
          },
        ],
      },
    );
    new ec2.CfnRoute(this, "ToIgw", {
      routeTableId: this.ngwPublicSubnetRtb.attrRouteTableId,
      destinationCidrBlock: "0.0.0.0/0",
      gatewayId: igw.attrInternetGatewayId,
    });
    new ec2.CfnSubnetRouteTableAssociation(this, "NgwPublicNgwSubnetRtbAssoc", {
      routeTableId: this.ngwPublicSubnetRtb.attrRouteTableId,
      subnetId: this.ngwSubnets["public-ngw-a"].attrSubnetId,
    });
    const ngwPrivateTgwSubnetRtb = new ec2.CfnRouteTable(
      this,
      "NgwPrivateTgwSubnetRtb",
      {
        vpcId: this.ngwVpc.attrVpcId,
        tags: [
          {
            key: "Name",
            value: "ngwvpc-private-tgw-subnet-rtb",
          },
        ],
      },
    );
    new ec2.CfnRoute(this, "ToNgw", {
      routeTableId: ngwPrivateTgwSubnetRtb.attrRouteTableId,
      destinationCidrBlock: "0.0.0.0/0",
      natGatewayId: ngwAzA.attrNatGatewayId,
    });
    new ec2.CfnSubnetRouteTableAssociation(
      this,
      "NgwPrivateTgwSubnetRtbAssoc",
      {
        routeTableId: ngwPrivateTgwSubnetRtb.attrRouteTableId,
        subnetId: this.ngwSubnets["private-tgw-a"].attrSubnetId,
      },
    );

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
    /**************
    CloudShell Subnet
    **************/
    this.cloudshellSubnets = this.createSubnet(
      this,
      props.pseudo,
      this.cloudshellVpc,
      props.cloudshellSubnets,
    );
    /**************
    RouteTable
    **************/
    this.cloudshellPrivateSubnetRtb = new ec2.CfnRouteTable(
      this,
      "CloudShellPrivateSubnetRtb",
      {
        vpcId: this.cloudshellVpc.attrVpcId,
        tags: [
          {
            key: "Name",
            value: "cloudshellvpc-private-subnet-rtb",
          },
        ],
      },
    );
    new ec2.CfnSubnetRouteTableAssociation(
      this,
      "CloudShellPrivateSubnetRtbAssoc",
      {
        routeTableId: this.cloudshellPrivateSubnetRtb.attrRouteTableId,
        subnetId: this.cloudshellSubnets["private-cloudshell-a"],
      },
    );
    const cloudshellPrivateTgwSubnetRtb = new ec2.CfnRouteTable(
      this,
      "CloudSHellPrivateTgwSubnetRtb",
      {
        vpcId: this.cloudshellVpc.attrVpcId,
        tags: [
          {
            key: "Name",
            value: "cloudshellvpc-private-tgw-subnet-rtb",
          },
        ],
      },
    );
    new ec2.CfnSubnetRouteTableAssociation(
      this,
      "CloudShellPrivateTgwSubnetRtbAssoc",
      {
        routeTableId: cloudshellPrivateTgwSubnetRtb.attrRouteTableId,
        subnetId: this.cloudshellSubnets["private-tgw-a"].attrSubnetId,
      },
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
