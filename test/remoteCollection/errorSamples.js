/**
 * Copyright (c) 2019, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or
 * https://opensource.org/licenses/BSD-3-Clause
 */

/**
 * test/remoteCollection/errorSamples.js
 */
const expect = require('chai').expect;
const errorSamples = require('../../src/remoteCollection/errorSamples');

describe('test/remoteCollection/errorSamples.js >', () => {
  const cr = {
    aspects: [{ name: 'aspect1' }],
    subjects: [{ absolutePath: 'subject1' }],
  };

  it('creates samples based on subjects/aspects and message', () => {
    const messageBody = '1234567890';
    expect(errorSamples(cr, messageBody)).to.deep.equal([
      {
        name: 'subject1|aspect1',
        messageCode: 'ERROR',
        messageBody: '1234567890',
        value: 'ERROR',
      }
    ]);
  });

  it('not over max length, not truncated', () => {
    const messageBody = ''.padEnd(4096);
    expect(errorSamples(cr, messageBody)).to.deep.equal([
      {
        name: 'subject1|aspect1',
        messageCode: 'ERROR',
        messageBody: ''.padEnd(4096),
        value: 'ERROR',
      }
    ]);
  });

  it('long message is truncated', () => {
    const messageBody = ''.padEnd(4097);
    expect(errorSamples(cr, messageBody)).to.deep.equal([
      {
        name: 'subject1|aspect1',
        messageCode: 'ERROR',
        messageBody: ''.padEnd(4093)+'...',
        value: 'ERROR',
      }
    ]);
  });
});
