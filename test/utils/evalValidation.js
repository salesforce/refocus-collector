/**
 * Copyright (c) 2017, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or
 * https://opensource.org/licenses/BSD-3-Clause
 */

/**
 * tests/utils/evalValidation.js
 */
'use strict';
const expect = require('chai').expect;
const val = require('../../src/utils/evalValidation');

describe('test/utils/evalValidation >', (done) => {
  describe('isObject >', (done) => {
    it('object with attributes', (done) => {
      try {
        val.isObject('myname', { foo: "bar" });
        done();
      } catch(err) {
        done(err)
      }
    });

    it('object with no attributes', (done) => {
      try {
        val.isObject('myname', {});
        done();
      } catch(err) {
        done(err)
      }
    });

    it('undefined', (done) => {
      try {
        val.isObject('myname', undefined);
        done('Expecting ArgsError');
      } catch(err) {
        if (err.name === 'ArgsError') {
          done();
        } else {
          console.log(err)
          done('Expecting ArgsError here');
        }
      }
    });

    it('null', (done) => {
      try {
        val.isObject('myname', null);
        done('Expecting ArgsError');
      } catch(err) {
        if (err.name === 'ArgsError') {
          done();
        } else {
          done('Expecting ArgsError here');
        }
      }
    });

    it('empty', (done) => {
      try {
        val.isObject('myname');
        done('Expecting ArgsError');
      } catch(err) {
        if (err.name === 'ArgsError') {
          done();
        } else {
          done('Expecting ArgsError here');
        }
      }
    });

    it('boolean true', (done) => {
      try {
        val.isObject('myname', true);
        done('Expecting ArgsError');
      } catch(err) {
        if (err.name === 'ArgsError') {
          done();
        } else {
          done('Expecting ArgsError here');
        }
      }
    });

    it('boolean false', (done) => {
      try {
        val.isObject('myname', false);
        done('Expecting ArgsError');
      } catch(err) {
        if (err.name === 'ArgsError') {
          done();
        } else {
          done('Expecting ArgsError here');
        }
      }
    });

    it('string', (done) => {
      try {
        val.isObject('myname', 'Abcd efghijkl');
        done('Expecting ArgsError');
      } catch(err) {
        if (err.name === 'ArgsError') {
          done();
        } else {
          done('Expecting ArgsError here');
        }
      }
    });

    it('number', (done) => {
      try {
        val.isObject('myname', 1234);
        done('Expecting ArgsError');
      } catch(err) {
        if (err.name === 'ArgsError') {
          done();
        } else {
          done('Expecting ArgsError here');
        }
      }
    });

    it('array', (done) => {
      try {
        val.isObject('myname', [1, 2]);
        done('Expecting ArgsError');
      } catch(err) {
        if (err.name === 'ArgsError') {
          done();
        } else {
          done('Expecting ArgsError here');
        }
      }
    });
  });

  describe('subjects >', (done) => {
    it('both empty', (done) => {
      try {
        val.subjects();
        done('Expecting ArgsError');
      } catch(err) {
        if (err.name === 'ArgsError') {
          done();
        } else {
          done('Expecting ArgsError here');
        }
      }
    });

    it('both null', (done) => {
      try {
        val.subjects(null, null);
        done('Expecting ArgsError');
      } catch(err) {
        if (err.name === 'ArgsError') {
          done();
        } else {
          done('Expecting ArgsError here');
        }
      }
    });

    it('both undefined', (done) => {
      try {
        val.subjects(undefined, undefined);
        done('Expecting ArgsError');
      } catch(err) {
        if (err.name === 'ArgsError') {
          done();
        } else {
          done('Expecting ArgsError here');
        }
      }
    });

    it('both provided', (done) => {
      try {
        val.subjects({ absolutePath: 'a' }, []);
        done('Expecting ArgsError');
      } catch(err) {
        if (err.name === 'ArgsError') {
          done();
        } else {
          done('Expecting ArgsError here');
        }
      }
    });

    it('subject is boolean true', (done) => {
      try {
        val.subjects(true);
        done('Expecting ArgsError');
      } catch(err) {
        if (err.name === 'ArgsError') {
          done();
        } else {
          done('Expecting ArgsError here');
        }
      }
    });

    it('subject is boolean false');

    it('subject is string', (done) => {
      try {
        val.subjects('abcd efgh');
        done('Expecting ArgsError');
      } catch(err) {
        if (err.name === 'ArgsError') {
          done();
        } else {
          done('Expecting ArgsError here');
        }
      }
    });

    it('subject is number', (done) => {
      try {
        val.subjects(99);
        done('Expecting ArgsError');
      } catch(err) {
        if (err.name === 'ArgsError') {
          done();
        } else {
          done('Expecting ArgsError here');
        }
      }
    });

    it('subject is array', (done) => {
      try {
        val.subjects([1, 2], []);
        done('Expecting ArgsError');
      } catch(err) {
        if (err.name === 'ArgsError') {
          done();
        } else {
          done('Expecting ArgsError here');
        }
      }
    });

    it('subjects is boolean false');

    it('subjects is boolean true', (done) => {
      try {
        val.subjects(null, true);
        done('Expecting ArgsError');
      } catch(err) {
        if (err.name === 'ArgsError') {
          done();
        } else {
          done('Expecting ArgsError here');
        }
      }
    });

    it('subjects is string');
    it('subjects is number');
    it('subjects is object (not array)');
    it('subjects is empty array');
    it('subjects is array with non-subject element');
    it('subjects is array with only subject elements');
  });
});