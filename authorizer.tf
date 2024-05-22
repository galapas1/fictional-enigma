resource "aws_lambda_function" "authorizer" {
  filename         = "archive/auth.zip"
  function_name    = "authorizer_lambda"
  role             = aws_iam_role.api_role.arn
  handler          = "auth.handler"
  runtime          = "nodejs18.x"
  source_code_hash = data.archive_file.auth_lambda.output_base64sha256

  environment {
    variables = {
      API_KEY = var.api_key
    }
  }
}

