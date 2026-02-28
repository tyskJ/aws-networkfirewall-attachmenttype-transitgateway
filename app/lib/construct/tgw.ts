import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import { subnetKey } from "../../parameter";

/*
╔═════════════════════════════════════════════════════════════════════════╗
║ Interface                                                               ║
╚═════════════════════════════════════════════════════════════════════════╝
*/
export interface TgwProps extends cdk.StackProps {
  ngwVpc: ec2.CfnVPC;
  ngwSubnets: Record<subnetKey, ec2.CfnSubnet>;
  ngwPublicSubnetRtb: ec2.CfnRouteTable;
  cloudshellVpc: ec2.CfnVPC;
  cloudshellSubnets: Record<subnetKey, ec2.CfnSubnet>;
  cloudshellPrivateSubnetRtb: ec2.CfnRouteTable;
}

/*
╔═════════════════════════════════════════════════════════════════════════╗
║ Class                                                                   ║
╚═════════════════════════════════════════════════════════════════════════╝
*/
export class Tgw extends Construct {
  constructor(scope: Construct, id: string, props: TgwProps) {
    super(scope, id);

    /**************
    TGW
    **************/
    const tgw = new ec2.CfnTransitGateway(this, "Tgw", {
      amazonSideAsn: 64512,
      autoAcceptSharedAttachments: "disable",
      defaultRouteTableAssociation: "disable",
      defaultRouteTablePropagation: "disable",
      description: "Verify NFW Attachment Type",
      dnsSupport: "enable",
      encryptionSupport: "disable",
      multicastSupport: "disable",
      securityGroupReferencingSupport: "enable",
      vpnEcmpSupport: "disable",
      tags: [
        {
          key: "Name",
          value: "tgw",
        },
      ],
    });
    /**************
    TGW Attachment
    **************/
    const ngwVpcAttachment = new ec2.CfnTransitGatewayAttachment(
      this,
      "NgwVpcAttachment",
      {
        vpcId: props.ngwVpc.attrVpcId,
        subnetIds: [props.ngwSubnets["private-tgw-a"].attrSubnetId],
        transitGatewayId: tgw.attrId,
        options: {
          ApplianceModeSupport: "disable",
          DnsSupport: "enable",
          Ipv6Support: "disable",
          SecurityGroupReferencingSupport: "enable",
        },
        tags: [
          {
            key: "Name",
            value: "tgw-attachment-ngw-vpc-az-a",
          },
        ],
      },
    );
    const cloudshellVpcAttachment = new ec2.CfnTransitGatewayAttachment(
      this,
      "CloudShellVpcAttachment",
      {
        vpcId: props.cloudshellVpc.attrVpcId,
        subnetIds: [props.cloudshellSubnets["private-tgw-a"].attrSubnetId],
        transitGatewayId: tgw.attrId,
        options: {
          ApplianceModeSupport: "disable",
          DnsSupport: "enable",
          Ipv6Support: "disable",
          SecurityGroupReferencingSupport: "enable",
        },
        tags: [
          {
            key: "Name",
            value: "tgw-attachment-cloudshell-vpc-az-a",
          },
        ],
      },
    );
  }
}
