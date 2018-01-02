/**
 * Copyright (c) 2017, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or
 * https://opensource.org/licenses/BSD-3-Clause
 */

/**
 * test/utils/queueUtils.js
 */
const expect = require('chai').expect;
const queueUtils = require('../../src/utils/queueUtils');
const errors = require('../../src/errors');
const configModule = require('../../src/config/config');
const refocusUrl = 'http://www.example.com';

function flushFunction(data) {
  return data;
}

function validateError(data) {
  throw new errors.ValidationError('validateError');
}

const queueParams = {
  name: 'test',
  size: 100,
  flushTimeout: 4000,
  verbose: false,
  flushFunction: flushFunction,
};

describe('test/utils/queueUtils.js - queue utils unit tests >', () => {
  before(() => {
    configModule.clearConfig();
    configModule.initializeConfig();
  });

  after(() => configModule.clearConfig());

  it('Create queue', (done) => {
    queueUtils.createQueue(queueParams);
    const queue = queueUtils.getQueue('test');
    expect(queue._size).to.be.equal(100);
    expect(queue._flushTimeout).to.be.equal(4000);
    return done();
  });

  it('Get queue', (done) => {
    queueUtils.createQueue(queueParams);
    const queue = queueUtils.getQueue('test');
    expect(queue._size).to.be.equal(100);
    expect(queue._flushTimeout).to.be.equal(4000);
    return done();
  });

  it('Change the queue Size', (done) => {
    queueUtils.createQueue(queueParams);
    const queue = queueUtils.getQueue('test');
    expect(queue._size).to.be.equal(100);
    queue._size = 50;
    const newQueue = queueUtils.getQueue('test');
    expect(newQueue._size).to.be.equal(50);
    return done();
  });

  it('Change the queue flush time', (done) => {
    queueUtils.createQueue(queueParams);
    const queue = queueUtils.getQueue('test');
    expect(queue._flushTimeout).to.be.equal(4000);
    queue._flushTimeout = 500;
    const newQueue = queueUtils.getQueue('test');
    expect(newQueue._flushTimeout).to.be.equal(500);
    return done();
  });

  it('Create two queue', (done) => {
    queueUtils.createQueue(queueParams);
    queueUtils.createQueue({
      name: 'test1',
      size: 100,
      flushTimeout: 3000,
      verbose: false,
      flushFunction: flushFunction,
    });
    const queue = queueUtils.getQueue('test');
    const queue1 = queueUtils.getQueue('test1');
    expect(queue._size).to.be.equal(100);
    expect(queue1._size).to.be.equal(100);
    return done();
  });

  it('Flush queue after queue size done', (done) => {
    queueUtils.createQueue({
      name: 'test',
      size: 3,
      flushTimeout: 300,
      verbose: false,
      flushFunction: flushFunction,
    });
    const queue = queueUtils.getQueue('test');
    queue.add(1);
    queue.add(2);
    queue.add(3);
    queue.add(4);
    expect(queue.items.length).to.be.equal(1);
    return done();
  });

  it('Flush queue after queue flushtimeout done', (done) => {
    queueUtils.createQueue({
      name: 'test',
      size: 100,
      flushTimeout: 300,
      verbose: false,
      flushFunction: flushFunction,
    });
    const queue = queueUtils.getQueue('test');
    queue.add(1);
    queue.add(2);
    queue.add(3);
    queue.add(4);

    setTimeout(() => {
      expect(queue.items.length).to.be.equal(0);
      return done();
    }, 400);
  });

  it('Flush queue, check that token is passed correctly to the function',
  (done) => {
    const tokenStr = 'some-random-token-string-dfasdfdasfdsfds';
    let flushResult = {};
    queueUtils.createQueue({
      name: 'test',
      size: 100,
      flushTimeout: 300,
      verbose: false,
      flushFunction: (data, token) => {
        flushResult = { data, token };
        return flushResult;
      },

      token: tokenStr,
    });
    const queue = queueUtils.getQueue('test');
    queue.add(1);
    queue.add(2);
    queue.add(3);
    queue.add(4);

    setTimeout(() => {
      expect(queue.items.length).to.be.equal(0);
      expect(flushResult.token).to.be.equal(tokenStr);
      return done();
    }, 400);
  });

  it('Enqueue function test, new relatedLinks', (done) => {
    const config = configModule.getConfig();
    config.refocus.url = refocusUrl;
    config.name = 'collectorName';
    const samplesArr = [{
      name: 'B|A1', value: '1',
    }, {
      name: 'B|A2', value: '1',
    }, {
      name: 'B|A3', value: '1',
    }, {
      name: 'B|A4', value: '1',
    },
    ];
    queueUtils.createQueue(queueParams);
    const queue = queueUtils.getQueue('test');
    queueUtils.enqueueFromArray('test', samplesArr);
    expect(queue.items.length).to.be.equal(4);
    return done();
  });

  it('Validation individual data error test', (done) => {
    queueUtils.createQueue(queueParams);
    const queue = queueUtils.getQueue('test');
    try {
      queueUtils.enqueueFromArray('test', [1, 2, 3, 4], validateError);
    } catch (err) {
      expect(err.name).to.be.equal('ValidationError');
      return done();
    }
  });
});
