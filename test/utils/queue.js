/**
 * Copyright (c) 2017, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or
 * https://opensource.org/licenses/BSD-3-Clause
 */

/**
 * test/utils/queue.js
 */
'use strict'; // eslint-disable-line strict
const expect = require('chai').expect;
const queue = require('../../src/utils/queue');
const errors = require('../../src/errors');

const params = [
  {
    name: 'test0',
    size: 100,
    flushTimeout: 4000,
    verbose: false,
    token: '123abc',
    flushFunction: (data) => data,
  },
  {
    name: 'test1',
    size: 50,
    flushTimeout: 3000,
    verbose: false,
    token: '123abc',
    flushFunction: (data) => data,
  },
];

describe('test/utils/queue.js >', () => {
  describe('create/get/exists >', () => {
    it('OK - queues created and added to map', (done) => {
      const q0 = queue.create(params[0]);
      const q1 = queue.create(params[1]);
      expect(q0).to.have.property('_name', 'test0');
      expect(q0).to.have.property('_size', 100);
      expect(q0).to.have.property('_flushTimeout', 4000);
      expect(q1).to.have.property('_name', 'test1');
      expect(q1).to.have.property('_size', 50);
      expect(q1).to.have.property('_flushTimeout', 3000);
      expect(queue.get('test0')).to.have.property('_name', 'test0');
      expect(queue.get('test1')).to.have.property('_name', 'test1');
      expect(queue.exists('test0')).to.be.true;
      return done();
    });

    it('queue name not found', (done) => {
      expect(queue.get('DOES_NOT_EXIST')).to.be.false;
      expect(queue.exists('DOES_NOT_EXIST')).to.be.false;
      return done();
    });
  });

  describe('updateSize >', () => {
    it('OK', (done) => {
      const q = queue.create(params[0]);
      expect(q).to.have.property('_size', 100);
      const n = queue.updateSize('test0', 25);
      expect(n).to.be.equal(25);
      expect(queue.get('test0')).to.have.property('_size', 25);
      return done();
    });

    it('error - size is string', (done) => {
      const q = queue.create(params[0]);
      expect(q).to.have.property('_size', 100);
      try {
        const n = queue.updateSize('test0', 'Hello');
        return done(new Error('expecting error here'));
      } catch (err) {
        expect(err).to.have.property('message', 'Invalid queue size Hello');
        return done();
      }
    });

    it('error - size is negative number', (done) => {
      const q = queue.create(params[0]);
      expect(q).to.have.property('_size', 100);
      try {
        const n = queue.updateSize('test0', -1);
        return done(new Error('expecting error here'));
      } catch (err) {
        expect(err)
        .to.have.property('message', 'Invalid queue size -1');
        return done();
      }
    });

    it('error - no queue found with name', (done) => {
      try {
        queue.updateSize('DOES_NOT_EXIST', 100);
        return done(new Error('expecting error here'));
      } catch (err) {
        expect(err)
        .to.have.property('message', 'Queue "DOES_NOT_EXIST" not found');
        return done();
      }
    });
  });

  describe('updateFlushTimeout >', () => {
    it('OK', (done) => {
      const q = queue.create(params[0]);
      expect(q).to.have.property('_flushTimeout', 4000);
      const n = queue.updateFlushTimeout('test0', 1000);
      expect(n).to.be.equal(1000);
      expect(queue.get('test0')).to.have.property('_flushTimeout', 1000);
      return done();
    });

    it('error - timeout is string', (done) => {
      const q = queue.create(params[0]);
      expect(q).to.have.property('_flushTimeout', 4000);
      try {
        const n = queue.updateFlushTimeout('test0', 'Hello');
        return done(new Error('expecting error here'));
      } catch (err) {
        expect(err)
        .to.have.property('message', 'Invalid queue flush timeout Hello');
        return done();
      }
    });

    it('error - timeout is negative number', (done) => {
      const q = queue.create(params[0]);
      expect(q).to.have.property('_flushTimeout', 4000);
      try {
        const n = queue.updateFlushTimeout('test0', -1);
        return done(new Error('expecting error here'));
      } catch (err) {
        expect(err)
        .to.have.property('message', 'Invalid queue flush timeout -1');
        return done();
      }
    });

    it('error - no queue found with name', (done) => {
      try {
        queue.updateFlushTimeout('DOES_NOT_EXIST', 1000);
        return done(new Error('expecting error here'));
      } catch (err) {
        expect(err)
        .to.have.property('message', 'Queue "DOES_NOT_EXIST" not found');
        return done();
      }
    });
  });

  describe('flushAll/enqueue >', () => {
    it('OK', (done) => {
      const q0 = queue.create(params[0]);
      const q1 = queue.create(params[1]);
      const arr = ['1', '2', '3'];
      queue.enqueue('test0', arr);
      queue.enqueue('test1', arr);
      expect(q0.Items).deep.equal(arr);
      expect(q1.Items).deep.equal(arr);
      queue.flushAll();
      expect(q0.Items).deep.equal([]);
      expect(q1.Items).deep.equal([]);
      return done();
    });
  });

  describe('flushes when exceeds max size >', () => {
    it('OK', (done) => {
      queue.create({
        name: 'test',
        size: 3,
        flushTimeout: 300,
        verbose: false,
        flushFunction: (data) => data,
      });
      queue.enqueue('test', [1, 2, 3, 4]);
      expect(queue.get('test').Items).to.have.property('length', 1);
      return done();
    });
  });

  describe('flushes after timeout >', () => {
    it('OK', (done) => {
      queue.create({
        name: 'test',
        size: 100,
        flushTimeout: 10,
        verbose: false,
        flushFunction: (data) => data,
      });
      queue.enqueue('test', [1, 2, 3, 4]);
      setTimeout(() => {
        expect(queue.get('test').Items).to.have.property('length', 0);
        return done();
      }, 15);
    });
  });

  describe('flush function args >', () => {
    it('OK', (done) => {
      const tokenStr = 'some-random-token-string-dfasdfdasfdsfds';
      const url = 'https://mock.refocus.com/samples/upsert/bulk';
      let flushResult = {};
      queue.create({
        name: 'test',
        size: 3,
        flushTimeout: 300,
        verbose: false,
        token: tokenStr,
        url,
        flushFunction: (data, token) => {
          flushResult = { data, token };
          return flushResult;
        },
      });
      queue.enqueue('test', [1, 2, 3, 4]);
      expect(queue.get('test').Items).to.have.property('length', 1);
      expect(flushResult.token).to.be.equal(tokenStr);
      return done();
    });
  });
});
