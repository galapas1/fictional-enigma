data "aws_availability_zones" "available" {}

data "template_file" "api_swagger" {
  template = file("templates/swagger.json")

  vars = {
    server_url             = "api.${var.dns_domain}"
    region                 = var.aws_region
    bucket                 = aws_s3_bucket.ecfr_pretty.bucket
    authorizer_lambda      = aws_lambda_function.authorizer.invoke_arn
    authorizer_credentials = aws_iam_role.api_role.arn
    endpoint_api_lambda    = aws_lambda_function.ecfr_lambda.invoke_arn
    endpoint_api_role      = aws_iam_role.api_role.arn
  }
}

data "archive_file" "auth_lambda" {
  type        = "zip"
  source_file = "src/auth-lambda/auth.js"
  output_path = "archive/auth.zip"
}

data "archive_file" "apigw_lambda" {
  type        = "zip"
  source_dir  = "src/ecfr-lambda/"
  output_path = "archive/ecfr-index.zip"
}

data "archive_file" "docdb_lambda" {
  type        = "zip"
  source_dir  = "src/docdb-lambda/"
  output_path = "archive/docdb-index.zip"
}
