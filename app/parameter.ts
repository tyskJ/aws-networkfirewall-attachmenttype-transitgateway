import * as cdk from "aws-cdk-lib";

/*
╔═════════════════════════════════════════════════════════════════════════╗
║ type (Define your own type)                                             ║
╚═════════════════════════════════════════════════════════════════════════╝
*/
export type vpcInfo = {
  id: string;
  cidrBlock: string;
  dnsHost: boolean;
  dnsSupport: boolean;
  tags: { key: string; value: string }[];
};

export type azInfo = "a" | "c" | "d";

export type subnetKey = "public-a" | "private-a";

export type subnetInfo = {
  id: string;
  key: subnetKey;
  availabilityZone: azInfo;
  cidrBlock: string;
  mapPublicIpOnLaunch: boolean;
  tags: { key: string; value: string }[];
}[];

/*
╔═════════════════════════════════════════════════════════════════════════╗
║ Interface                                                               ║
╚═════════════════════════════════════════════════════════════════════════╝
*/
export interface Parameter extends cdk.StackProps {
  envName: string;
  ngwVpc: vpcInfo;
  ngwSubnets: subnetInfo;
  cloudshellVpc: vpcInfo;
  cloudshellSubnets: subnetInfo;
}

/*
╔═════════════════════════════════════════════════════════════════════════╗
║ Parameter                                                               ║
╚═════════════════════════════════════════════════════════════════════════╝
*/
export const devParameter: Parameter = {
  /***************
  Env 
  ***************/
  envName: "prd",
  /***************
  NGW VPC 
  ***************/
  ngwVpc: {
    id: "NgwVpc",
    cidrBlock: "10.0.0.0/16",
    dnsHost: true,
    dnsSupport: true,
    tags: [
      {
        key: "Name",
        value: "ngw-vpc",
      },
    ],
  },
  ngwSubnets: [
    {
      id: "NgwVpcPublicNgwSubnetA",
      key: "public-a",
      availabilityZone: "a",
      cidrBlock: "10.0.1.0/24",
      mapPublicIpOnLaunch: true,
      tags: [
        {
          key: "Name",
          value: "ngwvpc-public-ngw-subnet-a",
        },
      ],
    },
    {
      id: "NgwVpcPrivateTgwSubnetA",
      key: "private-a",
      availabilityZone: "a",
      cidrBlock: "10.0.2.0/24",
      mapPublicIpOnLaunch: false,
      tags: [
        {
          key: "Name",
          value: "ngwvpc-private-tgw-subnet-a",
        },
      ],
    },
  ],
  /***************
  CloudShell VPC 
  ***************/
  cloudshellVpc: {
    id: "CloudshellVpc",
    cidrBlock: "172.16.0.0/16",
    dnsHost: true,
    dnsSupport: true,
    tags: [
      {
        key: "Name",
        value: "cloudshell-vpc",
      },
    ],
  },
  cloudshellSubnets: [
    {
      id: "CloudshellVpcPrivateSubnetA",
      key: "private-a",
      availabilityZone: "a",
      cidrBlock: "172.16.1.0/24",
      mapPublicIpOnLaunch: false,
      tags: [
        {
          key: "Name",
          value: "cloudshellvpc-private-subnet-a",
        },
      ],
    },
    {
      id: "CloudshellVpcPrivateTgwSubnetA",
      key: "private-a",
      availabilityZone: "a",
      cidrBlock: "172.16.2.0/24",
      mapPublicIpOnLaunch: false,
      tags: [
        {
          key: "Name",
          value: "cloudshellvpc-private-tgw-subnet-a",
        },
      ],
    },
  ],
};
