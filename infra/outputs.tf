output "connieadu_distribution_id" {
  description = "Use for cache invalidation (e.g. connieadu-com/release/prod.sh)."
  value       = module.connieadu_com.distribution_id
}

output "connieadu_distribution_arn" {
  description = "CloudFront distribution ARN for connieadu.com (also referenced in s3.tf bucket policy)."
  value       = module.connieadu_com.distribution_arn
}
