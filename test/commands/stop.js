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
const expectedResult = {
  collectorName1: {
    url: 'http://www.xyz.com',
    token: 'ewuifiekhfewfhsfhshjfjhfgewuih',
  },
};
const config = require('../../src/config/config');
const constants = require('../../src/constants');
const expect = require('chai').expect;
const sinon = require('sinon');

describe('test/commands/stop >', () => {

  // stub the set registry with obj
  it('stub works', () => {
    const getConfig = sinon.stub(config, 'getConfig').callsFake(() => expectedResult);
      const result = getConfig();

      getConfig.restore();
      expect(result).to.deep.equal(expectedResult);
  });

   it('stub works with constants', () => {
    const getRegistry = sinon.stub(constants, 'registryLocation').callsFake(() => expectedResult);
      const result = getRegistry();

      getRegistry.restore();
      expect(result).to.deep.equal(expectedResult);
  });

  it.skip('logs the expected results', (done) => {
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
