#!/bin/bash

# hand-roll the files that would be in `build`
aws s3 cp ./static/favicon.ico s3://eusphere/abhandaru-com/favicon.ico
aws s3 cp ./index.html s3://eusphere/abhandaru-com/index.html
aws s3 sync ./static s3://eusphere/abhandaru-com/static --delete

# invalidate cloudfront cache
aws cloudfront create-invalidation --distribution-id E3BGQK3F9TTZWK --paths "/*"