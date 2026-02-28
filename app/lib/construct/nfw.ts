import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as networkfirewall from "aws-cdk-lib/aws-networkfirewall";
import * as logs from "aws-cdk-lib/aws-logs";
import { subnetKey } from "../../parameter";

/*
╔═════════════════════════════════════════════════════════════════════════╗
║ Interface                                                               ║
╚═════════════════════════════════════════════════════════════════════════╝
*/
export interface NfwProps extends cdk.StackProps {
  pseudo: cdk.ScopedAws;
  cloudshellVpc: ec2.CfnVPC;
  cloudshellSubnets: Record<subnetKey, ec2.CfnSubnet>;
  tgw: ec2.CfnTransitGateway;
}

/*
╔═════════════════════════════════════════════════════════════════════════╗
║ Class                                                                   ║
╚═════════════════════════════════════════════════════════════════════════╝
*/
export class Nfw extends Construct {
  constructor(scope: Construct, id: string, props: NfwProps) {
    super(scope, id);

    /**************
    RuleGroup
    **************/
    const allowListRuleGroup = new networkfirewall.CfnRuleGroup(
      this,
      "AllowListRuleGroup",
      {
        capacity: 100,
        ruleGroupName: "allow-domainlist-statefull-rulegroup",
        type: "STATEFUL",
        ruleGroup: {
          statefulRuleOptions: {
            ruleOrder: "STRICT_ORDER",
          },
          ruleVariables: {
            ipSets: {
              HOME_NET: {
                definition: [props.cloudshellVpc.cidrBlock!],
              },
            },
          },
          rulesSource: {
            rulesSourceList: {
              generatedRulesType: "ALLOWLIST",
              targets: [".amazon.com", "google.com"],
              targetTypes: ["TLS_SNI", "HTTP_HOST"],
            },
          },
        },
        tags: [
          {
            key: "Name",
            value: "allow-domainlist-statefull-rulegroup",
          },
        ],
      },
    );
    /**************
    Firewall Policy
    **************/
    const nfwPolicy = new networkfirewall.CfnFirewallPolicy(this, "NfwPolicy", {
      firewallPolicyName: "nfw-policy",
      firewallPolicy: {
        statelessDefaultActions: ["aws:forward_to_sfe"],
        statelessFragmentDefaultActions: ["aws:forward_to_sfe"],
        statefulEngineOptions: {
          ruleOrder: "STRICT_ORDER",
          streamExceptionPolicy: "DROP",
          flowTimeouts: {
            tcpIdleTimeoutSeconds: 350,
          },
        },
        statefulDefaultActions: [
          "aws:alert_established",
          "aws:drop_established",
        ],
        statefulRuleGroupReferences: [
          {
            priority: 1,
            resourceArn: `arn:${props.pseudo.partition}:network-firewall:${props.pseudo.region}:aws-managed:stateful-rulegroup/AttackInfrastructureStrictOrder`,
          },
          {
            priority: 2,
            resourceArn: allowListRuleGroup.attrRuleGroupArn,
          },
        ],
      },
      tags: [
        {
          key: "Name",
          value: "nfw-policy",
        },
      ],
    });
    /**************
    Firewall
    **************/
    const nfw = new networkfirewall.CfnFirewall(this, "Nfw", {
      firewallName: "nfw",
      transitGatewayId: props.tgw.attrId,
      availabilityZoneMappings: [
        {
          availabilityZone:
            props.cloudshellSubnets["private-tgw-a"].attrAvailabilityZoneId,
        },
      ],
      deleteProtection: false,
      availabilityZoneChangeProtection: false,
      enabledAnalysisTypes: ["HTTP_HOST", "TLS_SNI"],
      firewallPolicyArn: nfwPolicy.attrFirewallPolicyArn,
      tags: [
        {
          key: "Name",
          value: "nfw",
        },
      ],
    });
    /**************
    Logging
    **************/
    const nfwAlertLogGroup = new logs.LogGroup(this, "NfwAlertLogGroup", {
      deletionProtectionEnabled: false,
      logGroupName: "/nfw/alert",
      retention: logs.RetentionDays.FIVE_DAYS,
    });
    const nfwFlowLogGroup = new logs.LogGroup(this, "NfwFlowLogGroup", {
      deletionProtectionEnabled: false,
      logGroupName: "/nfw/flow",
      retention: logs.RetentionDays.FIVE_DAYS,
    });
    new networkfirewall.CfnLoggingConfiguration(this, "NfwLogConfig", {
      firewallArn: nfw.attrFirewallArn,
      loggingConfiguration: {
        logDestinationConfigs: [
          {
            logType: "ALERT",
            logDestinationType: "CloudWatchLogs",
            logDestination: {
              logGroup: nfwAlertLogGroup.logGroupName,
            },
          },
          {
            logType: "FLOW",
            logDestinationType: "CloudWatchLogs",
            logDestination: {
              logGroup: nfwFlowLogGroup.logGroupName,
            },
          },
        ],
      },
      enableMonitoringDashboard: true,
    });
  }
}
