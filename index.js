  /**
 * Copyright (c) 2016, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or
 * https://opensource.org/licenses/BSD-3-Clause
 */

/**
 * ./index.js
 *
 * Main module to load the swagger docs.
 */

const fs = require('fs');
const yaml = require('js-yaml');
const conf = require('./src/constants');
const ENCODING = 'utf8';
const swaggerTools = require('swagger-tools');

const generator = require('swagger-node-codegen');
const path = require('path');
const express = require('express');
const compress = require('compression');

const app = express();
app.use(compress());
const httpServer = require('http').Server(app);

// set up httpServer params
const listening = 'Listening on port';
const PORT = process.env.PORT || conf.port;
app.set('port', PORT);

httpServer.listen(PORT, () => {
  console.log(listening, PORT); // eslint-disable-line no-console
});

// Initialize the Swagger middleware
const swaggerFile = fs // eslint-disable-line no-sync
  .readFileSync(conf.swagger.doc, ENCODING);
const swaggerDoc = yaml.safeLoad(swaggerFile);

swaggerTools.initializeMiddleware(swaggerDoc, (mw) => {

  // Serve the Swagger documents and Swagger UI
  app.use(mw.swaggerUi({
    apiDocs: swaggerDoc.basePath + '/api-docs', // API documetation as JSON
    swaggerUi: swaggerDoc.basePath + '/docs', // API documentation as HTML
  }));
});
