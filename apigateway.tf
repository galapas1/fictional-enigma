resource "aws_api_gateway_rest_api" "ecfr_api" {
  name        = "${var.app_name}-api"
  description = "eCFR API Gateway"

  body = data.template_file.api_swagger.rendered

  endpoint_configuration {
    types = ["REGIONAL"]
  }
}

resource "aws_api_gateway_deployment" "service" {
  rest_api_id = aws_api_gateway_rest_api.ecfr_api.id
  description = "deployed on ${timestamp()} - ${md5(data.template_file.api_swagger.rendered)}"

  lifecycle {
    create_before_destroy = true
  }

  triggers = {
    redeployment = md5(data.template_file.api_swagger.rendered)
  }
}
