import * as cdk from "aws-cdk-lib/core";
import { Construct } from "constructs";
import { Parameter } from "../../parameter";
import { Network } from "../construct/vpc";
import { Tgw } from "../construct/tgw";

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
  }
}
