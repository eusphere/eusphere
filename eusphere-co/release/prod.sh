#!/bin/bash

# hand-roll the files that would be in `build`
aws s3 cp ./static/favicon.ico s3://eusphere/eusphere-co/favicon.ico
aws s3 cp ./index.html s3://eusphere/eusphere-co/index.html
aws s3 sync ./static s3://eusphere/eusphere-co/static --delete

# invalidate cloudfront cache
aws cloudfront create-invalidation --distribution-id E2GD67ZBIK5701 --paths "/*"