#!/bin/bash
set -euo pipefail

yarn install --frozen-lockfile
yarn dev
