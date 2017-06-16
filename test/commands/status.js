/**
 * Copyright (c) 2017, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or
 * https://opensource.org/licenses/BSD-3-Clause
 */

/**
 * test/commands/status.js
 */
'use strict';
const utils = require('../testUtils');
const expect = require('chai').expect;

describe('test/commands/status >', () => {
  before(utils.makeRegistryFile);
  after(utils.removeRegistryFile);

  it('logs the expected result', (done) => {
    const { exec } = require('child_process');
    exec('refocus-collector status --name=PRD_Collector_12345', (error, stdout, stderr) => {
      if (error) {
        console.error(`exec error: ${error}`);
        done(err);
      }

      expect(stdout).to.contain('Status => PRD_Collector_12345');
      done();
    });
  });
});
