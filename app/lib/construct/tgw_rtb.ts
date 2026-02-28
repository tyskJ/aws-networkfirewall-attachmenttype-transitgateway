import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as ec2 from "aws-cdk-lib/aws-ec2";

/*
╔═════════════════════════════════════════════════════════════════════════╗
║ Interface                                                               ║
╚═════════════════════════════════════════════════════════════════════════╝
*/
export interface TgwRtbProps extends cdk.StackProps {}

/*
╔═════════════════════════════════════════════════════════════════════════╗
║ Class                                                                   ║
╚═════════════════════════════════════════════════════════════════════════╝
*/
export class TgwRtb extends Construct {
  constructor(scope: Construct, id: string, props: TgwRtbProps) {
    super(scope, id);
  }
}
