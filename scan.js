"use strict";

const fs = require('fs')
const { promisify } = require('util')
const readFile = promisify(fs.readFile)
const CloudConformity = require("cloud-conformity");

const scan = async (ccEndpoint, ccApiKey) => {
  const cc = new CloudConformity.CloudConformity(ccEndpoint, ccApiKey);
  const template = await readFile('s3.template.yaml', 'utf8');
  const result = await cc.scanACloudFormationTemplateAndReturAsArrays(template);
  return result.failure;
};

const failOnFailure = (failures, acceptedQty) => {
  if (failures.length > acceptedQty){
    return true;
  }
  return false;
};

const region = process.env.cc_region;
const apikey = process.env.cc_apikey;
const acceptedQty = process.env. acceptedQty;

scan(region, apikey)
  .then(res => {
    //console.log(JSON.stringify(res, null, 2));
    console.log("Failures Quantity: ", res.length);
    console.log("Quantity of failures allowed: ", acceptedQty);
    return failOnFailure(res, acceptedQty);
  })
  .then(res => {
    if (res){
      console.log("Too much failures!");
      process.exit(1);
    }
    console.log("Less failures than allowed, so let's deploy it!");
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
  });
