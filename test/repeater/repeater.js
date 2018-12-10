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
const tracker = repeater.tracker;
const expect = require('chai').expect;
const ref = { url: 'mock.refocus.com' };
const logger = require('winston');
const u = require('./util');
const MILLIS = 1000;
logger.configure({ level: 0 });

describe('test/repeater/repeater.js >', () => {
  afterEach(() => repeater.stopAllRepeaters());

  describe('createGeneratorRepeater >', () => {
    const dummyFunc = (x) => Promise.resolve(x);

    it('should start a new generator repeat', (done) => {
      const def = {
        name: 'Generator0',
        intervalSecs: 1,
        context: {},
        generatorTemplate: {
          connection: {
            headers: {
              Authorization: 'abddr121345bb',
            },
            url: 'http://example.com',
            bulk: true,
          },
        },
        refocus: ref,
        subjectQuery: '?absolutePath=oneSubject',
      };
      const ret = repeater.createGeneratorRepeater(def, dummyFunc);
      expect(ret.interval).to.equal(MILLIS * def.intervalSecs);
      expect(ret.name).to.equal('Generator0');
      expect(tracker.Generator0).to.equal(ret);
      done();
    });
  });

  describe('create >', () => {
    it('should start repeat function passed in as argument', (done) => {
      function taskStub() {}

      const def = {
        name: 'Generator2',
        interval: 6000,
        func: taskStub,
      };
      const ret = repeater.create(def);
      expect(ret.interval).to.equal(def.interval);
      expect(ret.name).to.equal('Generator2');
      expect(tracker.Generator2).to.equal(ret);
      done();
    });

    it('should work with all the params passed', (done) => {
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
        expect(ret.interval).to.equal(def.interval);
        expect(ret.name).to.equal('Generator3');
        expect(tracker.Generator3).to.equal(ret);
        return done();
      }, 100);
    });
  });

  describe('staggered start times >', () => {
    beforeEach(u.trackExecutionTimes);
    beforeEach(u.createMockHeartbeatRepeater);
    afterEach(u.clearTracking);
    afterEach(repeater.stopAllRepeaters);

    it('basic', () => {
      u.createMockRepeatersWithIntervals('1m', '1m', '1m');
      return u.waitUntil('3m')
      .then(() => {
        u.expectCalledAt('heartbeat', [
          '0s', '15s', '30s', '45s', '60s', '75s', '90s',
          '105s', '120s', '135s', '150s', '165s', '180s',
        ]);
        u.expectCalledAt('gen1', ['1s', '61s', '121s']);
        u.expectCalledAt('gen2', ['2s', '62s', '122s']);
        u.expectCalledAt('gen3', ['3s', '63s', '123s']);
      });
    });

    it('different intervals', () => {
      u.createMockRepeatersWithIntervals('1m', '30s', '50s');
      return u.waitUntil('3m')
      .then(() => {
        u.expectCalledAt('gen1', ['1s', '61s', '121s']);
        u.expectCalledAt('gen2', ['2s', '32s', '62s', '92s', '122s', '152s']);
        u.expectCalledAt('gen3', ['3s', '53s', '103s', '153s']);
      });
    });

    it('offset persists globally', () => {
      u.createMockRepeatersWithIntervals('1m', '1m', '1m');
      return u.waitUntil('3m')
      .then(() => {
        u.expectCalledAt('gen1', ['1s', '61s', '121s']);
        u.expectCalledAt('gen2', ['2s', '62s', '122s']);
        u.expectCalledAt('gen3', ['3s', '63s', '123s']);
      })
      .then(() =>
        u.createMockRepeatersWithIntervals('1m', '1m', '1m')
      )
      .then(() => u.waitUntil('4m'))
      .then(() => {
        u.expectCalledAt('gen1', ['1s', '61s', '121s', '181s']);
        u.expectCalledAt('gen2', ['2s', '62s', '122s', '182s']);
        u.expectCalledAt('gen3', ['3s', '63s', '123s', '183s']);
        u.expectCalledAt('gen4', ['184s']);
        u.expectCalledAt('gen5', ['185s']);
        u.expectCalledAt('gen6', ['186s']);
      })
      .then(() => {
        repeater.stop('gen1');
        repeater.stop('gen3');
        repeater.stop('gen6');
      })
      .then(() =>
        u.createMockRepeatersWithIntervals('1m', '1m', '1m')
      )
      .then(() => u.waitUntil('5m'))
      .then(() => {
        u.expectCalledAt('gen1', ['1s', '61s', '121s', '181s']);
        u.expectCalledAt('gen2', ['2s', '62s', '122s', '182s', '242s']);
        u.expectCalledAt('gen3', ['3s', '63s', '123s', '183s']);
        u.expectCalledAt('gen4', ['184s', '244s']);
        u.expectCalledAt('gen5', ['185s', '245s']);
        u.expectCalledAt('gen6', ['186s']);
        u.expectCalledAt('gen7', ['247s']);
        u.expectCalledAt('gen8', ['248s']);
        u.expectCalledAt('gen9', ['249s']);
      });
    });

    it('offset wraps at 60s', () => {
      u.createMockRepeatersWithIntervals(...Array(59).fill('1m'));
      return u.waitUntil('1m')
      .then(() => {
        u.expectCalledAt('gen1', ['1s']);
        u.expectCalledAt('gen31', ['31s']);
        u.expectCalledAt('gen59', ['59s']);
        u.expectCalledAt('gen60', undefined);
      })
      .then(() =>
        u.createMockRepeatersWithIntervals(...Array(10).fill('1m'))
      )
      .then(() => u.waitUntil('2m'))
      .then(() => {
        u.expectCalledAt('gen60', ['60s', '120s']);
        u.expectCalledAt('gen61', ['61s']);
      });
    });

    it('stopGenerators resets the offset', () => {
      u.createMockRepeatersWithIntervals('1m', '1m', '1m');
      return u.waitUntil('3m')
      .then(() => {
        u.expectCalledAt('gen1', ['1s', '61s', '121s']);
        u.expectCalledAt('gen2', ['2s', '62s', '122s']);
        u.expectCalledAt('gen3', ['3s', '63s', '123s']);
      })
      .then(repeater.stopGenerators)
      .then(() =>
        u.createMockRepeatersWithIntervals('1m', '1m', '1m')
      )
      .then(() => u.waitUntil('4m'))
      .then(() => {
        u.expectCalledAt('gen4', ['181s']);
        u.expectCalledAt('gen5', ['182s']);
        u.expectCalledAt('gen6', ['183s']);
      });
    });

    it('stopAllRepeaters resets the offset', () => {
      u.createMockRepeatersWithIntervals('1m', '1m', '1m');
      return u.waitUntil('3m')
      .then(() => {
        u.expectCalledAt('gen1', ['1s', '61s', '121s']);
        u.expectCalledAt('gen2', ['2s', '62s', '122s']);
        u.expectCalledAt('gen3', ['3s', '63s', '123s']);
      })
      .then(repeater.stopAllRepeaters)
      .then(u.createMockHeartbeatRepeater)
      .then(() =>
        u.createMockRepeatersWithIntervals('1m', '1m', '1m')
      )
      .then(() => u.waitUntil('4m'))
      .then(() => {
        u.expectCalledAt('gen4', ['181s']);
        u.expectCalledAt('gen5', ['182s']);
        u.expectCalledAt('gen6', ['183s']);
      });
    });

    it('stop/pause', () => {
      u.createMockRepeatersWithIntervals('1m', '1m', '1m');
      return u.waitUntil('2m')
      .then(() => {
        u.expectCalledAt('gen1', ['1s', '61s']);
        u.expectCalledAt('gen2', ['2s', '62s']);
        u.expectCalledAt('gen3', ['3s', '63s']);
      })
      .then(() => {
        repeater.stop('gen1');
        repeater.pause('gen2');
      })
      .then(() => u.waitUntil('3m'))
      .then(() => {
        expect(repeater.getPaused()).to.deep.equal(['gen2']);
        u.expectCalledAt('gen1', ['1s', '61s']);
        u.expectCalledAt('gen2', ['2s', '62s']);
        u.expectCalledAt('gen3', ['3s', '63s', '123s']);
      });
    });

    it('stop/pause before first execution', () => {
      u.createMockRepeatersWithIntervals('1m', '1m', '1m');
      repeater.stop('gen1');
      repeater.pause('gen2');
      return u.waitUntil('3m')
      .then(() => {
        expect(repeater.getPaused()).to.deep.equal(['gen2']);
        u.expectCalledAt('gen1', undefined);
        u.expectCalledAt('gen2', undefined);
        u.expectCalledAt('gen3', ['3s', '63s', '123s']);
      });
    });

    it('stop/pause right after first execution', () => {
      u.createMockRepeatersWithIntervals('1m', '1m', '1m');
      return u.waitUntil('1s')
      .then(() => {
        repeater.stop('gen1');
      })
      .then(() => u.waitUntil('2s'))
      .then(() => {
        repeater.pause('gen2');
      })
      .then(() => u.waitUntil('3m'))
      .then(() => {
        expect(repeater.getPaused()).to.deep.equal(['gen2']);
        u.expectCalledAt('gen1', ['1s']);
        u.expectCalledAt('gen2', ['2s']);
        u.expectCalledAt('gen3', ['3s', '63s', '123s']);
      });
    });
  });

  describe('stop >', () => {
    it('should stop the repeat and delete it from the tracker', (done) => {
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
      const g4 = repeater.create(def);
      expect(g4).to.have.property('name', 'Generator4');
      setTimeout(() => {
        // proves repeat ran
        expect(currentCount).to.be.at.least(1);
        repeater.stop(def.name);
        oldCount = currentCount;
        expect(tracker.Generator4).to.equal(undefined);
      }, 200);
      setTimeout(() => {
        expect(currentCount).to.equal(oldCount);
        return done();
      }, 600);
    });

    it('stop and start should update the repeat and tracker', (done) => {
      let count = 0;
      let newCount = 0;
      function stub() {
        count++;
      }

      function stubNew() {
        newCount++;
      }

      repeater.create({
        name: 'Generator5',
        interval: 1,
        func: stub,
      });
      setTimeout(() => {
        expect(count).to.be.at.least(1); // proves repeater ran

        // repeater updated
        repeater.stop('Generator5');
        const ret = repeater.create({
          name: 'Generator5',
          interval: 300,
          func: stubNew,
        });
        expect(ret.interval).to.equal(300);
        expect(ret.name).to.equal('Generator5');
        expect(tracker.Generator5).to.equal(ret);
      }, 100);
      setTimeout(() => {
        expect(newCount).to.equal(1); // proves repeat was updated
        return done();
      }, 1200);
    });

    it('noop if repeater being stopped is not in the tracker', (done) => {
      try {
        repeater.stop('someRandomName');
        done();
      } catch (err) {
        return done(err);
      }
    });
  });

  describe('stopAllRepeaters >', () => {
    it('OK even when tracker is empty', (done) => {
      const _tracker = repeater.stopAllRepeaters();
      expect(_tracker).to.deep.equal({});
      done();
    });

    it('OK with tracker tracking repeats', (done) => {
      function stub() {}

      const def = {
        name: 'Generators_To_Stop',
        interval: 1,
        func: stub,
      };

      repeater.create(def);
      const _tracker = repeater.stopAllRepeaters();
      expect(_tracker).to.deep.equal({});
      done();
    });
  });

  describe('pause and resume >', () => {
    it('OK even when tracker is empty', (done) => {
      repeater.pauseGenerators();
      expect(repeater.getPaused()).to.have.lengthOf(0);
      repeater.resumeGenerators();
      expect(repeater.getPaused()).to.have.lengthOf(0);
      done();
    });

    it('pause and resume should pause and resume the task function ' +
      'passed in', function (done) {
      this.timeout(5000);
      let count1 = 0;
      let count2 = 0;
      function stub1() {
        count1++;
      }

      function stub2() {
        count2++;
      }

      repeater.create({
        name: 'Generator_Pause_Resume_1',
        interval: 15,
        func: stub1,
      });

      repeater.create({
        name: 'Generator_Pause_Resume_2',
        interval: 15,
        func: stub2,
      });

      let count1BeforePause;
      let count2BeforePause;
      setTimeout(() => {
        // proves start was called and the task was executed
        expect(count1).to.be.at.least(1);
        expect(count2).to.be.at.least(1);

        count1BeforePause = count1;
        count2BeforePause = count2;

        // pause the repeat
        repeater.pauseGenerators();
      }, 1100);

      setTimeout(() => {
        // proves that the repeat did not run after it was paused
        expect(count1).to.equal(count1BeforePause);
        expect(count2).to.equal(count2BeforePause);

        // resume repeat
        repeater.resumeGenerators();
      }, 1200);

      setTimeout(() => {
        // proves that calling resume, resumes the task
        expect(count1).to.be.above(count1BeforePause);
        expect(count2).to.be.above(count2BeforePause);

        repeater.stopAllRepeaters();
        return done();
      }, 4500);
    });

    it('pauseGenerators should not affect the heartbeat repeat', (done) => {
      let count = 0;
      function stub() {
        count++;
      }

      repeater.create({
        name: 'heartbeat',
        interval: 1,
        func: stub,
      });
      repeater.pauseGenerators();
      setTimeout(() => {
        // proves that pause did not effect the heartbeat repeat
        expect(count).to.be.above(0);

        repeater.stopAllRepeaters();
        return done();
      }, 25);
    });
  });

  describe('validateDefinition >', () => {
    it('OK', (done) => {
      repeater.create({ name: 'Gen', interval: 10, func: () => {} });
      done();
    });

    it('missing func', (done) => {
      try {
        repeater.create({ name: 'Gen', interval: 10 });
        return done('Expecting ValidationError');
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
        return done('Expecting ValidationError');
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
        return done('Expecting ValidationError');
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
        return done('Expecting ValidationError');
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
        return done(new Error('Expecting ValidationError'));
      } catch (err) {
        if (err.name === 'ValidationError') {
          return done();
        }

        return done(err);
      }
    });

    it('wrong typeof interval', (done) => {
      try {
        repeater.create({ name: 'Gen', interval: 'aaa', func: () => {} });
        return done(new Error('Expecting ValidationError'));
      } catch (err) {
        if (err.name === 'ValidationError') {
          return done();
        }

        return done(err);
      }
    });

    it('duplicate name', (done) => {
      const def1 = { name: 'Gen', interval: 10, func: x => x };
      const def2 = { name: 'Gen', interval: 10, func: x => x };

      try {
        repeater.create(def1);
        repeater.create(def2);
        return done(new Error('Expecting ValidationError'));
      } catch (err) {
        if (err.name === 'ValidationError' &&
          err.message === 'Duplicate repeater name violation: Gen') {
          return done();
        }

        return done(err);
      }
    });

    it('pausing a repeat without a name', (done) => {
      try {
        repeater.pause();
        return done('Expecting ResourceNotFoundError');
      } catch (err) {
        expect(err.name).to.equal('ResourceNotFoundError');
        expect(err.message).to.contain('not found');
        return done();
      }
    });

    it('pausing a non existing repeat', (done) => {
      try {
        repeater.pause('Non_Existing_Repeat');
        return done('Expecting ResourceNotFoundError');
      } catch (err) {
        expect(err.name).to.equal('ResourceNotFoundError');
        expect(err.message).to.contain('not found');
        return done();
      }
    });

    it('resuming a repeat without a name', (done) => {
      try {
        repeater.resume();
        return done('Expecting ResourceNotFoundError');
      } catch (err) {
        expect(err.name).to.equal('ResourceNotFoundError');
        expect(err.message).to.contain('not found');
        return done();
      }
    });

    it('resuming a non existing repeat', (done) => {
      try {
        repeater.resume('Non_Existing_Repeat');
        return done('Expecting ResourceNotFoundError');
      } catch (err) {
        expect(err.name).to.equal('ResourceNotFoundError');
        expect(err.message).to.contain('not found');
        return done();
      }
    });
  });
});
