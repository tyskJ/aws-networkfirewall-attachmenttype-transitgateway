#!/usr/bin/env node
import * as cdk from "aws-cdk-lib/core";
import { AppStack } from "../lib/stack/app-stack";
import { devParameter } from "../parameter";

const app = new cdk.App();
const stack = new AppStack(app, "AppStack", {
  ...devParameter,
  description: "NetworkFirewall Attachment Type Transit Gateway.",
});
cdk.Tags.of(stack).add("Env", devParameter.envName);
