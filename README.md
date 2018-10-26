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
