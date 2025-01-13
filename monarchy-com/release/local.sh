#!/bin/bash

# build the json directory
./release/regen.sh

# favicon locally
cp static/favicon.ico .

# serve the files
python3 -m http.server 8082
