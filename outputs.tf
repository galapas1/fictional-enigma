output "url" {
  value = var.dns_domain != "" ? "https://api.${var.dns_domain}" : "${aws_api_gateway_deployment.service.invoke_url}"
}

output "aws_instance_public_dns" {
  value = aws_instance.service.public_dns
}

output "docdb_endpoint" {
  value = aws_docdb_cluster.service.endpoint
}

output "docdb_username" {
  value = aws_docdb_cluster.service.master_username
}

output "name" {
  value = var.app_name
}

output "aws_ami" {
  value = data.aws_instance.ecfr_ec2.public_ip
}
