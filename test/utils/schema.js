/**
 * Copyright (c) 2017, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or
 * https://opensource.org/licenses/BSD-3-Clause
 */

/**
 * test/utils/schema.js
 */
const expect = require('chai').expect;
const schema = require('../../src/utils/schema');

describe('test/utils/schema.js >', () => {
  describe('repeater >', () => {
    const v = schema.repeater;

    it('ok', (done) => {
      expect(() => v.validate({
        name: 'MyRepeater',
        interval: 1000,
        func: () => 1,
      })).to.not.throw();
      done();
    });

    it('missing required field', (done) => {
      expect(v.validate('abc')).to.have.property('error')
      .to.have.property('name', 'ValidationError');
      done();
    });

    it('interval not integer', (done) => {
      expect(v.validate({
        name: 'MyRepeater',
        interval: 1.2,
        func: () => 1,
      })).to.have.property('error')
      .to.have.property('name', 'ValidationError');
      done();
    });

    it('interval negative integer', (done) => {
      expect(v.validate({
        name: 'MyRepeater',
        interval: -111,
        func: () => 1,
      })).to.have.property('error')
      .to.have.property('name', 'ValidationError');
      done();
    });

    it('func not a function', (done) => {
      expect(v.validate({
        name: 'MyRepeater',
        interval: 1,
        func: undefined,
      })).to.have.property('error')
      .to.have.property('name', 'ValidationError');
      done();
    });
  }); // repeater

  describe('sample >', () => {
    const v = schema.sample;

    it('ok', (done) => {
      const sample = { name: 'sample1|aspName', value: '0' };
      expect(() => v.validate(sample)).to.not.throw();
      done();
    });

    it('sample not object', (done) => {
      const sample = 'abc';
      const val = schema.sample.validate(sample);
      expect(val).to.have.property('error')
      .to.have.property('name', 'ValidationError');
      done();
    });

    it('sample an array', (done) => {
      const sample = ['abc'];
      const val = schema.sample.validate(sample);
      expect(val).to.have.property('error')
      .to.have.property('name', 'ValidationError');
      done();
    });

    it('sample does not have name property', (done) => {
      const sample = { abc: 'sample1|aspName' };
      const val = schema.sample.validate(sample);
      expect(val).to.have.property('error')
      .to.have.property('name', 'ValidationError');
      done();
    });

    it('sample name too small', (done) => {
      const sample = { name: 's|' };
      const val = schema.sample.validate(sample);
      expect(val).to.have.property('error')
      .to.have.property('name', 'ValidationError');
      done();
    });

    it('sample name no |', (done) => {
      const sample = { name: 'sn' };
      const val = schema.sample.validate(sample);
      expect(val).to.have.property('error')
      .to.have.property('name', 'ValidationError');
      done();
    });
  }); // sample
});
