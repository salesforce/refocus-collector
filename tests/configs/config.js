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
const assert = require('chai').assert;
const errors = require('../../src/errors/errors');
const util = require('util');
const fs = require('fs');
const registryLoc = require('../../src/constants').localRegistryLocation;

describe('tests/configs/config.js - unit tests', () => {
  it('Import config object', (done) => {
    fs.stat(registryLoc, (err, stat) => {
      if (err == null) { // if no error, file exists, expect object
        const config = require('../../src/configs/config');
        expect(config).to.be.an('object');
      } else if (err.code == 'ENOENT') { // file does not exist, expect error
        const fn = function () {
          require('../../src/configs/config');
        };

        expect(fn).to.throw(new errors.ResourceNotFoundError(
          util.format('File: %s not found', registryLoc)
        ).toString());
      } else { // some other error
        throw err;
      }

      done();
    });
  });
});
