import * as cdk from "aws-cdk-lib/core";
import { Construct } from "constructs";
import { Parameter } from "../../parameter";
import { Network } from "../construct/vpc";
import { Tgw } from "../construct/tgw";
import { Nfw } from "../construct/nfw";

export class AppStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: Parameter) {
    super(scope, id, props);

    /*****************
    Pseudo
    *****************/
    const pseudo = new cdk.ScopedAws(this);

    /*****************
    VPC
    *****************/
    const nw = new Network(this, "NwConstruct", {
      pseudo: pseudo,
      ngwVpc: props.ngwVpc,
      ngwSubnets: props.ngwSubnets,
      cloudshellVpc: props.cloudshellVpc,
      cloudshellSubnets: props.cloudshellSubnets,
    });

    /*****************
    Transit Gateway
    *****************/
    const tgw = new Tgw(this, "TgwConstruct", {
      ngwVpc: nw.ngwVpc,
      ngwSubnets: nw.ngwSubnets,
      ngwPublicSubnetRtb: nw.ngwPublicSubnetRtb,
      cloudshellVpc: nw.cloudshellVpc,
      cloudshellSubnets: nw.cloudshellSubnets,
      cloudshellPrivateSubnetRtb: nw.cloudshellPrivateSubnetRtb,
    });

    /*****************
    NetworkFirewall
    *****************/
    const nfw = new Nfw(this, "NfwConstruct", {
      pseudo: pseudo,
      tgw: tgw.tgw,
      cloudshellVpc: nw.cloudshellVpc,
      cloudshellSubnets: nw.cloudshellSubnets,
    });
  }
}
