/**
 * Copyright (c) 2018, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or
 * https://opensource.org/licenses/BSD-3-Clause
 */

/**
 * test/repeater/util.js
 */
const repeater = require('../../src/repeater/repeater');
const expect = require('chai').expect;
const sinon = require('sinon');
const ms = require('ms');

let jobTimes;
let startTime;
let clock;
let genNum;

function trackExecution(jobName, time) {
  if (jobTimes) {
    const relativeTime = time - startTime;
    if (!jobTimes[jobName]) jobTimes[jobName] = [];
    jobTimes[jobName].push(relativeTime);
  }
}

function tickSync(ms) {
  const timerResults = [];
  makeTimersSync();
  clock.tick(ms);
  return Promise.all(timerResults);

  function makeTimersSync() {
    if (!clock.timers) return;
    Object.values(clock.timers).forEach((timer) => {
      if (!timer.originalFunc) {
        timer.originalFunc = timer.func;
      }

      timer.func = (...args) => {
        const result = timer.originalFunc.apply(null, args);
        timerResults.push(result);
      };
    });
    return timerResults;
  }
}

module.exports = {
  trackExecutionTimes() {
    startTime = Date.now();
    clock = sinon.useFakeTimers(startTime);
    jobTimes = {};
    genNum = 1;
  },

  clearTracking() {
    clock && clock.restore();
    clock = undefined;
    jobTimes = undefined;
    genNum = undefined;
  },

  waitUntil(minutes) {
    const until = startTime + ms(minutes);
    const toTick = until - Date.now();
    return tickSync(toTick);
  },

  expectCalledAt(jobName, expectedTimes) {
    expectedTimes = expectedTimes && expectedTimes.map(t => ms(t));
    const actualTimes = jobTimes[jobName];
    expect(actualTimes).to.deep.equal(expectedTimes);
  },

  createMockHeartbeatRepeater() {
    const def = {
      name: 'heartbeat',
      interval: ms('15s'),
      func: () => trackExecution('heartbeat', Date.now()),
    };
    repeater.create(def);
  },

  createMockRepeatersWithIntervals(...intervals) {
    intervals.forEach((interval) => {
      const i = genNum;
      genNum++;

      const def = {
        name: `gen${i}`,
        interval: ms(interval),
        func: () => trackExecution(`gen${i}`, Date.now()),
      };

      repeater.create(def);
    });
  },
};

