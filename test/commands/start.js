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
const obj = {
  collectorName1: {
    url: 'http://www.xyz.com',
    token: 'ewuifiekhfewfhsfhshjfjhfgewuih',
  },
};
require('../../src/config/config').setRegistry(obj);
const expect = require('chai').expect;
const start = require('../../src/commands/start');
const repeater = require('../../src/repeater/repeater');

describe('test/commands/start >', () => {
  it('ok', (done) => {
    start.execute();
    expect(repeater.repeatTracker).to.have.property('Heartbeat');
    expect(repeater.repeatTracker).to.have.property('SampleQueueFlush');
    done();
  });

  it('heartbeat repeater fails?' /* , (done) => {
    start.execute();
    // TODO confirm that error was logged and thrown
    done();
  } */);
});
