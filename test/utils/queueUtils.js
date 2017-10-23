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
const config = require('../../src/config/config');

function flushFunction(refocusObject, data) {
  return data;
}

describe('test/utils/queueUtils.js - queue utils unit tests >', () => {
  it('Create queue', (done) => {
    queueUtils.createQueue('test', 100, 4000, false, flushFunction);
    const queue = queueUtils.getQueue('test');
    expect(queue._size).to.be.equal(100);
    expect(queue._flushTimeout).to.be.equal(4000);
    return done();
  });

  it('Get queue', (done) => {
    queueUtils.createQueue('test', 100, 4000, false, flushFunction);
    const queue = queueUtils.getQueue('test');
    expect(queue._size).to.be.equal(100);
    expect(queue._flushTimeout).to.be.equal(4000);
    return done();
  });

  it('Change the queue Size', (done) => {
    queueUtils.createQueue('test', 100, 4000, false, flushFunction);
    const queue = queueUtils.getQueue('test');
    expect(queue._size).to.be.equal(100);
    queue._size = 50;
    const newQueue = queueUtils.getQueue('test');
    expect(newQueue._size).to.be.equal(50);
    return done();
  });

  it('Change the queue flush time', (done) => {
    queueUtils.createQueue('test', 100, 4000, false, flushFunction);
    const queue = queueUtils.getQueue('test');
    expect(queue._flushTimeout).to.be.equal(4000);
    queue._flushTimeout = 500;
    const newQueue = queueUtils.getQueue('test');
    expect(newQueue._flushTimeout).to.be.equal(500);
    return done();
  });

  it('Create two queue', (done) => {
    queueUtils.createQueue('test', 100, 4000, false, flushFunction);
    queueUtils.createQueue('test1', 100, 4000, false, flushFunction);
    const queue = queueUtils.getQueue('test');
    const queue1 = queueUtils.getQueue('test1');
    expect(queue._size).to.be.equal(100);
    expect(queue1._size).to.be.equal(100);
    return done();
  });

  it('Flush queue after queue size done', (done) => {
    queueUtils.createQueue('test', 3, 4000, false, flushFunction);
    const queue = queueUtils.getQueue('test');
    queue.add(1);
    queue.add(2);
    queue.add(3);
    queue.add(4);
    expect(queue.items.length).to.be.equal(1);
    return done();
  });

  it('Flush queue after queue flushtimeout done', (done) => {
    queueUtils.createQueue('test', 10, 300, false, flushFunction);
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

  it('Enqueue function test', (done) => {
    queueUtils.createQueue('test', 10, 300, false, flushFunction);
    const queue = queueUtils.getQueue('test');
    queueUtils.enqueueFromArray('test', [1, 2, 3, 4]);
    expect(queue.items.length).to.be.equal(4);
    return done();
  });
});
