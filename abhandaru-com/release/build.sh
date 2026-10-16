#!/bin/bash
set -euo pipefail

if [[ ! -x node_modules/.bin/vite ]]; then
  yarn install --frozen-lockfile
fi

python3 -m pip install --user -r blog/requirements.txt
python3 blog/build.py
./node_modules/.bin/vite build
