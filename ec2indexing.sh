#!/bin/bash

##############################
# Assignment

# Using your favorite high-level language (Python, Ruby, Perl, or compiled if desired),
# create a tool which uses the AWS API to list all EC2 instances in any single region,
# sorted by the value of a tag each instance has called 'Owner'.

# The script should display the results in an easy to read format
# which includes the instance id, tag value, instance type and launch time.
# The script should work for any number of instances and should display any instances
# without an Owner tag as type 'unknown' with the instance id, type and launch time.
# Design the script so it could be used later to index on different tags and output additional instance metadata.


##############################
# Usage
# ec2indexing.sh "$INDEX_KEY" "$REGION" "$AWS_ACCESS_KEY_ID" "$AWS_SECRET_ACCESS_KEY"
# ec2indexing.sh "Owner" "us-east-1" "ABCEFG12345" "HIJKILM09876"


##############################
# Variable assignment

# INDEX_TAG             = "$1"  # The tag you want to index on
# AWS_REGION            = "$2"  # The region you're getting EC2s from
# AWS_ACCESS_KEY_ID     = "$3"  # The access key for the user accessing the account
# AWS_SECRET_ACCESS_KEY = "$4"  # The secret key for the user accessing the account

##############################
# Create And Node Docker Container to run EC2 Indexing by tag

if [ "$1" == "" ] || [ "$2" == "" ] || [ "$3" == "" ] || [ "$4" == "" ]; then
    echo "Missing one or more required config values in order to run ec2indexing script."
else
     # Inject config values based off ec2indexing.sh call
     config=`cat config_template.json`
     echo $config | sed 's|INDEX_TAG_VALUE|'$1'|'| sed 's|AWS_REGION_VALUE|'$2'|' | sed 's|AWS_ACCESS_KEY_ID_VALUE|'$3'|' | sed 's|AWS_SECRET_ACCESS_KEY_VALUE|'$4'|' > config.json
     # cat config.json

     # Build docker image and run it
     echo "Building ec2 indexing docker image and running it."
     docker build -t ec2indexing ./
     docker create -t ec2indexing
     container_id=`docker ps -a | awk '{ print $1,$2 }' | grep ec2indexing | awk '{print $1 }'`
     # echo $container_id
     docker start $container_id
     docker exec -it $container_id npm start

     # Clean up containers, images, and sensitive config values
     echo "Destroying ec2indexing containers, images, and sensitive config values."
     docker stop $container_id
     docker rm -f $container_id
     docker rmi -f ec2indexing
     rm config.json
fi