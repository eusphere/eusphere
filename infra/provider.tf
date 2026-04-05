# CloudFront is a global service; API calls use the us-east-1 endpoint.
# Matches the console: https://us-east-1.console.aws.amazon.com/cloudfront/v4/home?region=us-east-1#/distributions
provider "aws" {
  region = var.aws_region
}

variable "aws_region" {
  type        = string
  description = "Region for the AWS provider (use us-east-1 for CloudFront)."
  default     = "us-east-1"
}
