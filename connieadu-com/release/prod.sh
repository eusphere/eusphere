#!/bin/bash

# hand-roll the files that would be in `build`
aws s3 cp ./static/favicon.ico s3://eusphere/connieadu-com/favicon.ico
aws s3 cp ./index.html s3://eusphere/connieadu-com/index.html
aws s3 cp ./robots.txt s3://eusphere/connieadu-com/robots.txt
aws s3 sync ./static s3://eusphere/connieadu-com/static --delete

# invalidate cloudfront cache
aws cloudfront create-invalidation --distribution-id E1GM2TOPJ2G388 --paths "/*"
