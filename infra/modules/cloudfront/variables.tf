variable "aliases" {
  type        = list(string)
  description = "Alternate domain names (CNAMEs) for the distribution."
}

variable "origin_id" {
  type        = string
  description = "Unique origin id (must match default_cache_behavior.target_origin_id)."
}

variable "origin_path" {
  type        = string
  description = "S3 prefix path for site content (e.g. /tenant-name)."
}

variable "origin_access_control_id" {
  type        = string
  description = "CloudFront origin access control id for the S3 origin."
}

variable "viewer_protocol_policy" {
  type        = string
  description = "Viewer protocol policy for the default cache behavior."
}

variable "acm_certificate_arn" {
  type        = string
  description = "ACM certificate ARN (us-east-1) for custom domain HTTPS."
}

variable "web_acl_id" {
  type        = string
  description = "WAFv2 Web ACL ARN attached to the distribution."
}

variable "s3_domain_name" {
  type        = string
  description = "Regional S3 endpoint domain for the shared bucket."
  default     = "eusphere.s3.us-east-1.amazonaws.com"
}

variable "cache_policy_id" {
  type        = string
  description = "CloudFront cache policy id for the default behavior."
  default     = "658327ea-f89d-4fab-a63d-7e88639e58f6"
}
