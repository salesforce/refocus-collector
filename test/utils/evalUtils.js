/**
 * Copyright (c) 2017, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or
 * https://opensource.org/licenses/BSD-3-Clause
 */

/**
 * test/utils/evalUtils.js
 */
'use strict';
const expect = require('chai').expect;
const eu = require('../../src/utils/evalUtils');

describe('test/utils/evalUtils.js >', (done) => {
  describe('validateTransformArgs >', (done) => {
    it('object with required set of attributes, bulk', (done) => {
      try {
        eu.validateTransformArgs({
          aspects: [{ name: 'A', timeout: '1m' }],
          ctx: {},
          res: {},
          subjects: [{ absolutePath: 'abc' }],
        });
        done();
      } catch (err) {
        done(err);
      }
    });

    it('object with required set of attributes, by subject', (done) => {
      try {
        eu.validateTransformArgs({
          aspects: [{ name: 'A', timeout: '1m' }],
          ctx: {},
          res: {},
          subject: { absolutePath: 'abc' },
        });
        done();
      } catch (err) {
        done(err);
      }
    });

    it('object with no attributes', (done) => {
      try {
        eu.validateTransformArgs({});
        done('Expecting ArgsError');
      } catch (err) {
        if (err.name === 'ArgsError') {
          done();
        } else {
          done('Expecting ArgsError here');
        }
      }
    });

    it('object with missing or inorrect attributes', (done) => {
      try {
        eu.validateTransformArgs({ ctx: {} });
        done('Expecting ArgsError');
      } catch (err) {
        if (err.name === 'ArgsError') {
          done();
        } else {
          done('Expecting ArgsError here');
        }
      }
    });

    it('empty', (done) => {
      try {
        eu.validateTransformArgs();
        done('Expecting ArgsError');
      } catch (err) {
        if (err.name === 'ArgsError') {
          done();
        } else {
          done('Expecting ArgsError here');
        }
      }
    });

    it('undefined', (done) => {
      try {
        eu.validateTransformArgs(undefined);
        done('Expecting ArgsError');
      } catch (err) {
        if (err.name === 'ArgsError') {
          done();
        } else {
          done('Expecting ArgsError here');
        }
      }
    });

    it('null', (done) => {
      try {
        eu.validateTransformArgs(null);
        done('Expecting ArgsError');
      } catch (err) {
        if (err.name === 'ArgsError') {
          done();
        } else {
          done('Expecting ArgsError here');
        }
      }
    });

    it('number', (done) => {
      try {
        eu.validateTransformArgs(123);
        done('Expecting ArgsError');
      } catch (err) {
        if (err.name === 'ArgsError') {
          done();
        } else {
          done('Expecting ArgsError here');
        }
      }
    });

    it('array', (done) => {
      try {
        eu.validateTransformArgs([1, 2, 3]);
        done('Expecting ArgsError');
      } catch (err) {
        if (err.name === 'ArgsError') {
          done();
        } else {
          done('Expecting ArgsError here');
        }
      }
    });

    it('string', (done) => {
      try {
        eu.validateTransformArgs('abc defgh');
        done('Expecting ArgsError');
      } catch (err) {
        if (err.name === 'ArgsError') {
          done();
        } else {
          done('Expecting ArgsError here');
        }
      }
    });

    it('boolean true', (done) => {
      try {
        eu.validateTransformArgs(true);
        done('Expecting ArgsError');
      } catch (err) {
        if (err.name === 'ArgsError') {
          done();
        } else {
          done('Expecting ArgsError here');
        }
      }
    });

    it('boolean false', (done) => {
      try {
        eu.validateTransformArgs(false);
        done('Expecting ArgsError');
      } catch (err) {
        if (err.name === 'ArgsError') {
          done();
        } else {
          done('Expecting ArgsError here');
        }
      }
    });
  });

  describe('validateToUrlArgs >', (done) => {
    it('object with required set of attributes', (done) => {
      try {
        eu.validateToUrlArgs({
          ctx: {},
          aspects: [{ name: 'A', timeout: '1m' }],
          subjects: [{ absolutePath: 'abc' }],
        });
        done();
      } catch (err) {
        done(err);
      }
    });

    it('object with no attributes', (done) => {
      try {
        eu.validateToUrlArgs({});
        done('Expecting ArgsError');
      } catch (err) {
        if (err.name === 'ArgsError') {
          done();
        } else {
          done('Expecting ArgsError here');
        }
      }
    });

    it('object with missing or inorrect attributes', (done) => {
      try {
        eu.validateToUrlArgs({ ctx: {} });
        done('Expecting ArgsError');
      } catch (err) {
        if (err.name === 'ArgsError') {
          done();
        } else {
          done('Expecting ArgsError here');
        }
      }
    });

    it('empty', (done) => {
      try {
        eu.validateToUrlArgs();
        done('Expecting ArgsError');
      } catch (err) {
        if (err.name === 'ArgsError') {
          done();
        } else {
          done('Expecting ArgsError here');
        }
      }
    });

    it('undefined', (done) => {
      try {
        eu.validateToUrlArgs(undefined);
        done('Expecting ArgsError');
      } catch (err) {
        if (err.name === 'ArgsError') {
          done();
        } else {
          done('Expecting ArgsError here');
        }
      }
    });

    it('null', (done) => {
      try {
        eu.validateToUrlArgs(null);
        done('Expecting ArgsError');
      } catch (err) {
        if (err.name === 'ArgsError') {
          done();
        } else {
          done('Expecting ArgsError here');
        }
      }
    });

    it('number', (done) => {
      try {
        eu.validateToUrlArgs(123);
        done('Expecting ArgsError');
      } catch (err) {
        if (err.name === 'ArgsError') {
          done();
        } else {
          done('Expecting ArgsError here');
        }
      }
    });

    it('array', (done) => {
      try {
        eu.validateToUrlArgs([1, 2, 3]);
        done('Expecting ArgsError');
      } catch (err) {
        if (err.name === 'ArgsError') {
          done();
        } else {
          done('Expecting ArgsError here');
        }
      }
    });

    it('string', (done) => {
      try {
        eu.validateToUrlArgs('abc defgh');
        done('Expecting ArgsError');
      } catch (err) {
        if (err.name === 'ArgsError') {
          done();
        } else {
          done('Expecting ArgsError here');
        }
      }
    });

    it('boolean true', (done) => {
      try {
        eu.validateToUrlArgs(true);
        done('Expecting ArgsError');
      } catch (err) {
        if (err.name === 'ArgsError') {
          done();
        } else {
          done('Expecting ArgsError here');
        }
      }
    });

    it('boolean false', (done) => {
      try {
        eu.validateToUrlArgs(false);
        done('Expecting ArgsError');
      } catch (err) {
        if (err.name === 'ArgsError') {
          done();
        } else {
          done('Expecting ArgsError here');
        }
      }
    });
  });

  describe('safeEval >', (done) => {
    it('ok', (done) => {
      const ctx = {
        abc: 'abcdefghijklmnop',
        n: -5,
      };
      const str = `
        return [abc, n, abc.slice(n)];
      `;
      const res = eu.safeEval(str, ctx);
      expect(res).to.be.array;
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

    it('no setTimeout', (done) => {
      const str = `return setTimeout(() => return 'Hi!', 1);`;
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

    it('no setInterval', (done) => {
      const str = `return setInterval(() => return 'Hi!', 1);`;
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

    it('RegExp ok', (done) => {
      const str = `var myRe = /d(b+)d/g; ` +
        `return myRe.exec('cdbbdbsbz');`;
      try {
        const retval = eu.safeEval(str);
        expect(retval[0]).to.equal('dbbd');
        expect(retval[1]).to.equal('bb');
        done();
      } catch (err) {
        done(err);
      }
    });

    it('JSON.parse ok', (done) => {
      const str = `return JSON.parse('{ "a": 100 }');`;
      try {
        const retval = eu.safeEval(str);
        expect(retval).to.have.property('a', 100);
        done();
      } catch (err) {
        done(err);
      }
    });

    it('JSON.stringify ok', (done) => {
      const str = `return JSON.stringify({ a: 100 });`;
      try {
        const retval = eu.safeEval(str);
        expect(retval).to.equal('{"a":100}');
        done();
      } catch (err) {
        done(err);
      }
    });

    it('Math ok', (done) => {
      const str = `return Math.ceil(9.56);`;
      try {
        const retval = eu.safeEval(str);
        expect(retval).to.equal(10);
        done();
      } catch (err) {
        done(err);
      }
    });

    it('try catch ok - return from try', (done) => {
      const str = 'try { return 10; } ' +
        'catch (err) { return -10; } ' +
        'return 0; ';
      try {
        const retval = eu.safeEval(str);
        expect(retval).to.equal(10);
        done();
      } catch (err) {
        done(err);
      }
    });

    it('try catch ok - return from catch', (done) => {
      const str = 'try { throw new Error("uh oh"); } ' +
        'catch (err) { return -10; } ' +
        'return 0; ';
      try {
        const retval = eu.safeEval(str);
        expect(retval).to.equal(-10);
        done();
      } catch (err) {
        done(err);
      }
    });

    it('try catch ok - throws', (done) => {
      const str = 'try { throw new Error("uh oh"); } ' +
        'catch (err) { throw err; } ' +
        'return 0; ';
      try {
        const retval = eu.safeEval(str);
        done('Expecting error');
      } catch (err) {
        expect(err.name).to.equal('FunctionBodyError');
        done();
      }
    });

    it('String.length ok', (done) => {
      const str = `return 'abcde'.length;`;
      try {
        const retval = eu.safeEval(str);
        expect(retval).to.equal(5);
        done();
      } catch (err) {
        done(err);
      }
    });

    it('define function inside ok', (done) => {
      const str = 'function double(n) { return n*2; } ' +
        'return double(10);';
      try {
        const retval = eu.safeEval(str);
        expect(retval).to.equal(20);
        done();
      } catch (err) {
        done(err);
      }
    });

    it('define fat arrow function inside ok', (done) => {
      const str = 'const double = (n) => n*2; ' +
        'return double(10);';
      try {
        const retval = eu.safeEval(str);
        expect(retval).to.equal(20);
        done();
      } catch (err) {
        done(err);
      }
    });

    it('timeout', (done) => {
      const str = 'let i = 0; while (true) { i++ } return i;';
      try {
        const retval = eu.safeEval(str);
        done('Expecting "Script execution timed out."');
      } catch (err) {
        expect(err).to.have.property('name', 'FunctionBodyError');
        expect(err.message).to.contain('Script execution timed out.');
        done();
      }
    });
  }); // safeEval

  describe('safeTransform >', (done) => {
    const validArgs = {
      ctx: { x: 123, y: 'abc|A2' },
      res: {},
      subjects: [{ absolutePath: 'abc' }],
      aspects: [{ name: 'A1', timeout: '1m' }, { name: 'A2', timeout: '1m' }],
    };

    it('ok, bulk', (done) => {
      try {
        const retval =
          eu.safeTransform('return [{ name: subjects[0].absolutePath + "|A1" },' +
            ' { name: ctx.y }]',
          validArgs);
        expect(retval[0].name).to.equal('abc|A1');
        expect(retval[1].name).to.equal('abc|A2');
        done();
      } catch (err) {
        done(err);
      }
    });

    it('ok, by subject', (done) => {
      validArgs.subject = validArgs.subjects[0];
      delete validArgs.subjects;
      try {
        const retval =
          eu.safeTransform('return [{ name: subject.absolutePath + "|A1" },' +
            ' { name: ctx.y }]',
            validArgs);
        expect(retval[0].name).to.equal('abc|A1');
        expect(retval[1].name).to.equal('abc|A2');
        done();
      } catch (err) {
        done(err);
      }
    });

    it('ok, empty array', (done) => {
      try {
        eu.safeTransform('return []', validArgs);
        done();
      } catch (err) {
        done(err);
      }
    });

    it('returns null instead of array', (done) => {
      try {
        const retval = eu.safeTransform('return null;', validArgs);
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
        eu.safeTransform('return;', validArgs);
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
        eu.safeTransform('return { name: "Foo" };', validArgs);
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
        eu.safeTransform('return "Foo";', validArgs);
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
        eu.safeTransform('return 99;', validArgs);
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
        eu.safeTransform('return false;', validArgs);
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
        eu.safeTransform('return [{ name: "abc|A1" }, 2]', validArgs);
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
        eu.safeTransform('return [{ value: "Foo" }, { name: "Bar" }]',
          validArgs);
        done('Expecting TransformError here');
      } catch (err) {
        if (err.name === 'TransformError') {
          done();
        } else {
          done('Expecting TransformError here');
        }
      }
    });

    it('invalid if function body is an array', (done) => {
      try {
        eu.safeTransform(['return [{ name: "Foo" }, 2]'], validArgs);
        done('Expecting FunctionBodyError here');
      } catch (err) {
        if (err.name === 'FunctionBodyError') {
          done();
        } else {
          console.log(err);
          done('Expecting FunctionBodyError here');
        }
      }
    });

    it('invalid if function body is an object', (done) => {
      try {
        eu.safeTransform({ a: 'return [{ name: "Foo" }, 2]' }, validArgs);
        done('Expecting FunctionBodyError here');
      } catch (err) {
        if (err.name === 'FunctionBodyError') {
          done();
        } else {
          done('Expecting FunctionBodyError here');
        }
      }
    });

    it('invalid if function body is a number', (done) => {
      try {
        eu.safeTransform(123, validArgs);
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

  describe('safeToUrl >', (done) => {
    const validArgs = {
      aspects: [{ name: 'A1', timeout: '1m' }],
      ctx: {},
      subjects: [{ absolutePath: 'abc' }],
    };

    it('ok', (done) => {
      try {
        eu.safeToUrl('return "Hello, World"', validArgs);
        done();
      } catch (err) {
        done(err);
      }
    });

    it('ok, empty string', (done) => {
      try {
        eu.safeToUrl('return ""', validArgs);
        done();
      } catch (err) {
        done(err);
      }
    });

    it('returns null instead of string', (done) => {
      try {
        eu.safeToUrl('return null;', validArgs);
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
        eu.safeToUrl('return;', validArgs);
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
        eu.safeToUrl('return { name: "Foo" };', validArgs);
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
        eu.safeToUrl('return 99;', validArgs);
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
        eu.safeToUrl('return false;', validArgs);
        done('Expecting ToUrlError here');
      } catch (err) {
        if (err.name === 'ToUrlError') {
          done();
        } else {
          done('Expecting ToUrlError here');
        }
      }
    });

    it('invalid if function body is an array', (done) => {
      try {
        eu.safeToUrl(['return false'], validArgs);
        done('Expecting FunctionBodyError here');
      } catch (err) {
        if (err.name === 'FunctionBodyError') {
          done();
        } else {
          console.log(err);
          done('Expecting FunctionBodyError here');
        }
      }
    });

    it('invalid if function body is an object', (done) => {
      try {
        eu.safeToUrl({ a: 'return false;' }, validArgs);
        done('Expecting FunctionBodyError here');
      } catch (err) {
        if (err.name === 'FunctionBodyError') {
          done();
        } else {
          done('Expecting FunctionBodyError here');
        }
      }
    });

    it('invalid if function body is a number', (done) => {
      try {
        eu.safeToUrl(123, validArgs);
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

  describe('validateSamples >', () => {
    it('Samples returned not array', (done) => {
      const sampleArr = { name: 'S1|A1', value: 10 };
      const gen = {
        name: 'mockGenerator',
        subjects: [{ absolutePath: 'S1' }, { absolutePath: 'S2' }],
        aspects: [{ name: 'A1', timeout: '1m' }, { name: 'A2', timeout: '1m' }],
      };
      try {
        eu.validateSamples(sampleArr, gen);
        done('Expecting TransformError');
      } catch (err) {
        expect(err.message).to.be.equal(
          'The transform function must return an array.'
        );
        done();
      }
    });

    it('Sample is not an object', (done) => {
      const sampleArr = ['abcd', 'efgh'];
      const gen = {
        name: 'mockGenerator',
        subjects: [{ absolutePath: 'S1' }, { absolutePath: 'S2' }],
        aspects: [{ name: 'A1', timeout: '1m' }, { name: 'A2', timeout: '1m' }],
      };
      try {
        eu.validateSamples(sampleArr, gen);
        done('Expecting TransformError');
      } catch (err) {
        expect(err.name).to.be.equal('TransformError');
        done();
      }
    });

    it('Sample does not have name', (done) => {
      const sampleArr = [{ abc: 'S1|A1', value: '10' }];
      const gen = {
        name: 'mockGenerator',
        subjects: [{ absolutePath: 'S1' }, { absolutePath: 'S2' }],
        aspects: [{ name: 'A1', timeout: '1m' }, { name: 'A2', timeout: '1m' }],
      };
      try {
        eu.validateSamples(sampleArr, gen);
        done('Expecting TransformError');
      } catch (err) {
        expect(err.name).to.be.equal('TransformError');
        done();
      }
    });

    it('Sample name is not string', (done) => {
      const sampleArr = [{ name: 2, value: 10 }];
      const gen = {
        name: 'mockGenerator',
        subjects: [{ absolutePath: 'S1' }, { absolutePath: 'S2' }],
        aspects: [{ name: 'A1', timeout: '1m' }, { name: 'A2', timeout: '1m' }],
      };
      try {
        eu.validateSamples(sampleArr, gen);
        done('Expecting TransformError');
      } catch (err) {
        expect(err.name).to.be.equal('TransformError');
        done();
      }
    });

    it('More samples than expected, bulk', (done) => {
      const sampleArr = [
        { name: 'S1|A1', value: 10 }, { name: 'S1|A2', value: 2 },
        { name: 'S2|A1', value: 10 }, { name: 'S2|A2', value: 2 },
        { name: 'S2|A1', value: 10 }, { name: 'S2|A2', value: 2 },
      ];
      const gen = {
        name: 'mockGenerator',
        subjects: [{ absolutePath: 'S1' }, { absolutePath: 'S2' }],
        aspects: [{ name: 'A1', timeout: '1m' }, { name: 'A2', timeout: '1m' }],
      };
      try {
        eu.validateSamples(sampleArr, gen);
        done('Expecting ValidationError');
      } catch (err) {
        expect(err.message).to.be.equal('Number of samples more than expected.' +
          ' Samples count: 6, Subjects count: 2, Aspects count: 2');
        done();
      }
    });

    it('More samples than expected, by subject', (done) => {
      const sampleArr = [
        { name: 'S1|A1', value: 10 }, { name: 'S1|A2', value: 2 },
        { name: 'S2|A1', value: 10 },
      ];
      const gen = {
        name: 'mockGenerator',
        subject: { absolutePath: 'S1' },
        aspects: [{ name: 'A1', timeout: '1m' }, { name: 'A2', timeout: '1m' }],
      };
      try {
        eu.validateSamples(sampleArr, gen);
        done('Expecting ValidationError');
      } catch (err) {
        expect(err.message).to.be.equal('Number of samples more than expected.' +
          ' Samples count: 3, Subjects count: 1, Aspects count: 2');
        done();
      }
    });

    it('Unknown aspect in samples', (done) => {
      const sampleArr = [
        { name: 'S1|A1', value: '10' }, { name: 'S1|A2', value: '2' },
        { name: 'S2|A1', value: '10' }, { name: 'S2|A3', value: '2' },
      ];
      const gen = {
        name: 'mockGenerator',
        subjects: [{ absolutePath: 'S1' }, { absolutePath: 'S2' }],
        aspects: [{ name: 'A1', timeout: '1m' }, { name: 'A2', timeout: '1m' }],
      };
      try {
        eu.validateSamples(sampleArr, gen);
        done('Expecting ValidationError');
      } catch (err) {
        expect(err.name).to.be.equal('ValidationError');
        done();
      }
    });

    it('Unknown subject in samples, bulk', (done) => {
      const sampleArr = [
        { name: 'S1|A1', value: '10' }, { name: 'S1|A2', value: '2' },
        { name: 'S2|A1', value: '10' }, { name: 'S3|A2', value: '2' },
      ];
      const gen = {
        name: 'mockGenerator',
        subjects: [{ absolutePath: 'S1' }, { absolutePath: 'S2' }],
        aspects: [{ name: 'A1', timeout: '1m' }, { name: 'A2', timeout: '1m' }],
      };
      try {
        eu.validateSamples(sampleArr, gen);
        done('Expecting ValidationError');
      } catch (err) {
        expect(err.name).to.be.equal('ValidationError');
        done();
      }
    });

    it('Unknown subject in samples, by subject', (done) => {
      const sampleArr = [
        { name: 'S1|A1', value: '10' }, { name: 'S1|A2', value: '2' },
        { name: 'S2|A1', value: '10' },
      ];
      const gen = {
        name: 'mockGenerator',
        subject: { absolutePath: 'S1' },
        aspects: [{ name: 'A1', timeout: '1m' }, { name: 'A2', timeout: '1m' }],
      };
      try {
        eu.validateSamples(sampleArr, gen);
        done('Expecting ValidationError');
      } catch (err) {
        expect(err.name).to.be.equal('ValidationError');
        done();
      }
    });

    it('Duplicate samples in sample array', (done) => {
      const sampleArr = [
        { name: 'S1|A1', value: '10' }, { name: 'S1|A2', value: '2' },
        { name: 'S2|A1', value: '10' }, { name: 'S1|A2', value: '2' },
      ];
      const gen = {
        name: 'mockGenerator',
        subjects: [{ absolutePath: 'S1' }, { absolutePath: 'S2' }],
        aspects: [{ name: 'A1', timeout: '1m' }, { name: 'A2', timeout: '1m' }],
      };
      try {
        eu.validateSamples(sampleArr, gen);
        done('Expecting ValidationError');
      } catch (err) {
        expect(err.message).to.be.equal('Duplicate sample found: s1|a2');
        done();
      }
    });

    it('Invalid sample name without |', (done) => {
      const sampleArr = [
        { name: 'S1|A1', value: '10' }, { name: 'S1|A2', value: '2' },
        { name: 'S2|A1', value: '10' }, { name: 'S1A2', value: '2' },
      ];
      const gen = {
        name: 'mockGenerator',
        subjects: [{ absolutePath: 'S1' }, { absolutePath: 'S2' }],
        aspects: [{ name: 'A1', timeout: '1m' }, { name: 'A2', timeout: '1m' }],
      };
      try {
        eu.validateSamples(sampleArr, gen);
        done('Expecting TransformError');
      } catch (err) {
        expect(err.name).to.be.equal('TransformError');
        done();
      }
    });

    it('OK, bulk', (done) => {
      const sampleArr = [
        { name: 'S1|A1', value: '10' }, { name: 'S1|A2', value: '2' },
        { name: 'S2|A1', value: '10' }, { name: 'S2|A2', value: '2' },
      ];
      const gen = {
        name: 'mockGenerator',
        subjects: [{ absolutePath: 'S1' }, { absolutePath: 'S2' }],
        aspects: [{ name: 'A1', timeout: '1m' }, { name: 'A2', timeout: '1m' }],
      };
      try {
        eu.validateSamples(sampleArr, gen);
        done();
      } catch (err) {
        done(err);
      }
    });

    it('OK, by subject', (done) => {
      const sampleArr = [
        { name: 'S1|A1', value: '10' }, { name: 'S1|A2', value: '2' },
      ];
      const gen = {
        name: 'mockGenerator',
        subject: { absolutePath: 'S1' },
        aspects: [{ name: 'A1', timeout: '1m' }, { name: 'A2', timeout: '1m' }],
      };
      try {
        eu.validateSamples(sampleArr, gen);
        done();
      } catch (err) {
        done(err);
      }
    });
  });

  describe('prepareTransformArgs >', () => {
    const generator = {
      name: 'mockGenerator',
      subjects: [{absolutePath: 'S1'}, {absolutePath: 'S2'}],
      aspects: [{name: 'A1', timeout: '1m'}, {name: 'A2', timeout: '1m'}],
      ctx: {a: 'a', b: 'b',},
      res: { body: 'aaa' },
      generatorTemplate: {
        connection: {
          bulk: true,
        },
      },
    };

    it('bulk', (done) => {
      const args = eu.prepareTransformArgs(generator);
      expect(args).to.have.property('ctx', generator.ctx)
      expect(args).to.have.property('res', generator.res)
      expect(args).to.have.property('aspects', generator.aspects)
      expect(args).to.have.property('subjects', generator.subjects)
      expect(args).to.not.have.property('name');
      expect(args).to.not.have.property('generatorTemplate');
      done();
    });

    it('by subject', (done) => {
      generator.generatorTemplate.connection.bulk = false;
      const args = eu.prepareTransformArgs(generator);
      expect(args).to.have.property('ctx', generator.ctx)
      expect(args).to.have.property('res', generator.res)
      expect(args).to.have.property('aspects', generator.aspects)
      expect(args).to.have.property('subject', generator.subjects[0])
      expect(args).to.not.have.property('name');
      expect(args).to.not.have.property('generatorTemplate');
      done();
    });

  });
});
