#!/bin/bash

ls -l ./static/concept

# Create a simple JSON array of just the filenames
echo -n '{"images":' > ./static/concept.json
ls ./static/concept | jq -R -s 'split("\n")[:-1]' >> ./static/concept.json
echo "}" >> ./static/concept.json