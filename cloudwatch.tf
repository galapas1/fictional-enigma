resource "aws_cloudwatch_log_group" "ecfr_lambda_log_group" {
  name              = "/aws/lambda/${var.ecfr_lambda_name}"
  retention_in_days = 1
  lifecycle {
    prevent_destroy = false
  }
}

resource "aws_cloudwatch_log_group" "docdb_lambda_log_group" {
  name              = "/aws/lambda/${var.docdb_lambda_name}"
  retention_in_days = 1
  lifecycle {
    prevent_destroy = false
  }
}
