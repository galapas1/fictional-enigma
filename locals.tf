locals {
  apigateway_policy_permissions = [
    "apigateway:*"
  ]

  azs = slice(data.aws_availability_zones.available.names, 0, 3)

  dynamodb_policy_permissions = [
    "dynamodb:Scan",
    "dynamodb:Query"
  ]

  ec2_policy_permissions = [
    "ec2:*"
  ]

  lambda_policy_permissions = [
    "lambda:CreateFunction",
    "lambda:InvokeFunction"
  ]

  log_policy_permissions = [
    "logs:CreateLogStream",
    "logs:CreateLogGroup",
    "logs:PutLogEvents"
  ]

  s3_policy_permissions = [
    "s3:*"
  ]

  route53_policy_permissions = [
    "route53:ListHostedZones"
  ]

  vpc_cidr = "10.10.0.0/16"
}
