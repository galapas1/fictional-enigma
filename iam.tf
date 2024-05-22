resource "aws_iam_role" "api_role" {
  name_prefix = "ecfr_role-"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "apigateway.amazonaws.com"
        }
      },
      {
        Action : "sts:AssumeRole"
        Effect : "Allow",
        Principal : {
          Service : "lambda.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_policy" "api_policy" {
  name_prefix = "ecfr_policy-"
  description = "policy to access requisite resources"

  policy = jsonencode({
    "Version" : "2012-10-17",
    "Statement" : [
      {
        "Effect" : "Allow",
        "Action" : local.apigateway_policy_permissions,
        "Resource" : "*"
      },
      {
        "Effect" : "Allow",
        "Action" : local.ec2_policy_permissions,
        "Resource" : "*"
      },
      {
        "Effect" : "Allow",
        "Action" : local.lambda_policy_permissions,
        "Resource" : "*"
      },
      {
        "Effect" : "Allow",
        "Action" : local.log_policy_permissions,
        "Resource" : "*"
      },
      {
        "Effect" : "Allow",
        "Action" : local.route53_policy_permissions,
        "Resource" : "*"
      },
      {
        "Effect" : "Allow",
        "Action" : local.s3_policy_permissions,
        "Resource" : "*"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "api_gateway_policy_attachment" {
  role       = aws_iam_role.api_role.name
  policy_arn = aws_iam_policy.api_policy.arn
}


resource "aws_s3_bucket_policy" "bucket_policy" {
  bucket = aws_s3_bucket.deployment_bucket.id
  policy = jsonencode({
    "Version" : "2012-10-17",
    "Statement" : [
      {
        "Sid" : "AllowCloudFrontServicePrincipalReadOnly",
        "Effect" : "Allow",
        "Principal" : {
          "Service" : "cloudfront.amazonaws.com"
        },
        "Action" : "s3:GetObject",
        "Resource" : "${aws_s3_bucket.deployment_bucket.arn}/*",
        "Condition" : {
          "StringEquals" : {
            "AWS:SourceArn" : "${aws_cloudfront_distribution.website_cdn.arn}"
          }
        }
      }
    ]
  })
}
