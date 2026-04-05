# Infra (Terraform)

CloudFront distributions and related AWS config. Remote state uses **S3** (`eusphere-tfstate`) for storage and **DynamoDB** (`eusphere-terraform-locks`) for locking.

The state bucket is **private**: SSE-S3 encryption, versioning, and a full public access block (not website hosting). The name `eusphere-tfstate` is only required to be **globally unique** for S3 across all AWS accounts; it does not need your account id in the name.

## One-time: create the state bucket and lock table

```bash
cd bootstrap
terraform init
terraform apply
terraform output -raw backend_config > ../backend.hcl
cd ..
```

`backend.hcl` is gitignored. Do not commit it.

## Point the root module at remote state

From `infra/`:

```bash
printf 'yes\n' | terraform init -migrate-state -backend-config=backend.hcl
```

Use `printf 'yes\n'` (not `yes | …`) so Terraform only receives a single confirmation when copying existing local state to S3.

## Everyday use

```bash
terraform init -backend-config=backend.hcl
terraform plan
terraform apply
```

Or set `TF_CLI_ARGS_init=-backend-config=backend.hcl` so plain `terraform init` works.

## Site bucket and CloudFront access

The **`eusphere`** website origin bucket is in `s3.tf` (imported; `prevent_destroy` on the bucket). The bucket policy allows **`s3:GetObject`** for `eusphere/*` from CloudFront using one IAM statement per distribution (`AWS:SourceArn` = that distribution’s ARN). Add a new statement in `data.aws_iam_policy_document.eusphere_cloudfront` when you add another `module` in `cloudfront.tf`.

## New site (e.g. connieadu.com)

- **Origin Access Control** — reuse an existing OAC id for `eusphere` (same as another tenant) unless you need a separate OAC for policy reasons. Pass `origin_access_control_id` into the module.
- **WAF** (`web_acl_id`) is optional. Other tenants use Web ACL ARNs from the CloudFront / WAF console; set `web_acl_id` on the module when you have one.

## Destroying bootstrap resources

The state bucket and lock table use `prevent_destroy`. Remove those `lifecycle` blocks in `bootstrap/main.tf` only if you intentionally tear down remote state (and have backups).
