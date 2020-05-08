# Cloud Conformity Pipeline Scanner

Pipeline scanner uses Cloud Conformity's [Template Scanner](https://www.cloudconformity.com/solutions/aws/cloudformation-template-scanner.html) to secure your CloudFormation templates **before** they're deployed.

## Usage

To use the script, specify the following required environment variables:
  * `apikey`
  * `region`
  * `template`
    * Options: See the Cloud Conformity [documentation](https://github.com/cloudconformity/documentation-api#endpoints)

And, if necessary, the optional environment variable:
  * `acceptedQty` (default: `0`)

## Example

```yml
name: My CI/CD Pipeline

on: 
  push:
    branches: 
      - master
      
jobs:      
    CloudFormation-Scan:
       runs-on: ubuntu-latest
       steps:
          - uses: actions/checkout@v2
          - name: Cloud One Conformity Pipeline Scanner
            uses: raphabot/conformity-template-scanner-pipeline@v15
            env:
              apikey: ${{ secrets.apikey }}
              acceptedQty: 10
              region: us-west-2
              template: template.yaml
``` 
