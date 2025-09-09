import { defineBackend } from '@aws-amplify/backend';
import * as cdk from 'aws-cdk-lib';
import { aws_lambda as lambda, aws_apigatewayv2 as apigwv2, aws_apigatewayv2_integrations as intg } from 'aws-cdk-lib';
import * as path from 'path';

const backend = defineBackend({});
const stack = backend.stack;

const LWA_LAYER_ARN   = process.env.LWA_LAYER_ARN   || '';
const FFMPEG_LAYER_ARN= process.env.FFMPEG_LAYER_ARN || '';
const PYDEPS_LAYER_ARN= process.env.PYDEPS_LAYER_ARN || '';

const layers: lambda.ILayerVersion[] = [];
if (LWA_LAYER_ARN)   layers.push(lambda.LayerVersion.fromLayerVersionArn(stack, 'LwaLayer', LWA_LAYER_ARN));
if (FFMPEG_LAYER_ARN)layers.push(lambda.LayerVersion.fromLayerVersionArn(stack, 'FfmpegLayer', FFMPEG_LAYER_ARN));
if (PYDEPS_LAYER_ARN)layers.push(lambda.LayerVersion.fromLayerVersionArn(stack, 'PydepsLayer', PYDEPS_LAYER_ARN));

const fn = new lambda.Function(stack, 'SingleFileApp', {
  runtime: lambda.Runtime.PYTHON_3_11,
  code:    lambda.Code.fromAsset(path.join(__dirname, '..', 'lambda')),
  handler: 'run.sh',
  memorySize: 2048,
  ephemeralStorageSize: cdk.Size.mebibytes(2048),
  timeout: cdk.Duration.minutes(10),
  architecture: lambda.Architecture.X86_64,
  environment: {
    AWS_LAMBDA_EXEC_WRAPPER: '/opt/bootstrap', // LWA zip-mode
    PORT: '8000',
    AWS_LWA_PORT: '8000',
    AWS_LWA_READINESS_CHECK_PATH: '/'
  },
  layers
});

const api = new apigwv2.HttpApi(stack, 'SingleFileApi', {
  apiName: 'singlefile-api'
});

api.addRoutes({
  path: '/{proxy+}',
  methods: [apigwv2.HttpMethod.ANY],
  integration: new intg.HttpLambdaIntegration('ProxyIntegration', fn)
});

backend.addOutputs({ ApiUrl: api.apiEndpoint });
export default backend;
