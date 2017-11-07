/**
 * Copyright (c) 2017, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or
 * https://opensource.org/licenses/BSD-3-Clause
 */

/**
 * test/commands/register.js
 */
'use strict';
const expect = require('chai').expect;
const cmdStart = require('../../src/commands/register');
const constants = require('../../src/constants');
const fs = require('fs');

describe('test/commands/register >', () => {

  // TODO: child process fails on travis with error
  // /bin/sh: 1: refocus-collector: not found
  it('logs the expected result', (done) => {
    const { exec } = require('child_process');
    exec('refocus-collector register --url=https://refocus.foo.com' +
      ' --token=eygduyguygijfdhkfjhkfdhg --name=PRD_Collector_12345',
      (error, stdout, stderr) => {
      if (error) {
        console.error(`exec error: ${error}`);
        done(error);
      }

      expect(stdout).to.contain('Register => PRD_Collector_12345' +
        ' https://refocus.foo.com eygduyguygijfdhkfjhkfdhg');
      done();
    });
  });
});
