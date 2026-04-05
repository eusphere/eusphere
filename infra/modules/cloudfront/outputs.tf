output "distribution_id" {
  description = "CloudFront distribution ID (e.g. for cache invalidation)."
  value       = aws_cloudfront_distribution.this.id
}

output "distribution_arn" {
  description = "CloudFront distribution ARN (e.g. for S3 bucket policy SourceArn conditions)."
  value       = aws_cloudfront_distribution.this.arn
}
