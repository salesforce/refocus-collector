/**
 * Copyright (c) 2017, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or
 * https://opensource.org/licenses/BSD-3-Clause
 */

/**
 * tests/utils/evalUtils.js
 */
'use strict';
const expect = require('chai').expect;
const eu = require('../../src/utils/evalUtils');

describe('test/utils/evalUtils >', (done) => {
  describe('safeEval >', (done) => {
    it('ok', (done) => {
      const ctx = {
        abc: 'abcdefghijklmnop',
        n: -5,
      };
      const str = `
        return [ctx.abc, ctx.n, ctx.abc.slice(ctx.n)];
      `;
      const res = eu.safeEval(str, ctx);
      expect(res).to.be.array
      expect(res).to.have.length(3);
      expect(res[0]).to.equal(ctx.abc);
      expect(res[1]).to.equal(ctx.n);
      expect(res[2]).to.equal(ctx.abc.slice(ctx.n));
      done();
    });

    it('no require', (done) => {
      const ctx = {
        abc: 'abcdefghijklmnop',
        n: -5,
      };
      const str = `
        const fs = require('fs');
        const arr = fs.readdirSync('../');
        return arr;
      `;
      try {
        eu.safeEval(str, ctx);
        done('Expecting FunctionBodyError here');
      } catch (err) {
        if (err.name === 'FunctionBodyError') {
          done();
        } else {
          done('Expecting FunctionBodyError here');
        }
      }
    });

    it('no module.require', (done) => {
      const ctx = {
        abc: 'abcdefghijklmnop',
        n: -5,
      };
      const str = `
        const fs = module.require('fs');
        const arr = fs.readdirSync('../');
        return arr;
      `;
      try {
        eu.safeEval(str, ctx);
        done('Expecting FunctionBodyError here');
      } catch (err) {
        if (err.name === 'FunctionBodyError') {
          done();
        } else {
          done('Expecting FunctionBodyError here');
        }
      }
    });

    it('no console.log', (done) => {
      const str = `console.log('Hello, World!');`;
      try {
        eu.safeEval(str);
        done('Expecting FunctionBodyError here');
      } catch (err) {
        if (err.name === 'FunctionBodyError') {
          done();
        } else {
          done('Expecting FunctionBodyError here');
        }
      } 
    });

    it('no eval', (done) => {
      const str = `eval('3+3')`;
      try {
        eu.safeEval(str);
        done('Expecting FunctionBodyError here');
      } catch (err) {
        if (err.name === 'FunctionBodyError') {
          done();
        } else {
          done('Expecting FunctionBodyError here');
        }
      } 
    });

    it('no access to "process"', (done) => {
      const str = `return process.env`;
      try {
        const retval = eu.safeEval(str);
        done('Expecting FunctionBodyError here');
      } catch (err) {
        if (err.name === 'FunctionBodyError') {
          done();
        } else {
          done('Expecting FunctionBodyError here');
        }
      } 
    });
  });

  describe('safeTransform >', (done) => {
    it('ok', (done) => {
      try {
        eu.safeTransform('return [{ name: "Foo" }, { name: "Bar" }]');
        done();
      } catch (err) {
        done(err);
      }
    });

    it('ok, empty array', (done) => {
      try {
        eu.safeTransform('return []');
        done();
      } catch (err) {
        done(err);
      }
    });

    it('returns null instead of array', (done) => {
      try {
        const retval = eu.safeTransform('return null;');
        done('Expecting TransformError here');
      } catch (err) {
        if (err.name === 'TransformError') {
          done();
        } else {
          done('Expecting TransformError here');
        }
      }
    });

    it('returns undefined instead of array', (done) => {
      try {
        eu.safeTransform('return;');
        done('Expecting TransformError here');
      } catch (err) {
        if (err.name === 'TransformError') {
          done();
        } else {
          done('Expecting TransformError here');
        }
      }
    });

    it('returns object instead of array', (done) => {
      try {
        eu.safeTransform('return { name: "Foo" };');
        done('Expecting TransformError here');
      } catch (err) {
        if (err.name === 'TransformError') {
          done();
        } else {
          done('Expecting TransformError here');
        }
      }
    });

    it('returns string instead of array', (done) => {
      try {
        eu.safeTransform('return "Foo";');
        done('Expecting TransformError here');
      } catch (err) {
        if (err.name === 'TransformError') {
          done();
        } else {
          done('Expecting TransformError here');
        }
      }
    });

    it('returns number instead of array', (done) => {
      try {
        eu.safeTransform('return 99;');
        done('Expecting TransformError here');
      } catch (err) {
        if (err.name === 'TransformError') {
          done();
        } else {
          done('Expecting TransformError here');
        }
      }
    });

    it('returns boolean instead of array', (done) => {
      try {
        eu.safeTransform('return false;');
        done('Expecting TransformError here');
      } catch (err) {
        if (err.name === 'TransformError') {
          done();
        } else {
          done('Expecting TransformError here');
        }
      }
    });

    it('returns array with at least one element which is not an object',
    (done) => {
      try {
        eu.safeTransform('return [{ name: "Foo" }, 2]');
        done('Expecting TransformError here');
      } catch (err) {
        if (err.name === 'TransformError') {
          done();
        } else {
          done('Expecting TransformError here');
        }
      }
    });

    it('returns array with at least one object element which does not have ' +
    'a "name" attribute', (done) => {
      try {
        eu.safeTransform('return [{ value: "Foo" }, { name: "Bar" }]');
        done('Expecting TransformError here');
      } catch (err) {
        if (err.name === 'TransformError') {
          done();
        } else {
          done('Expecting TransformError here');
        }
      }
    });
  });

  describe('safeToUrl >', (done) => {
    it('ok', (done) => {
      try {
        eu.safeToUrl('return "Hello, World"');
        done();
      } catch (err) {
        done(err);
      }
    });

    it('ok, empty string', (done) => {
      try {
        eu.safeToUrl('return ""');
        done();
      } catch (err) {
        done(err);
      }
    });

    it('returns null instead of string', (done) => {
      try {
        eu.safeToUrl('return null;');
        done('Expecting ToUrlError here');
      } catch (err) {
        if (err.name === 'ToUrlError') {
          done();
        } else {
          done('Expecting ToUrlError here');
        }
      }
    });

    it('returns undefined instead of string', (done) => {
      try {
        eu.safeToUrl('return;');
        done('Expecting ToUrlError here');
      } catch (err) {
        if (err.name === 'ToUrlError') {
          done();
        } else {
          done('Expecting ToUrlError here');
        }
      }
    });

    it('returns object instead of string', (done) => {
      try {
        eu.safeToUrl('return { name: "Foo" };');
        done('Expecting ToUrlError here');
      } catch (err) {
        if (err.name === 'ToUrlError') {
          done();
        } else {
          done('Expecting ToUrlError here');
        }
      }
    });

    it('returns number instead of string', (done) => {
      try {
        eu.safeToUrl('return 99;');
        done('Expecting ToUrlError here');
      } catch (err) {
        if (err.name === 'ToUrlError') {
          done();
        } else {
          done('Expecting ToUrlError here');
        }
      }
    });

    it('returns boolean instead of string', (done) => {
      try {
        eu.safeToUrl('return false;');
        done('Expecting ToUrlError here');
      } catch (err) {
        if (err.name === 'ToUrlError') {
          done();
        } else {
          done('Expecting ToUrlError here');
        }
      }
    });
  });
});
