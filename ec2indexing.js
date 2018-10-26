// Initialize some variables
var AWS = require('aws-sdk'),
    config = require('./config.json'),
    each = require('async').each,
    ec2,
    fs = require('fs'),
    index_tag,
    qtyOfec2sTotal = 0,
    qtyOfEC2sWithoutExpectedIndexTag = 0,
    sortedOutput={};
    index_tag = config.INDEX_TAG;
    sortedOutput[index_tag]={};

// Load creds and initialize ec2 client
AWS.config.update({
    accessKeyId: config.AWS_ACCESS_KEY_ID,
    secretAccessKey: config.AWS_SECRET_ACCESS_KEY,
    region: config.AWS_REGION
});
ec2 = new AWS.EC2();

// List all EC2s from desired region
ec2.describeInstances({}, function (err, ec2response) {
    if (err) {
        console.log("Error when calling out to AWS to get EC2 data:" + err);
    }
    else {
        console.log("Indexing " + ec2response.Reservations.length + " ec2s by tag: " + index_tag);

        // Rethinking this after I wrote it, but nested async calls
        // *probably* wont scale very well in memory with a bunch of EC2s
        // but this works for the purposes of the 4 instances in us-east-1 we're indexing here.

        each(ec2response.Reservations, function(singleReservation, nextReservation){
          each(singleReservation.Instances, function(singleInstance, nextInstance){
              qtyOfec2sTotal++;

              //Iterate over each instance's tags sequentially.
              var singleInstanceIndexTagValue = "unknown";
              
              each(singleInstance.Tags, function(singleTag, nextTag){
                  // If our current tag we're evaluating is the one we want to index on, 
                  // change the owner variable, which we'll use on the eventual output object.
                  console.log("For instance id " + singleInstance.InstanceId + ", checking if this instance's tag key '" + singleTag.Key + "' is our expected index tag '" + index_tag + "'.");
                  
                  if(singleTag.Key === index_tag){
                      console.log("Good news, we have a match. The instance " + singleInstance.InstanceId + " has the expected tag " + index_tag + ", so we're assigning a value that's not unknown.");
                      singleInstanceIndexTagValue = singleTag.Value;
                  }
                  
                  nextTag(); // callback to next tag
              }, function(){
                 console.log("All tags have been iterated through on the single EC2 we're evaluating " + singleInstance.InstanceId + "; Adding this instance to our sorted output.");
                  
                  // Add user to the output map if it doesn't already exist.
                  // AC FOR OBJECT OUTPUT: includes the instance id, tag value, instance type and launch time.
                  if(!sortedOutput[index_tag][singleInstanceIndexTagValue]){ sortedOutput[index_tag][singleInstanceIndexTagValue] = []; }
                  if(singleInstanceIndexTagValue === "unknown"){
                      console.log("Unfortunately the instance " + singleInstance.InstanceId + 
                                  " does not have a tag that we're looking to index off, " +
                                  "so adding this instance to the 'unknown' category.");
                      qtyOfEC2sWithoutExpectedIndexTag++;
                  }

                  var indexedObject = {};
                  indexedObject[index_tag] = singleInstanceIndexTagValue;
                  
                  each(config.DESIRED_INSTANCE_METADATA, function(singleMetadataItem, nextMetadataItem){
                      indexedObject[singleMetadataItem] = singleInstance[singleMetadataItem];
                      nextMetadataItem();
                  },function(){
                      // Add this instance's metadata to output.
                      sortedOutput[index_tag][singleInstanceIndexTagValue].push(indexedObject);
                      console.log("Instance id " + singleInstance.InstanceId + " is now added to sortedOutput.\n");
                      nextInstance();
                  });
              });
          }, nextReservation);
        }, function(){
            // All tags of all instances of all reservations are now iterated over.
            console.log("\nOf a total of " + qtyOfec2sTotal + " EC2s in the " + config.AWS_REGION +
                        " region, there were " + qtyOfEC2sWithoutExpectedIndexTag +
                        " that don't have our expected index tag " + index_tag +
                        ". They are filed under 'unknown'.\n");


            console.log(JSON.stringify(sortedOutput)+"\n");

            // var local_file_output_path = "./ec2indexedOutput" + new Date().getTime() + ".json";

            // fs.writeFile(local_file_output_path, sortedOutput, function (err) {
            //     if (err){return console.log(err);}
            //
            //     fs.exists(local_file_output_path, function(exists){
            //         if (exists === false){return console.log(err);}
            //         console.log("Wrote " + local_file_output_path + " successfully.");
            //     });
            // });
            
            // The Access and Secret keys you gave me don't s3:ListBuckets IAM permissions,
            // but here's uploading the output to S3.
            // var S3 = new AWS.S3();
            // S3.putObject({
            //     Bucket: process.env.BUCKET_NAME,
            //     Key: local_file_output_path,
            //     Body: JSON.stringify(sortedOutput)
            // },function (err,data) {
            //     if(err){ console.log("There was an error loading " + local_file_output_path + " to the bucket " + process.env.BUCKET_NAME + ": " + err); }
            //     else { console.log("Loaded " + local_file_output_path + " to bucket " + process.env.BUCKET_NAME + " successfully!"); }
            // });
        });
    }
});