/**
 * Copyright (c) 2017, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or
 * https://opensource.org/licenses/BSD-3-Clause
 */

/**
 * test/commands/start.js
 */
'use strict';
const obj = {
  collectorName1: {
    url: 'http://www.xyz.com',
    token: 'ewuifiekhfewfhsfhshjfjhfgewuih',
  },
};
// stub the set registry with obj
const expect = require('chai').expect;

describe('test/commands/stop >', () => {
  it.only('logs the expected results', (done) => {
    const { exec } = require('child_process');
    exec('refocus-collector stop --name=PRD_Collector_12345', (error, stdout, stderr) => {
      if (error) {
        console.error(`exec error: ${error}`);
        done(err);
      }

      console.log(`stdout: ${stdout}`);
      console.log(`stderr: ${stderr}`);
      done();
    });
  });
});
