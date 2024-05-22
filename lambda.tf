resource "aws_lambda_function" "ecfr_lambda" {
  filename         = "archive/ecfr-index.zip"
  function_name    = var.ecfr_lambda_name
  role             = aws_iam_role.api_role.arn
  handler          = "index.handler"
  runtime          = "nodejs18.x"
  source_code_hash = data.archive_file.apigw_lambda.output_base64sha256
  memory_size      = 10240
  timeout          = 30

  depends_on = [
    aws_cloudwatch_log_group.ecfr_lambda_log_group,
    aws_s3_bucket.ecfr_raw
  ]

  vpc_config {
    subnet_ids         = module.vpc.private_subnets
    security_group_ids = ["${aws_security_group.service.id}"]
  }

  environment {
    variables = {
      ECFR_BASE_URL = var.ecfr_base_url
      S3_RAW_BUCKET = aws_s3_bucket.ecfr_raw.bucket
      DOCDB_LAMBDA  = aws_lambda_function.docdb_lambda.arn
    }
  }
}

resource "aws_lambda_function" "docdb_lambda" {
  filename         = "archive/docdb-index.zip"
  function_name    = var.docdb_lambda_name
  role             = aws_iam_role.api_role.arn
  handler          = "index.handler"
  runtime          = "nodejs18.x"
  source_code_hash = data.archive_file.docdb_lambda.output_base64sha256
  memory_size      = 10240
  timeout          = 30

  vpc_config {
    subnet_ids         = module.vpc.private_subnets
    security_group_ids = ["${aws_security_group.service.id}"]
  }

  depends_on = [
    aws_cloudwatch_log_group.docdb_lambda_log_group,
    aws_s3_bucket.ecfr_pretty,
    aws_s3_bucket.ecfr_raw
  ]

  environment {
    variables = {
      DB_CONNECTION_STRING = "mongodb://${aws_docdb_cluster.service.master_username}:${aws_docdb_cluster.service.master_password}@${aws_docdb_cluster.service.endpoint}:${aws_docdb_cluster.service.port}?retryWrites=false"

      DB_NAME          = var.docdb_name
      S3_RAW_BUCKET    = aws_s3_bucket.ecfr_raw.bucket
      S3_PRETTY_BUCKET = aws_s3_bucket.ecfr_pretty.bucket
    }
  }
}
