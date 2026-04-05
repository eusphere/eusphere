terraform {
  required_version = ">= 1.5"

  # Configure with backend.hcl (see infra/README.md). Example: backend.hcl.example
  backend "s3" {}

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}
