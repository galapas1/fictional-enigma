variable "api_key" {
  default = "9b393968-e953-4e72-8f7a-98d8d9af25c7"
}

variable "app_name" {
  default = "mancomm-ecfr"
}

variable "aws_region" {
  default = "us-east-1"
}

variable "certificate_arn" {
  default = "arn:aws:acm:us-east-1:842959693114:certificate/2b07548f-09f7-4184-9ef6-3202cc1f9a5b"
}

variable "docdb_name" {
  default = "ecfrdb"
}

variable "dns_domain" {
  default = "galapas.net"
}

variable "docdb_instance_class" {
  default = "db.r5.large"
}

variable "docdb_lambda_name" {
  default = "docdb_nodejs_lambda"
}

variable "docdb_password" {
  default = "aG009pAssWD"
}

variable "ecfr_base_url" {
  default = "https://www.ecfr.gov/api/renderer/v1/content/enhanced"
}

variable "ecfr_lambda_name" {
  default = "ecfr_nodejs_lambda"
}

variable "stage_name" {
  default = "dev"
}

variable "zone_id" {
  default = "Z0133346S1EV7QYO53A2"
}
