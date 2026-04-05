#!/bin/bash
set -euo pipefail

# Serve the site at http://localhost:8083/ (paths match production: /static/..., etc.).
# This does not upload anything or touch S3/CloudFront.

cd "$(dirname "$0")/.."
echo "Connie Adu — local preview: http://localhost:8083/"
echo "Ctrl+C to stop."
exec python3 -m http.server 8083
