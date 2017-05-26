/**
 * Copyright (c) 2017, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or
 * https://opensource.org/licenses/BSD-3-Clause
 */

/**
 * test/config/utils.js
 */
const expect = require('chai').expect;
const assert = require('chai').assert;
const configUtils = require('../../src/config/utils');
const errors = require('../../src/errors/errors');
const util = require('util');

describe('test/config/utils.js - unit tests >', () => {
  it('config object is created after reading registry', (done) => {
    const obj = configUtils.init('./test/config/testRegistry.json');
    expect(obj.registry).to.not.equal(null);
    expect(obj.registry.collectorName1.url).to.equal('www.xyz.com');
    expect(obj.registry.collectorName1.token).to.exist;
    done();
  });

  it('error if registry file not present', (done) => {
    const fileLoc = './test/config/NotExist.txt';
    const fn = configUtils.init.bind(configUtils, fileLoc);
    expect(fn).to.throw(new errors.ResourceNotFoundError(
      util.format('File: %s not found', fileLoc)
    ).toString());
    done();
  });

  it('error if a collector in registry does not have "url" attribute',
  (done) => {
    const fileLoc = './test/config/testRegistryInvalid.json';
    const fn = configUtils.init.bind(configUtils, fileLoc);
    expect(fn).to.throw(new errors.ValidationError(
      'Collector entries in regisry.json must have "url" attribute.'
    ).toString());
    done();
  });
});
