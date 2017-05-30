/**
 * Copyright (c) 2017, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or
 * https://opensource.org/licenses/BSD-3-Clause
 */

/**
 * test/utils/sampleUpsertUtils.js
 */
const expect = require('chai').expect;
const sampleUpsertUtils = require('../../src/utils/sampleUpsertUtils');
const request = require('superagent');
const mock = require('superagent-mocker')(request);

describe('test/utils/sampleUpsertUtils.js >', () => {
  const dummyStr = 'hello I am a dummy string!';
  const properRegistryObject = { url: dummyStr, token: dummyStr };

  describe('doBulkUpsert tests', () => {

    // clear stub
    after(mock.clearRoutes);

    it('no url input gives validation error', (done) => {
      sampleUpsertUtils.doBulkUpsert({ token: 'dummy' }, [])
      .then(() => done(new Error('Expected validation error')))
      .catch((err) => {
        expect(err.name).to.equal('ValidationError');
        expect(err.status).to.equal(400);
        done();
      });
    });

    it('no array input gives validation error', (done) => {
      sampleUpsertUtils.doBulkUpsert(properRegistryObject)
      .then(() => done(new Error('Expected validation error')))
      .catch((err) => {
        expect(err.name).to.equal('ValidationError');
        expect(err.status).to.equal(400);
        done();
      });
    });

    it('empty array is ok', (done) => {

      // set up stub
      mock.post(properRegistryObject.url, () => Promise.resolve());
      sampleUpsertUtils.doBulkUpsert(properRegistryObject, [])
      .then((object) => {
        expect(object.status).to.equal(200);
        done();
      })
      .catch(done);
    });
  });
});
