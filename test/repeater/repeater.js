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
const MILLIS = 1000;
logger.configure({ level: 0 });

describe('test/repeater/repeater.js >', () => {
  after(() => repeater.stopAllRepeaters());

  describe('createGeneratorRepeater >', () => {
    const dummyFunc = (x) => x;
    const dummyOnProgress = (x) => x;

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
        subjects: [{ absolutePath: 'oneSubject', name: 'OneSubject' }],
      };
      const ret = repeater.createGeneratorRepeater(def, dummyFunc,
        dummyOnProgress);
      expect(ret.handle).to.not.equal(undefined);
      expect(ret.interval).to.equal(MILLIS * def.intervalSecs);
      expect(ret.name).to.equal('Generator0');
      expect(ret.funcName).to.equal('func');
      expect(tracker.Generator0).to.equal(ret.handle);
      done();
    });

    it('should set onProgress callback to handleCollectResponse', (done) => {
      const def = {
        name: 'Generator0.1',
        intervalSecs: 6,
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
        subjects: [{ absolutePath: 'oneSubject', name: 'OneSubject' }],
      };
      const ret = repeater.createGeneratorRepeater(def, dummyFunc,
        dummyOnProgress);
      expect(ret.handle).to.not.equal(undefined);
      expect(ret.interval).to.equal(MILLIS * def.intervalSecs);
      expect(ret.name).to.equal('Generator0.1');
      expect(ret.funcName).to.equal('func');
      expect(ret.onProgress.name).to.equal('dummyOnProgress');
      expect(tracker['Generator0.1']).to.equal(ret.handle);
      done();
    });

    it('handleCollectResponse onProgress callback should be called when a ' +
    'generator repeater is created', (done) => {
      const def = {
        name: 'Generator0.11',
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
        subjects: [{ absolutePath: 'oneSubject', name: 'OneSubject' }],
      };
      const ret = repeater.createGeneratorRepeater(def, dummyFunc,
        dummyOnProgress);
      setTimeout(() => {
        expect(ret.handle).to.not.equal(undefined);
        expect(ret.interval).to.equal(MILLIS * def.intervalSecs);
        expect(ret.name).to.equal('Generator0.11');
        expect(ret.funcName).to.equal('func');
        expect(tracker['Generator0.11']).to.equal(ret.handle);
        return done();
      }, 20);
    });

    it('stopping and creating the repeat should set the onProgress callback ' +
    'to handleCollectResponse', (done) => {
      const obj = {
        name: 'Generator0.2',
        intervalSecs: 6,
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
        subjects: [{ absolutePath: 'oneSubject', name: 'OneSubject' }],
      };
      repeater.createGeneratorRepeater(obj, dummyFunc, dummyOnProgress);
      obj.name = 'Generator0.2';
      obj.intervalSecs = 60;
      repeater.stop(obj.name);
      const ret = repeater.createGeneratorRepeater(obj, dummyFunc,
        dummyOnProgress);
      expect(ret.handle).to.not.equal(undefined);
      expect(ret).to.have.property('interval', MILLIS * obj.intervalSecs);
      expect(ret).to.have.property('name', 'Generator0.2');
      expect(ret).to.have.property('funcName', 'func');
      expect(ret.onProgress).to.have.property('name', 'dummyOnProgress');
      expect(tracker['Generator0.2']).to.equal(ret.handle);
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
      expect(ret.handle).to.not.equal(undefined);
      expect(ret.interval).to.equal(def.interval);
      expect(ret.name).to.equal('Generator2');
      expect(ret.funcName).to.equal('taskStub');
      expect(tracker.Generator2).to.equal(ret.handle);
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
        expect(ret.handle).to.not.equal(undefined);
        expect(ret.interval).to.equal(def.interval);
        expect(ret.name).to.equal('Generator3');
        expect(ret.funcName).to.equal('stub');
        expect(tracker.Generator3).to.equal(ret.handle);
        return done();
      }, 100);
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

    it('onProgress should work when task fn resolves promise', (done) => {
      const obj = { value: 'OK' };
      function taskFunc() {
        return Promise.resolve(obj);
      }

      function onProgress(ret) {
        ret.then((c) => {
          c.value = 'Good';
        });
      }

      const def = {
        name: 'testRepeatProgressWithPromiseResolve',
        interval: 10,
        func: taskFunc,
        onProgress,
      };
      repeater.create(def);
      setTimeout(() => {
        expect(obj.value).to.equal('Good');
        return done();
      }, 100);
    });

    it('onProgress should work when task fn rejects promise', (done) => {
      const obj = { value: 'OK' };
      function taskFunc() {
        return Promise.reject(obj);
      }

      function onProgress(ret) {
        ret.then((c) => {
          c.value = 'Good';
        })
        .catch((err) => {
          err.value = 'Bad';
        });
      }

      const def = {
        name: 'testRepeatProgressWithPromiseReject',
        interval: 10,
        func: taskFunc,
        onProgress,
      };
      repeater.create(def);
      setTimeout(() => {
        expect(obj.value).to.equal('Bad');
        return done();
      }, 100);
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
      }, 100);
      setTimeout(() => {
        /*
         * It can take a few milliseconds for the repeat to stop so there is a
         * difference of 1 or 2 between the old and the new count.
         */
        expect(currentCount - oldCount).to.be.within(1, 2);
        return done();
      }, 500);
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

      const def = {
        name: 'Generator5',
        interval: 1,
        func: stub,
      };

      repeater.create(def);
      setTimeout(() => {
        expect(count).to.be.at.least(1); // proves repeater ran

        // repeater updated
        def.interval = 100000;
        def.func = stubNew;
        repeater.stop(def.name);
        const ret = repeater.create(def);
        expect(ret.handle).to.not.equal(undefined);
        expect(ret.interval).to.equal(def.interval);
        expect(ret.name).to.equal('Generator5');
        expect(ret.funcName).to.equal('stubNew');
        expect(tracker.Generator5).to.equal(ret.handle);
      }, 100);
      setTimeout(() => {
        expect(newCount).to.equal(1); // proves repeat was updated
        return done();
      }, 500);
    });

    it('noop if repeater being stopped is not in the tracker', (done) => {
      const obj = {
        name: 'someRandomName',
        interval: 10,
      };

      try {
        repeater.stop(obj);
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
      expect(repeater.paused).to.have.property('size', 0);
      repeater.resumeGenerators();
      expect(repeater.paused).to.have.property('size', 0);
      done();
    });

    it('pause and resume should pause and resume the task function ' +
      'passed in', (done) => {
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
      }, 30);

      setTimeout(() => {
        // proves that the repeat did not run after it was paused
        expect(count1).to.equal(count1BeforePause);
        expect(count2).to.equal(count2BeforePause);

        // resume repeat
        repeater.resumeGenerators();
      }, 60);

      setTimeout(() => {
        // proves that calling resume, resumes the task
        expect(count1).to.be.above(count1BeforePause);
        expect(count2).to.be.above(count2BeforePause);

        repeater.stopAllRepeaters();
        return done();
      }, 90);
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
        repeater.create({ name: 'Gen', interval: '10', func: () => {} });
        return done(new Error('Expecting ValidationError'));
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

    it('null subjects', (done) => {
      try {
        const def =
          { name: 'Gen', interval: 10, func: () => {}, subjects: null };
        repeater.create(def);
        return done('Expecting ValidationError');
      } catch (err) {
        if (err.name === 'ValidationError' &&
        err.message === '"subjects" is not allowed') {
          return done();
        }

        return done(err);
      }
    });
  });
});
