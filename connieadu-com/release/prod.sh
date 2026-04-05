#!/bin/bash

# hand-roll the files that would be in `build`
aws s3 cp ./static/favicon.ico s3://eusphere/connieadu-com/favicon.ico
aws s3 cp ./index.html s3://eusphere/connieadu-com/index.html
aws s3 sync ./static s3://eusphere/connieadu-com/static --delete

# invalidate cloudfront cache — replace placeholder or set CLOUDFRONT_DISTRIBUTION_ID
DISTRIBUTION_ID="${CLOUDFRONT_DISTRIBUTION_ID:-PLACEHOLDER_DISTRIBUTION_ID}"
aws cloudfront create-invalidation --distribution-id "$DISTRIBUTION_ID" --paths "/*"
