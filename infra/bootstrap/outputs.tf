output "state_bucket_name" {
  description = "S3 bucket holding remote Terraform state."
  value       = aws_s3_bucket.terraform_state.bucket
}

output "dynamodb_table_name" {
  description = "DynamoDB table used for state locking."
  value       = aws_dynamodb_table.terraform_lock.name
}

output "backend_config" {
  description = "Write to ../backend.hcl, then run terraform init -migrate-state in the parent infra/ directory."
  value       = <<-EOT
bucket         = "${aws_s3_bucket.terraform_state.bucket}"
key            = "infra/terraform.tfstate"
region         = "${var.aws_region}"
encrypt        = true
dynamodb_table = "${aws_dynamodb_table.terraform_lock.name}"
EOT
}
