Refocus SG creation API calls

1. Make sure the subject(s) and aspect(s) you need exist 

*API call:* GET /subjects/{subjectName}
*API call:* GET /aspects/{aspectName}


If they don't, create them:

*API call: *POST /subjects
*API call: *POST /aspects


2. Check if sample exists and is being updated

*API call:* GET /samples/{subjectPath}|{aspectName}    *e.g* /samples/Salesforce.SFDC_Core.CHI.SP3.CS24|APPCPU


*Create a new perspective with sample if it exists and is being updated


3. Check if Generator Template exists for the data source you want

Get a list of our Generator Templates and pick from the selection.

*API call:* GET /v1/generatorTemplates?isPublished=true&tags= 
tags should include data source type as well as other keywords around what you're using. You can add other parameters if you have a specific SGT in mind (may be recommended by a friend).

*If SGT doesn't exist then create an SGT

4. Pick Collectors

Your Sample Generator needs to be run by a Collector. Learn more about Collectors here (https://github.com/salesforce/refocus-collector/blob/master/docs/pages/collectorintro.md). You have to specify the Collectors that you want to have access to your Sample Generator. Refocus will assign your Generator to one of the Collectors you choose if it goes down then Refocus will reassign the Generator to a working Collector. So we recommend that you choose at least 2 Collectors in order to ensure the high availability of your service. 

*API call:* GET /v1/collectors 

User will go through collectors and read their descriptions to figure out what which ones they prefer. 


5. Create SG

**API call: **POST /v1/generators 

Body:

{
  "description": "string",
  "helpEmail": "string",
  "helpUrl": "string",
  "name": "string",
  "subjectQuery": "string",
  "collectors": [
    "string"
  ],
  "subjects": [
    "string"
  ],
  "aspects": [
    "string"
  ],
  "tags": [
    "string"
  ],
  "connection": {},
  "context": {}
}

