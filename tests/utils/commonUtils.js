/**
 * Copyright (c) 2017, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or
 * https://opensource.org/licenses/BSD-3-Clause
 */

/**
 * tests/utils/commonUtils.js
 */
const expect = require('chai').expect;
const commonUtils = require('../../src/utils/commonUtils');

describe('tests/utils/commonUtils.js - common utils unit tests', () => {
  it('readFile async, success', (done) => {
    commonUtils.readFileAsynchr('./tests/utils/fileToRead.txt', 'utf8')
    .then((data) => {
      expect(data).to.be.equal(
        'This is a text file meant to test the readFile function in ' +
        'commonUtils.'
      );
    })
    .then(() => done())
    .catch(done);
  });

  it('readFile async, file not found', (done) => {
    commonUtils.readFileAsynchr('./tests/utils/FileDoesNotExist.txt', 'utf8')
    .catch((err) => {
      expect(err.status).to.be.equal(404);
      expect(err.name).to.be.equal('ResourceNotFoundError');
      expect(err.message).to.be.equal(
        'File: ./tests/utils/FileDoesNotExist.txt not found'
      );
    })
    .then(done)
    .catch(done);
  });

  it('readFile sync, success', (done) => {
    const data = commonUtils.readFileSynchr('./tests/utils/fileToRead.txt');
    expect(data).to.be.equal(
      'This is a text file meant to test the readFile function in ' +
      'commonUtils.'
    );
    done();
  });

  it('readFile sync, file not found', (done) => {
    const fn = commonUtils.readFileSynchr.bind(
      commonUtils, './tests/utils/NotExist.txt'
    );
    expect(fn).to.throw('File: ./tests/utils/NotExist.txt not found');
    done();
  });
});
