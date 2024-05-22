resource "aws_api_gateway_domain_name" "service" {
  certificate_arn = var.certificate_arn
  domain_name     = "api.${var.dns_domain}"
}

resource "aws_route53_record" "service" {
  name = aws_api_gateway_domain_name.service.domain_name
  type = "CNAME"
  ttl  = 300

  records = ["${aws_api_gateway_rest_api.ecfr_api.id}.execute-api.${var.aws_region}.amazonaws.com"]

  zone_id = var.zone_id
}

resource "aws_api_gateway_base_path_mapping" "service" {
  api_id      = aws_api_gateway_rest_api.ecfr_api.id
  stage_name  = "dev"
  domain_name = aws_route53_record.service.name
}
