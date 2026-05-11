# CLAUDE.md

Context for AI assistants working in this repository.

## What this is

A multi-tenant monorepo of static marketing and policy sites. Each tenant lives in its own top-level directory; there is no root application runtime or shared package manager unless you add one.

## Layout

| Directory       | Site              |
|----------------|-------------------|
| `eusphere-co/` | eusphere.co       |
| `monarchy-com/` | monarchy1.com    |
| `connieadu-com/` | connieadu.com   |

## Tech stack

- **Terraform** — Infrastructure as code under `infra/` (AWS provider; S3 and CloudFront modules, bootstrap layout). Apply changes from that directory with the usual Terraform workflow; align `versions.tf` with your Terraform CLI when editing.
- **Static sites (HTML, CSS)** — Tenant folders are marketing-style static pages: `index.html`, `static/` for CSS, images, and favicons. Deploy scripts (`*/release/prod.sh`) `aws s3 cp` / `aws s3 sync` those assets and invalidate CloudFront. Paths in HTML often assume hosting at the site root (e.g. `/static/...`).
- **React** — Not wired via npm in this repo today (no root `package.json`). If you introduce React (or another bundled frontend), expect a build step that emits static files into a predictable output directory, then either fold that into the existing `release/prod.sh` pattern or replace hand-uploaded paths with the build artifacts. Until then, treat “React” as an optional layer on top of the same S3 + CloudFront delivery model.

**AWS surface agents often touch:** S3 object updates and CloudFront invalidations from shell scripts; Terraform for bucket/distribution wiring and related IAM if extended.

## Deployment

- **Branch:** `main` only for production deploys (see `.github/workflows/merge.yml`).
- **Mechanism:** GitHub Actions runs path filters on each push; matching tenants run that tenant’s `./release/prod.sh` with AWS credentials from the `prod` environment.
- **Staging:** Not wired in this repo (per README).

## When changing workflows

Keep deploy jobs path-filtered so unrelated tenant changes do not deploy everything. Prefer upgrading official/third-party actions to releases that track the current GitHub Actions Node runtime rather than pinning legacy Node via workaround env vars.

## Conventions

Match existing patterns in the tenant you touch; avoid drive-by refactors outside the requested scope.
