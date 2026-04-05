[![Merge](https://github.com/eusphere/eusphere/actions/workflows/merge.yml/badge.svg)](https://github.com/eusphere/eusphere/actions/workflows/merge.yml)

# Eusphere

This repo contains all the marketing and policy pages for Eusphere.

## Tenants

The repository is multi-tenant. Each tenant has its own subdirectory.

* `eusphere-co` - [eusphere.co](https://eusphere.co)
* `monarchy-com` - [monarchy1.com](https://monarchy1.com)
* `connieadu-com` - [connieadu.com](https://connieadu.com)

## Deployment

The deployment is done automatically via GitHub Actions.

* `main` - Deploy to production ([merge workflow](.github/workflows/merge.yml))
* `staging` - not supported
