/**
 * Copyright (c) 2017, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or
 * https://opensource.org/licenses/BSD-3-Clause
 */

/**
 * test/commands/deregister.js
 */
'use strict';
const expectedResult = {
  collectorName1: {
    url: 'http://www.xyz.com',
    token: 'ewuifiekhfewfhsfhshjfjhfgewuih',
  },
};
const expect = require('chai').expect;
const fs = require('fs');
const jsonPath = './registry.json';

describe('test/commands/deregister >', () => {
  before(() => {
    fs.writeFile(jsonPath, JSON.stringify(expectedResult), 'utf8', (err) => {
      if (err) {
        console.log(err);
      }
    });
  });

  after(() => {
    fs.unlinkSync(jsonPath);
  });

  it('logs the expected result', (done) => {
    const { exec } = require('child_process');
    exec('refocus-collector deregister --name=PRD_Collector_12345', (error, stdout, stderr) => {
      if (error) {
        console.error(`exec error: ${error}`);
        done(err);
      }

      expect(stdout).to.contain('Deregister => PRD_Collector_12345');
      done();
    });
  });
});
