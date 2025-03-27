import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as path from "path";

export class CdkAppStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const nestApp = new cdk.aws_lambda.Function(this, "LambdaFunction", {
      runtime: cdk.aws_lambda.Runtime.NODEJS_20_X,
      handler: "main.handler",
      code: cdk.aws_lambda.Code.fromAsset(path.join(__dirname, "../../backend/dist")),
    });
    /*
    new cdk.aws_apigateway.LambdaRestApi(this, "APIEndpoint", {
      handler: nestApp,
      deployOptions: {
        tracingEnabled: true,
        dataTraceEnabled: true,
        loggingLevel: cdk.aws_apigateway.MethodLoggingLevel.INFO,
      },
    });
    */
  }
}
