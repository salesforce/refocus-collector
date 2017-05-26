/**
 * Copyright (c) 2017, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or
 * https://opensource.org/licenses/BSD-3-Clause
 */

/**
 * tests/repeater/repeater.js
 */

const repeater = require('../../src/repeater/repeater');
const repeatTracker = repeater.repeatTracker;
const expect = require('chai').expect;

describe('tests/repeater/repeater.js: unit tests', () => {
  it('startNewGeneratorRepeat should start a new generator repeat', (done) => {
    const obj = {
      name: 'Generator1',
      interval: 6000,
    };
    const ret = repeater.startNewGeneratorRepeat(obj);
    expect(ret.repeatHandle).to.not.equal(undefined);
    expect(ret.repeatInterval).to.equal(obj.interval);
    expect(ret.repeatName).to.equal('Generator1');
    expect(ret.repeat.name).to.equal('collectStub');
    expect(repeatTracker.Generator1).to.equal(ret.repeatHandle);
    done();
  });

  it('updateGeneratorRepeat should start a new generator repeat', (done) => {
    const obj = {
      name: 'Generator1',
      interval: 6000,
    };
    repeater.startNewGeneratorRepeat(obj);
    obj.name = 'Generator1';
    obj.interval = 60;
    const ret = repeater.updateGeneratorRepeat(obj);
    expect(ret.repeatHandle).to.not.equal(undefined);
    expect(ret.repeatInterval).to.equal(obj.interval);
    expect(ret.repeatName).to.equal('Generator1');
    expect(ret.repeat.name).to.equal('collectStub');
    expect(repeatTracker.Generator1).to.equal(ret.repeatHandle);
    done();
  });

  it('startNewRepeat should start a repeat function that was passed ' +
    'in as an argument', (done) => {
    const obj = {
      name: 'Generator2',
      interval: 6000,
    };
    function taskStub() {}
    const ret = repeater.startNewRepeat(obj, taskStub);
    expect(ret.repeatHandle).to.not.equal(undefined);
    expect(ret.repeatInterval).to.equal(obj.interval);
    expect(ret.repeatName).to.equal('Generator2');
    expect(ret.repeat.name).to.equal('taskStub');
    expect(repeatTracker.Generator2).to.equal(ret.repeatHandle);
    done();
  });

  it('startNewRepeat should work with all the params passed', (done) => {
    const obj = {
      name: 'Generator3',
      interval: 10,
    };
    let counter = 0;
    function stub() {
      counter++;
    }
    const ret = repeater.startNewRepeat(obj, stub, stub, stub, stub);
    setTimeout(() => {
      expect(counter).to.be.at.least(1);
      expect(ret.repeatHandle).to.not.equal(undefined);
      expect(ret.repeatInterval).to.equal(obj.interval);
      expect(ret.repeatName).to.equal('Generator3');
      expect(ret.repeat.name).to.equal('stub');
      expect(repeatTracker.Generator3).to.equal(ret.repeatHandle);
      return done();
    }, 100);
  });

  it('delete repeat stop the repeate and stop tracking the repeat', (done) => {
    const obj = {
      name: 'Generator4',
      interval: 100,
    };
    let currentCount = 0;
    let oldCount = 0;
    function stub() {
      currentCount++;
    }
    repeater.startNewRepeat(obj, stub);
    setTimeout(() => {
      // proves repeat ran
      expect(currentCount).to.be.at.least(1);

      // repeate stopped
      repeater.stopRepeat(obj.name);
      oldCount = currentCount;
      expect(repeatTracker.Generator4).to.equal(undefined);
    }, 100);
    setTimeout(() => {
      /*
       * it takes a few milliseconds for the repeat to stop , so there is a
       * difference of 1 or 2 between the old and the new count
       */
      expect(currentCount - oldCount).to.be.within(1, 2);
      return done();
    }, 500);
  });

  it('updating a repeat should update the repeat and the ' +
    'repeatTracker', (done) => {
    const obj = {
      name: 'Generator5',
      interval: 1,
    };
    let count = 0;
    function stub() {
      count++;
    }
    let newCount = 0;
    function stubNew() {
      newCount++;
    }
    repeater.startNewRepeat(obj, stub);
    setTimeout(() => {

      // proves repeat ran
      expect(count).to.be.at.least(1);

      // repeate updated
      obj.interval = 100000;

      const ret = repeater.updateRepeat(obj, stubNew, stub, stub, stub);
      expect(ret.repeatHandle).to.not.equal(undefined);
      expect(ret.repeatInterval).to.equal(obj.interval);
      expect(ret.repeatName).to.equal('Generator5');
      expect(ret.repeat.name).to.equal('stubNew');
      expect(repeatTracker.Generator5).to.equal(ret.repeatHandle);
    }, 100);
    setTimeout(() => {

      // proves repeat was updated
      expect(newCount).to.equal(1);
      return done();
    }, 500);
  });

  it('should call the onProgress call back after every repeat', (done) => {
    const obj = {
      name: 'testRepeatProgress',
      interval: 10,
    };
    let counter = 0;
    function stub() { }
    function onProgress() {
      counter++;
    }

    repeater.startNewRepeat(obj, stub, stub, stub, onProgress);
    setTimeout(() => {
      expect(counter).to.be.at.least(1);
      return done();
    }, 100);
  });
});
