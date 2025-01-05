#!/bin/bash

aws s3 cp ./index.html s3://eusphere/eusphere-co/index.html
aws s3 sync ./static s3://eusphere/eusphere-co/static --delete