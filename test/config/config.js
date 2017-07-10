/**
 * Copyright (c) 2017, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or
 * https://opensource.org/licenses/BSD-3-Clause
 */

/**
 * test/config/config.js
 */
const expect = require('chai').expect;
const errors = require('../../src/config/errors');
const util = require('util');
const fs = require('fs');
const registryLoc = require('../../src/constants').mockRegistryLocation;
const conf = require('../../src/config/config');
const configUtils = require('../../src/config/utils');

describe('test/config/config.js - unit tests >', () => {
  const confObj = {
    myTestCollector: {
      url: 'www.example.com',
      token: 'ewuifiekhfewfhsfhshjfjhfgewuih',
    },
  };

  afterEach(conf.clearConfig);

  it('Import config object', (done) => {
    fs.stat(registryLoc, (err, stat) => {
      if (!err) { // if no error, file exists, expect object
        const config = require('../../src/config/config');
        expect(config).to.be.an('object');
      } else if (err.code === 'ENOENT') { // file does not exist, expect error
        const fn = () => { require('../../src/config/config'); };

        expect(fn).to.throw(new errors.ResourceNotFoundError(
          util.format('File: %s not found', registryLoc)
        ).toString());
      } else { // some other error
        throw err;
      }

      done();
    });
  });

  it('set Config by passing it an an object', (done) => {
    conf.setRegistry(confObj);
    const obj = conf.getConfig();
    expect(obj.registry).to.deep.equal(confObj);
    expect(obj.generators).to.not.equal(undefined);
    done();
  });

  it('set Config by forcing a read from a file', (done) => {
    conf.setRegistry(registryLoc);
    const obj = conf.getConfig();

    // read object from the file
    const objFromFile = configUtils.init(registryLoc);
    expect(obj.generators).to.not.equal(undefined);
    expect(obj.registry).to.deep.equal(objFromFile.registry);
    done();
  });
});
