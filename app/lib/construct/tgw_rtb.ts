import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as networkfirewall from "aws-cdk-lib/aws-networkfirewall";

/*
╔═════════════════════════════════════════════════════════════════════════╗
║ Interface                                                               ║
╚═════════════════════════════════════════════════════════════════════════╝
*/
export interface TgwRtbProps extends cdk.StackProps {
  tgw: ec2.CfnTransitGateway;
  ngwVpcAttachment: ec2.CfnTransitGatewayAttachment;
  cloudshellVpcAttachment: ec2.CfnTransitGatewayAttachment;
  nfw: networkfirewall.CfnFirewall;
  cloudshellVpc: ec2.CfnVPC;
}

/*
╔═════════════════════════════════════════════════════════════════════════╗
║ Class                                                                   ║
╚═════════════════════════════════════════════════════════════════════════╝
*/
export class TgwRtb extends Construct {
  constructor(scope: Construct, id: string, props: TgwRtbProps) {
    super(scope, id);

    /**************
    TGW RTB
    **************/
    const tgwRtbNgw = new ec2.CfnTransitGatewayRouteTable(this, "TgwRtbNgw", {
      transitGatewayId: props.tgw.attrId,
      tags: [
        {
          key: "Name",
          value: "tgw-rtb-for-ngw-vpc",
        },
      ],
    });
    const tgwRtbCloudshell = new ec2.CfnTransitGatewayRouteTable(
      this,
      "TgwRtbCloudshell",
      {
        transitGatewayId: props.tgw.attrId,
        tags: [
          {
            key: "Name",
            value: "tgw-rtb-for-cloudshell-vpc",
          },
        ],
      },
    );
    const tgwRtbNfw = new ec2.CfnTransitGatewayRouteTable(this, "TgwRtbNfw", {
      transitGatewayId: props.tgw.attrId,
      tags: [
        {
          key: "Name",
          value: "tgw-rtb-for-nfw",
        },
      ],
    });
    /**************
    TGW RTB Assoc
    **************/
    new ec2.CfnTransitGatewayRouteTableAssociation(this, "TgwRtbNgwAssoc", {
      transitGatewayAttachmentId: props.ngwVpcAttachment.attrId,
      transitGatewayRouteTableId: tgwRtbNgw.attrTransitGatewayRouteTableId,
    });
    new ec2.CfnTransitGatewayRouteTableAssociation(
      this,
      "TgwRtbCloudshellAssoc",
      {
        transitGatewayAttachmentId: props.cloudshellVpcAttachment.attrId,
        transitGatewayRouteTableId:
          tgwRtbCloudshell.attrTransitGatewayRouteTableId,
      },
    );
    new ec2.CfnTransitGatewayRouteTableAssociation(this, "TgwRtbNfwAssoc", {
      transitGatewayAttachmentId: props.nfw.attrTransitGatewayAttachmentId,
      transitGatewayRouteTableId: tgwRtbNfw.attrTransitGatewayRouteTableId,
    });
    /**************
    Route
    **************/
    new ec2.CfnTransitGatewayRoute(this, "TgwRtbCloudshellToNfw", {
      transitGatewayRouteTableId:
        tgwRtbCloudshell.attrTransitGatewayRouteTableId,
      destinationCidrBlock: "0.0.0.0/0",
      blackhole: false,
      transitGatewayAttachmentId: props.nfw.attrTransitGatewayAttachmentId,
    });
    new ec2.CfnTransitGatewayRoute(this, "TgwRtbNgwToNfw", {
      transitGatewayRouteTableId: tgwRtbNgw.attrTransitGatewayRouteTableId,
      destinationCidrBlock: props.cloudshellVpc.cidrBlock!,
      blackhole: false,
      transitGatewayAttachmentId: props.nfw.attrTransitGatewayAttachmentId,
    });
    new ec2.CfnTransitGatewayRoute(this, "TgwRtbNfwToNgw", {
      transitGatewayRouteTableId: tgwRtbNfw.attrTransitGatewayRouteTableId,
      destinationCidrBlock: "0.0.0.0/0",
      blackhole: false,
      transitGatewayAttachmentId: props.ngwVpcAttachment.attrId,
    });
    new ec2.CfnTransitGatewayRoute(this, "TgwRtbNfwCloudshell", {
      transitGatewayRouteTableId: tgwRtbNfw.attrTransitGatewayRouteTableId,
      destinationCidrBlock: props.cloudshellVpc.cidrBlock!,
      blackhole: false,
      transitGatewayAttachmentId: props.cloudshellVpcAttachment.attrId,
    });
  }
}
