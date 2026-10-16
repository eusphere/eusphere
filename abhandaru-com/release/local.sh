#!/bin/bash
set -euo pipefail

./release/build.sh

yarn dev
