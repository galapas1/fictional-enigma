resource "aws_s3_bucket" "ecfr_raw" {
  bucket_prefix = "${var.app_name}-raw"

  tags = {
    Name        = "eCFR Raw Data"
    Environment = "Dev"
  }
}

resource "aws_s3_bucket" "ecfr_pretty" {
  bucket_prefix = "${var.app_name}-pretty"

  tags = {
    Name        = "eCFR Pretty Data"
    Environment = "Dev"
  }
}

resource "aws_s3_bucket" "deployment_bucket" {
  bucket = "${var.app_name}-app"

  website {
    index_document = "index.html"
    error_document = "index.html"
  }

  tags = {
    Name        = "eCFR UI"
    Environment = "Dev"
  }
}

resource "aws_s3_bucket_ownership_controls" "ownership_controls" {
  bucket = aws_s3_bucket.deployment_bucket.id
  rule {
    object_ownership = "BucketOwnerPreferred"
  }
}

resource "aws_s3_bucket_acl" "s3_bucket_acl" {
  depends_on = [aws_s3_bucket_ownership_controls.ownership_controls]
  bucket     = aws_s3_bucket.deployment_bucket.id
  acl        = "private"
}
