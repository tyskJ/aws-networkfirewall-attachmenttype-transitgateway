import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";

/*
╔═════════════════════════════════════════════════════════════════════════╗
║ Interface                                                               ║
╚═════════════════════════════════════════════════════════════════════════╝
*/
export interface NfwProps extends cdk.StackProps {}

/*
╔═════════════════════════════════════════════════════════════════════════╗
║ Class                                                                   ║
╚═════════════════════════════════════════════════════════════════════════╝
*/
export class Nfw extends Construct {
  constructor(scope: Construct, id: string, props: NfwProps) {
    super(scope, id);
  }
}
