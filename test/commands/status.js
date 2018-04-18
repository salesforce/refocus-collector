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
'use strict'; // eslint-disable-line strict
const expect = require('chai').expect;

describe('test/commands/status >', () => {
  // TODO: child process fails on travis with error
  // /bin/sh: 1: refocus-collector: not found
  it('logs the expected result', (done) => {
    const { exec } = require('child_process');
    exec('refocus-collector status --collectorName=PRD_Collector_12345',
      (error, stdout, stderr) => {
      if (error) return done(error);
      expect(stdout).to.contain('Status => PRD_Collector_12345');
      return done();
    });
  });
});
