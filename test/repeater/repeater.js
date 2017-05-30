/**
 * Copyright (c) 2017, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or
 * https://opensource.org/licenses/BSD-3-Clause
 */

/**
 * test/repeater/repeater.js
 */

const repeater = require('../../src/repeater/repeater');
const repeatTracker = repeater.repeatTracker;
const expect = require('chai').expect;

describe('test/repeater/repeater.js >', () => {
  it('startNewGeneratorRepeat should start a new generator repeat', (done) => {
    const obj = {
      name: 'Generator0',
      interval: 6000,
    };
    const ret = repeater.startNewGeneratorRepeat(obj);
    expect(ret.repeatHandle).to.not.equal(undefined);
    expect(ret.repeatInterval).to.equal(obj.interval);
    expect(ret.repeatName).to.equal('Generator0');
    expect(ret.repeat.name).to.equal('collectStub');
    expect(repeatTracker.Generator0).to.equal(ret.repeatHandle);
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

  it('calling stopRepeat should stop the repeat and delete it ' +
    'from the tracker', (done) => {
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

      // repeat stopped
      repeater.stopRepeat(obj);
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

      // repeat updated
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

  it('stopping a repeat not in the repeatTracker should throw an ' +
    'error', (done) => {
    const obj = {
      name: 'someRandomName',
      interval: 10,
    };

    try {
      repeater.stopRepeat(obj);
      done('Expecting ResourceNotFoundError');
    } catch (err) {
      if (err.name === 'ResourceNotFoundError') {
        return done();
      }

      return done(err);
    }
  });

  it('if a repeat already exists with , a new repeat with the same name ' +
    'should not be created', (done) => {
    const obj = {
      name: 'someRandomName',
      interval: 10,
    };

    function stub() { }

    try {
      repeater.startNewRepeat(obj, stub);
      repeater.startNewRepeat(obj, stub);
      done('Expecting ValidationError');
    } catch (err) {
      if (err.name === 'ValidationError') {
        return done();
      }

      return done(err);
    }
  });

  it('should not be able to repeat a task with an object not having name ' +
    'attributes', (done) => {
    const obj = {
      interval: 10,
    };

    function stub() { }

    try {
      repeater.startNewRepeat(obj, stub);
      done('Expecting ValidationError');
    } catch (err) {
      if (err.name === 'ValidationError') {
        return done();
      }

      return done(err);
    }
  });

  it('should not be able to repeat a task with an object not having interval ' +
    'attributes', (done) => {
    const obj = {
      name: 10,
    };

    function stub() { }

    try {
      repeater.startNewRepeat(obj, stub);
      done('Expecting ValidationError');
    } catch (err) {
      if (err.name === 'ValidationError') {
        return done();
      }

      return done(err);
    }
  });

  it('should not be able to update a task with an object not having interval ' +
    'or name attributes', (done) => {
    const obj = {
      interval: 10,
      name: 'Gen',
    };

    const objNew = {
    };

    function stub() { }

    try {
      repeater.startNewRepeat(obj, stub);
      repeater.updateRepeat(objNew, stub);
      done('Expecting ValidationError');
    } catch (err) {
      if (err.name === 'ValidationError') {
        return done();
      }

      return done(err);
    }
  });

  it('should not be able to create a task without the task ' +
    'function', (done) => {
    const obj = {
      interval: 10,
      name: 'Gen_NoTask',
    };

    try {
      repeater.startNewRepeat(obj);
      done('Expecting ValidationError');
    } catch (err) {
      if (err.name === 'ValidationError') {
        return done();
      }

      return done(err);
    }
  });
});
