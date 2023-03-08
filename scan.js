#!/usr/bin/env node
"use strict";

const fs = require('fs');
const { promisify } = require('util');
const readFile = promisify(fs.readFile);
const CloudConformity = require("cloud-conformity");
const readDir = promisify(fs.readdir);
const readOptions = { encoding: "utf8" }

const computeFailures = (result, messages) => {
  //console.log(JSON.stringify( result,null,2));
  return result.failure.reduce((total, result) => {
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
}

const scan = async (templatePath, ccEndpoint, ccApiKey, profileId, accountId, templatesDirPath) => {
  const cc = new CloudConformity.CloudConformity(ccEndpoint, ccApiKey);
  if (templatesDirPath) {
    return batchScanTemplates(cc, templatesDirPath, profileId, accountId)
  }
  return scanTemplate(cc, templatePath, profileId, accountId)
}

const failOnFailure = (failures, acceptedQty) => {
  return ((failures.extreme > acceptedQty.extreme) || (failures.veryHigh > acceptedQty.veryHigh) || (failures.high > acceptedQty.high) || (failures.medium > acceptedQty.medium) || (failures.low > acceptedQty.low))
};

const batchScanTemplates = async (cc, templatesDirPath, profileId, accountId) => {
  const dir = await readDir(templatesDirPath, readOptions)
  return Promise.all(dir.map(async (template) => {
      const fullPath = templatesDirPath + "/" + template
      return scanTemplate(cc, fullPath, profileId, accountId)
  }))
}

const scanTemplate = async (cc, templatePath, profileId, accountId) => {
  const template = await readFile(templatePath, readOptions);
  // Scans the template using Conformity module.
  console.log("Scan template: (%s)", templatePath)
  const result = await cc.scanACloudFormationTemplateAndReturAsArrays(template, profileId, accountId);
  const messages = [];
  const results = computeFailures(result, messages); 
  return {
      template: templatePath,
      detections: result.failure,
      results: results,
      messages: messages
  };
}

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
const profileId = process.env.profileId;
const accountId = process.env.accountId;
const templatesDirPath = process.env.templatesDirPath;

scan(templatePath, region, apikey, profileId, accountId, templatesDirPath)
  .then(value => {
    const results = Array.isArray(value) ? value : [value]
    const COMPLIANT_MESSASGE = "Template passes configured checks."
    const NON_COMPLIANT_MESSAGE = "Security and/or misconfiguration issue(s) found in template(s): "
    const nonCompliantTemplates = [];
    let isCompliant = true;
    for (const result of results) {
        console.log(`\nFailures found: ${JSON.stringify(result.results, null, 2)}`);
        console.log('\n');
        console.log(`Quantity of failures allowed: ${JSON.stringify(acceptedResults, null, 2)}`);
        if (outputResults && result.messages) {
            console.log('\n');
            console.log('Results:\n');
            console.log(result.messages.join('\n'));
        }
        console.log('\n');
        if (failOnFailure(result.results, acceptedResults)) {
            isCompliant = false;
            nonCompliantTemplates.push(result.template)
        }
    }
    return {
        status: isCompliant,
        message: isCompliant ? COMPLIANT_MESSASGE : NON_COMPLIANT_MESSAGE + " [" + nonCompliantTemplates + "]"
    };
  })
  .then(res => {
    console.log(res.message)
    if (!res.status) {
        process.exit(1);
    }
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
  });
