#!/bin/bash

# build the json directory
./release/regen.sh

# hand-roll the files that would be in `build`
aws s3 cp ./index.html s3://eusphere/monarchy-com/index.html
aws s3 cp ./static/favicon.ico s3://eusphere/monarchy-com/favicon.ico
aws s3 sync ./static s3://eusphere/monarchy-com/static --delete

# invalidate cloudfront cache
aws cloudfront create-invalidation --distribution-id E1LF1CRH3ZHEYG --paths "/*"