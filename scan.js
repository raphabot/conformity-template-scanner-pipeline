#!/usr/bin/env node
"use strict";

const fs = require('fs');
const { promisify } = require('util');
const readFile = promisify(fs.readFile);
const CloudConformity = require("cloud-conformity");

const scan = async (templatePath, ccEndpoint, ccApiKey) => {
  const cc = new CloudConformity.CloudConformity(ccEndpoint, ccApiKey);
  const template = await readFile(templatePath, 'utf8');
  const result = await cc.scanACloudFormationTemplateAndReturAsArrays(template);
  const messages = [];
  // console.log(JSON.stringify(result.failure, null, 2));
  const results = result.failure.reduce((total, result) => {
    messages.push(`Risk: ${result.attributes['risk-level']} \tReason: ${result.attributes.message}`);
    if (result.attributes['risk-level'] === 'EXTREME'){
      total.extreme +=1;
    } else if (result.attributes['risk-level'] === 'VERY_HIGH') {
      total.veryHigh +=1;
    } else if (result.attributes['risk-level'] === 'HIGH') {
      total.high +=1;
    } else if (result.attributes['risk-level'] === 'MEDIUM') {
      total.medium +=1;
    } else if (result.attributes['risk-level'] === 'LOW') {
      total.low +=1;
    }
    return total;
  }, {
    extreme: 0,
    veryHigh: 0,
    high: 0,
    medium: 0,
    low: 0,
  });
  return {
    detections: result.failure,
    results: results,
    messages: messages
  };
};

const failOnFailure = (failures, acceptedQty) => {
  if ((failures.extreme > acceptedQty.extreme) || (failures.veryHigh > acceptedQty.veryHigh) || (failures.high > acceptedQty.high) || (failures.medium > acceptedQty.medium) || (failures.low > acceptedQty.low)) {
    return true;
  }
  return false;
};

const region = process.env.cc_region;
const apikey = process.env.cc_apikey;
const templatePath = process.env.templatePath;
const acceptedResults = {
  extreme: process.env.maxExtreme? process.env.maxExtreme : Number.MAX_SAFE_INTEGER,
  veryHigh: process.env.maxVeryHigh? process.env.maxVeryHigh : Number.MAX_SAFE_INTEGER,
  high: process.env.maxHigh? process.env.maxHigh : Number.MAX_SAFE_INTEGER,
  medium: process.env.maxMedium? process.env.maxMedium: Number.MAX_SAFE_INTEGER,
  low: process.env.maxLow? process.env.maxLow : Number.MAX_SAFE_INTEGER
};
const outputResults = process.env.cc_output_results? true : false;

scan(templatePath, region, apikey, outputResults)
  .then(res => {
    // console.log(JSON.stringify(res.results, null, 2));
    //console.log(JSON.stringify(res, null, 2));
    console.log(`Failures found: ${JSON.stringify(res.results, null, 2)}`);
    console.log('\n');
    console.log(`Quantity of failures allowed: ${JSON.stringify(acceptedResults, null, 2)}`);
    if (outputResults && res.messages){
      console.log('\n');
      console.log('Results:\n');
      console.log(res.messages.join('\n'));
    }
    console.log('\n');
    return failOnFailure(res.results, acceptedResults);
  })
  .then(res => {
    if (res){
      console.log("Security and/or misconfiguration issue(s) found in template.");
      process.exit(1);
    }
    console.log("Template passes configured checks.");
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
  });
