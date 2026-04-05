# Shared website origin bucket (prefix per tenant in CloudFront origin_path).
resource "aws_s3_bucket" "eusphere" {
  bucket = "eusphere"

  lifecycle {
    prevent_destroy = true
  }
}

resource "aws_s3_bucket_public_access_block" "eusphere" {
  bucket = aws_s3_bucket.eusphere.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# One statement per CloudFront distribution using OAC (Principal cloudfront.amazonaws.com,
# Condition AWS:SourceArn = distribution ARN). Matches AWS guidance for S3 + CloudFront OAC.
data "aws_iam_policy_document" "eusphere_cloudfront" {
  statement {
    sid    = "AllowCloudFrontServicePrincipal-eusphere"
    effect = "Allow"

    principals {
      type        = "Service"
      identifiers = ["cloudfront.amazonaws.com"]
    }

    actions   = ["s3:GetObject"]
    resources = ["${aws_s3_bucket.eusphere.arn}/*"]

    condition {
      test     = "StringEquals"
      variable = "AWS:SourceArn"
      values   = [module.eusphere_co.distribution_arn]
    }
  }

  statement {
    sid    = "AllowCloudFrontServicePrincipal-monarchy"
    effect = "Allow"

    principals {
      type        = "Service"
      identifiers = ["cloudfront.amazonaws.com"]
    }

    actions   = ["s3:GetObject"]
    resources = ["${aws_s3_bucket.eusphere.arn}/*"]

    condition {
      test     = "StringEquals"
      variable = "AWS:SourceArn"
      values   = [module.monarchy.distribution_arn]
    }
  }

  statement {
    sid    = "AllowCloudFrontServicePrincipal-connieadu"
    effect = "Allow"

    principals {
      type        = "Service"
      identifiers = ["cloudfront.amazonaws.com"]
    }

    actions   = ["s3:GetObject"]
    resources = ["${aws_s3_bucket.eusphere.arn}/*"]

    condition {
      test     = "StringEquals"
      variable = "AWS:SourceArn"
      values   = [module.connieadu_com.distribution_arn]
    }
  }
}

resource "aws_s3_bucket_policy" "eusphere_cloudfront" {
  bucket = aws_s3_bucket.eusphere.id
  policy = data.aws_iam_policy_document.eusphere_cloudfront.json

  depends_on = [
    module.eusphere_co,
    module.monarchy,
    module.connieadu_com,
  ]
}
