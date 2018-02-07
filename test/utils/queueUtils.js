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
'use strict'; // eslint-disable-line strict
const expect = require('chai').expect;
const qu = require('../../src/utils/queueUtils');
const errors = require('../../src/errors');
const configModule = require('../../src/config/config');

function flushFunction(data) {
  return data;
}

function validateError() {
  throw new errors.ValidationError('validateError');
}

const queueParams = {
  name: 'test',
  size: 100,
  flushTimeout: 4000,
  verbose: false,
  flushFunction,
};

describe('test/utils/queueUtils.js - queue utils unit tests >', () => {
  before(() => {
    /*
     * clear and initialize the config to avoid any errors while flushing all
     * buffered queue objects
     */
    configModule.clearConfig();
    configModule.initializeConfig();
  });

  it('Create queue', (done) => {
    qu.createQueue(queueParams);
    const queue = qu.getQueue('test');
    expect(queue._size).to.be.equal(100);
    expect(queue._flushTimeout).to.be.equal(4000);
    return done();
  });

  it('Get queue', (done) => {
    qu.createQueue(queueParams);
    const queue = qu.getQueue('test');
    expect(queue._size).to.be.equal(100);
    expect(queue._flushTimeout).to.be.equal(4000);
    return done();
  });

  it('Change the queue Size', (done) => {
    qu.createQueue(queueParams);
    const queue = qu.getQueue('test');
    expect(queue._size).to.be.equal(100);
    queue._size = 50;
    const newQueue = qu.getQueue('test');
    expect(newQueue._size).to.be.equal(50);
    return done();
  });

  it('Change the queue flush time', (done) => {
    qu.createQueue(queueParams);
    const queue = qu.getQueue('test');
    expect(queue._flushTimeout).to.be.equal(4000);
    queue._flushTimeout = 500;
    const newQueue = qu.getQueue('test');
    expect(newQueue._flushTimeout).to.be.equal(500);
    return done();
  });

  it('Create two queue', (done) => {
    qu.createQueue(queueParams);
    qu.createQueue({
      name: 'test1',
      size: 100,
      flushTimeout: 3000,
      verbose: false,
      flushFunction,
    });
    const queue = qu.getQueue('test');
    const queue1 = qu.getQueue('test1');
    expect(queue._size).to.be.equal(100);
    expect(queue1._size).to.be.equal(100);
    return done();
  });

  it('flush all buffered queue objects', (done) => {
    const firstQueue = qu.createQueue({
      name: 'firstQueue',
      size: 100,
      flushTimeout: 3000,
      verbose: false,
      flushFunction,
    });

    const secondQueue = qu.createQueue({
      name: 'secondQueue',
      size: 100,
      flushTimeout: 3000,
      verbose: false,
      flushFunction,
    });

    const dataArray = ['1', '2', '3'];
    qu.enqueueFromArray('firstQueue', dataArray);
    qu.enqueueFromArray('secondQueue', dataArray);
    expect(firstQueue.Items).deep.equal(dataArray);
    expect(secondQueue.Items).deep.equal(dataArray);

    // call flush all
    qu.flushAllBufferedQueues();

    expect(firstQueue.Items).deep.equal([]);
    expect(secondQueue.Items).deep.equal([]);
    return done();
  });

  it('Flush queue after queue size done', (done) => {
    qu.createQueue({
      name: 'test',
      size: 3,
      flushTimeout: 300,
      verbose: false,
      flushFunction,
    });
    const queue = qu.getQueue('test');
    queue.add(1);
    queue.add(2);
    queue.add(3);
    queue.add(4);
    expect(queue.items.length).to.be.equal(1);
    return done();
  });

  it('Flush queue after queue flushtimeout done', (done) => {
    qu.createQueue({
      name: 'test',
      size: 100,
      flushTimeout: 300,
      verbose: false,
      flushFunction,
    });
    const queue = qu.getQueue('test');
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
    qu.createQueue({
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
    const queue = qu.getQueue('test');
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

  it('Enqueue function test', (done) => {
    qu.createQueue(queueParams);
    const queue = qu.getQueue('test');
    qu.enqueueFromArray('test', [1, 2, 3, 4]);
    expect(queue.items.length).to.be.equal(4);
    return done();
  });

  it('Validation individual data error test', (done) => {
    qu.createQueue(queueParams);
    try {
      qu.enqueueFromArray('test', [1, 2, 3, 4], validateError);
    } catch (err) {
      expect(err.name).to.be.equal('ValidationError');
      return done();
    }
  });

  describe('createOrUpdateGeneratorQueue >', () => {
    const collectorConfig = {
      heartbeatInterval: 50,
      maxSamplesPerBulkRequest: 1000,
      sampleUpsertQueueTime: 4000,
    };

    before(() => {
      configModule.clearConfig();
      configModule.initializeConfig();
    });

    it('OK, new queue created', (done) => {
      const qpresent = qu.getQueue('qName1');
      expect(qpresent).to.be.equal(undefined);

      qu.createOrUpdateGeneratorQueue('qName1', 'mytoken',
        collectorConfig);
      const qGen1 = qu.getQueue('qName1');
      expect(qGen1._size).to.be.equal(100);
      done();
    });

    it('OK, queue already exists, updated', (done) => {
      qu.createQueue({
        name: 'qName1',
        size: 10,
        flushTimeout: 4000,
        verbose: false,
        flushFunction: (data) => data,
      });

      const qpresent = qu.getQueue('qName1');
      expect(qpresent._size).to.be.equal(10);
      qu.createOrUpdateGeneratorQueue('qName1', 'mytoken',
        collectorConfig);
      const qUpdated = qu.getQueue('qName1');
      expect(qUpdated._size).to.be.equal(1000);
      done();
    });

    it('Not ok, queue name null', (done) => {
      try {
        qu.createOrUpdateGeneratorQueue(null, 'mytoken',
          collectorConfig);
        done(new Error('Expecting error'));
      } catch (err) {
        expect(err.name).to.be.equal('ValidationError');
        expect(err.message).to.be.equal('Missing queue name.');
        done();
      }
    });

    it('Not ok, heartbeat response null', (done) => {
      try {
        qu.createOrUpdateGeneratorQueue('qName1', 'mytoken', null);
        done(new Error('Expecting error'));
      } catch (err) {
        expect(err.name).to.be.equal('ValidationError');
        expect(err.message).to.be.equal('Missing collectorConfig.');
        done();
      }
    });
  });
});
