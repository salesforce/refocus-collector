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
  it('createGeneratorRepeater should start a new generator repeat', (done) => {
    const def = {
      name: 'Generator0',
      interval: 6000,
    };
    const ret = repeater.createGeneratorRepeater(def);
    expect(ret.handle).to.not.equal(undefined);
    expect(ret.interval).to.equal(def.interval);
    expect(ret.name).to.equal('Generator0');
    expect(ret.funcName).to.equal('collectStub');
    expect(repeatTracker.Generator0).to.equal(ret.handle);
    done();
  });

  it('createGeneratorRepeat should set the' +
    ' onProgress callback to handleCollectResponse', (done) => {
    const def = {
      name: 'Generator0.1',
      interval: 6000,
    };

    const ret = repeater.createGeneratorRepeater(def);
    expect(ret.handle).to.not.equal(undefined);
    expect(ret.interval).to.equal(def.interval);
    expect(ret.name).to.equal('Generator0.1');
    expect(ret.funcName).to.equal('collectStub');
    expect(ret.onProgress.name).to.equal('handleCollectResponse');
    expect(repeatTracker['Generator0.1']).to.equal(ret.handle);
    done();
  });

  it('updateNewGeneratorRepeat should set the' +
    ' onProgress callback to handleCollectResponse', (done) => {
    const obj = {
      name: 'Generator0.2',
      interval: 6000,
    };
    repeater.createGeneratorRepeater(obj);
    obj.name = 'Generator0.2';
    obj.interval = 60;
    const ret = repeater.updateGeneratorRepeater(obj);
    expect(ret.handle).to.not.equal(undefined);
    expect(ret.interval).to.equal(obj.interval);
    expect(ret.name).to.equal('Generator0.2');
    expect(ret.funcName).to.equal('collectStub');
    expect(ret.onProgress.name).to.equal('handleCollectResponse');
    expect(repeatTracker['Generator0.2']).to.equal(ret.handle);
    done();
  });

  it('updateGeneratorRepeat should start a new generator repeat', (done) => {
    const def = {
      name: 'Generator1',
      interval: 6000,
    };
    repeater.createGeneratorRepeater(def);
    def.name = 'Generator1';
    def.interval = 60;
    const ret = repeater.updateGeneratorRepeater(def);
    expect(ret.handle).to.not.equal(undefined);
    expect(ret.interval).to.equal(def.interval);
    expect(ret.name).to.equal('Generator1');
    expect(ret.funcName).to.equal('collectStub');
    expect(repeatTracker.Generator1).to.equal(ret.handle);
    done();
  });

  it('create should start a repeat function that was passed in as an argument',
  (done) => {
    function taskStub() {}

    const def = {
      name: 'Generator2',
      interval: 6000,
      func: taskStub,
    };
    const ret = repeater.create(def);
    expect(ret.handle).to.not.equal(undefined);
    expect(ret.interval).to.equal(def.interval);
    expect(ret.name).to.equal('Generator2');
    expect(ret.funcName).to.equal('taskStub');
    expect(repeatTracker.Generator2).to.equal(ret.handle);
    done();
  });

  it('create should work with all the params passed', (done) => {
    let counter = 0;
    function stub() {
      counter++;
    }

    const def = {
      name: 'Generator3',
      interval: 10,
      func: stub,
    };

    const ret = repeater.create(def);
    setTimeout(() => {
      expect(counter).to.be.at.least(1);
      expect(ret.handle).to.not.equal(undefined);
      expect(ret.interval).to.equal(def.interval);
      expect(ret.name).to.equal('Generator3');
      expect(ret.funcName).to.equal('stub');
      expect(repeatTracker.Generator3).to.equal(ret.handle);
      return done();
    }, 100);
  });

  it('calling stop should stop the repeat and delete it from the tracker',
  (done) => {
    let currentCount = 0;
    function stub() {
      currentCount++;
    }

    const def = {
      name: 'Generator4',
      interval: 100,
      func: stub,
    };
    let oldCount = 0;

    repeater.create(def);
    setTimeout(() => {
      // proves repeat ran
      expect(currentCount).to.be.at.least(1);
      repeater.stop(def.name);
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

  it('updating a repeat should update the repeat and the repeatTracker',
  (done) => {
    let count = 0;
    let newCount = 0;
    function stub() {
      count++;
    }

    function stubNew() {
      newCount++;
    }

    const def = {
      name: 'Generator5',
      interval: 1,
      func: stub,
    };

    repeater.create(def);
    setTimeout(() => {
      // proves repeater ran
      expect(count).to.be.at.least(1);

      // repeater updated
      def.interval = 100000;
      def.func = stubNew;

      const ret = repeater.update(def);
      expect(ret.handle).to.not.equal(undefined);
      expect(ret.interval).to.equal(def.interval);
      expect(ret.name).to.equal('Generator5');
      expect(ret.funcName).to.equal('stubNew');
      expect(repeatTracker.Generator5).to.equal(ret.handle);
    }, 100);
    setTimeout(() => {

      // proves repeat was updated
      expect(newCount).to.equal(1);
      return done();
    }, 500);
  });

  it('should call the onProgress call back after every repeat', (done) => {
    function stub() { }

    let counter = 0;
    function onProgress() {
      counter++;
    }

    const def = {
      name: 'testRepeatProgress',
      interval: 10,
      func: stub,
      onProgress,
    };
    repeater.create(def);
    setTimeout(() => {
      expect(counter).to.be.at.least(1);
      return done();
    }, 100);
  });

  it('stopping a repeat not in the repeatTracker should throw an error',
  (done) => {
    const obj = {
      name: 'someRandomName',
      interval: 10,
    };

    try {
      repeater.stop(obj);
      done('Expecting ResourceNotFoundError');
    } catch (err) {
      if (err.name === 'ResourceNotFoundError') {
        return done();
      }

      return done(err);
    }
  });

  describe('validateDefinition >', () => {
    it('OK', (done) => {
      repeater.create({ name: 'Gen', interval: 10, func: () => {} });
      done();
    });

    it('missing func', (done) => {
      try {
        repeater.create({ name: 'Gen', interval: 10 });
        done('Expecting ValidationError');
      } catch (err) {
        if (err.name === 'ValidationError') {
          return done();
        }

        return done(err);
      }
    });

    it('wrong typeof func', (done) => {
      try {
        repeater.create({ name: 'Gen', interval: 10, func: 'Hello!' });
        done('Expecting ValidationError');
      } catch (err) {
        if (err.name === 'ValidationError') {
          return done();
        }

        return done(err);
      }
    });

    it('missing name', (done) => {
      try {
        repeater.create({ interval: 10, func: () => {} });
        done('Expecting ValidationError');
      } catch (err) {
        if (err.name === 'ValidationError') {
          return done();
        }

        return done(err);
      }
    });

    it('wrong typeof name', (done) => {
      try {
        repeater.create({ name: 123, interval: 10, func: () => {} });
        done('Expecting ValidationError');
      } catch (err) {
        if (err.name === 'ValidationError') {
          return done();
        }

        return done(err);
      }
    });

    it('missing interval', (done) => {
      try {
        repeater.create({ name: 'Gen', func: () => {} });
        done('Expecting ValidationError');
      } catch (err) {
        if (err.name === 'ValidationError') {
          return done();
        }

        return done(err);
      }
    });

    it('wrong typeof interval', (done) => {
      try {
        repeater.create({ name: 'Gen', interval: '10', func: () => {} });
        done('Expecting ValidationError');
      } catch (err) {
        if (err.name === 'ValidationError') {
          return done();
        }

        return done(err);
      }
    });

    it('duplicate name', (done) => {
      const def = { name: 'Gen', interval: 10, func: () => {} };

      try {
        repeater.create(def);
        repeater.create(def);
        done('Expecting ValidationError');
      } catch (err) {
        if (err.name === 'ValidationError' &&
          err.message === 'Duplicate repeater name violation: Gen') {
          return done();
        }

        return done(err);
      }
    });
  });
});
