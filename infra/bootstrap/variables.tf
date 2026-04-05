variable "aws_region" {
  type        = string
  description = "Region for the S3 bucket and DynamoDB lock table (use us-east-1 to match the main infra provider)."
  default     = "us-east-1"
}

variable "state_bucket_name" {
  type        = string
  description = "Globally unique S3 bucket name for private Terraform state."
  default     = "eusphere-tfstate"
}

variable "dynamodb_table_name" {
  type        = string
  description = "DynamoDB table used by the S3 backend for state locking."
  default     = "eusphere-terraform-locks"
}
