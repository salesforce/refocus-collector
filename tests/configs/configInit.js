/**
 * Copyright (c) 2017, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or
 * https://opensource.org/licenses/BSD-3-Clause
 */

/**
 * tests/configs/configInit.js
 */
const expect = require('chai').expect;
const assert = require('chai').assert;
const configInit = require('../../src/configs/configInit');
const errors = require('../../src/errors/errors');
const util = require('util');

describe('tests/configs/configInit.js - unit tests', () => {
  it('config object is created after reading registry', (done) => {
    const obj = configInit.createConfigObj('./tests/configs/testRegistry.json');
    expect(obj.registryInfo).to.not.equal(null);
    expect(obj.registryInfo.collectorName1.url).to.equal('www.xyz.com');
    expect(obj.registryInfo.collectorName1.token).to.exist;
    done();
  });

  it('error if registry file not present', (done) => {
    const fileLoc = './tests/configs/NotExist.txt';
    const fn = configInit.createConfigObj.bind(configInit, fileLoc);
    expect(fn).to.throw(new errors.ResourceNotFoundError(
      util.format('File: %s not found', fileLoc)
    ).toString());
    done();
  });

  it('error if a collector in registry does not have url property', (done) => {
    const fileLoc = './tests/configs/testRegistryInvalid.json';
    const fn = configInit.createConfigObj.bind(configInit, fileLoc);
    expect(fn).to.throw(new errors.ValidationError(
      'Collector entries in Regisry.json should have url property.'
    ).toString());
    done();
  });
});
