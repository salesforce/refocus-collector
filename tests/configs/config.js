/**
 * Copyright (c) 2017, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or
 * https://opensource.org/licenses/BSD-3-Clause
 */

/**
 * tests/configs/config.js
 */
const expect = require('chai').expect;
const createConfigObj = require('../../config').createConfigObj;

describe('config unit tests', () => {
  it('config object is created after reading registry', (done) => {
    createConfigObj('./tests/configs/testRegistry.json')
    .then((obj) => {
      expect(obj.registryInfo).to.not.equal(null);
      expect(obj.registryInfo.collectorName1.url).to.equal('www.xyz.com');
      expect(obj.registryInfo.collectorName1.token).to.exist;
    })
    .then(() => done())
    .catch(done);
  });

  it('error if registry file not present', (done) => {
    createConfigObj('./tests/configs/notPresent.json')
    .catch((err) => {
      expect(err.status).to.be.equal(404);
      expect(err.name).to.be.equal('ResourceNotFoundError');
      expect(err.message).to.be.equal(
        'File: ./tests/configs/notPresent.json not found'
      );
    })
    .then(done)
    .catch(done);
  });

  it('error if a collector in registry does not have url property', (done) => {
    createConfigObj('./tests/configs/testRegistryInvalid.json')
    .catch((err) => {
      expect(err.status).to.be.equal(400);
      expect(err.name).to.be.equal('ValidationError');
      expect(err.message).to.be.equal(
        'Collector entries in Regisry.json should have url property.'
      );
    })
    .then(done)
    .catch(done);
  });
});
