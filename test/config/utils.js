/**
 * Copyright (c) 2017, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or
 * https://opensource.org/licenses/BSD-3-Clause
 */

/**
 * test/config/utils.js
 */
const expect = require('chai').expect;
const assert = require('chai').assert;
const configUtils = require('../../src/config/utils');
const errors = require('../../src/errors/errors');
const util = require('util');

describe('test/config/utils.js >', () => {
  it('config object is created after reading registry', (done) => {
    const obj = configUtils.init('./test/config/testRegistry.json');
    expect(obj.registry).to.not.equal(null);
    expect(obj.registry.collectorName1.url).to.equal('http://www.xyz.com');
    expect(obj.registry.collectorName1.token).to.exist;
    done();
  });

  it('error if registry file not present', (done) => {
    const fileLoc = './test/config/NotExist.txt';
    const fn = configUtils.init.bind(configUtils, fileLoc);
    expect(fn).to.throw(new errors.ResourceNotFoundError(
      util.format('File: %s not found', fileLoc)
    ).toString());
    done();
  });

  describe('validateRegistry >', () => {
    it('OK', (done) => {
      try {
        configUtils.validateRegistry({
          a: { token: 'abcdefg', url: 'https://www.google.com' },
        });
        done();
      } catch (err) {
        done(err);
      }
    });

    it('no arg', (done) => {
      try {
        configUtils.validateRegistry();
        done('Expecting ValidationError');
      } catch (err) {
        if (err.name === 'ValidationError') {
          done();
        } else {
          done('Expecting ValidationError here');
        }
      }
    });

    it('array arg', (done) => {
      try {
        configUtils.validateRegistry([1, 2, 3]);
        done('Expecting ValidationError');
      } catch (err) {
        if (err.name === 'ValidationError') {
          done();
        } else {
          done('Expecting ValidationError here');
        }
      }
    });

    it('string arg', (done) => {
      try {
        configUtils.validateRegistry('Hello, World!');
        done('Expecting ValidationError');
      } catch (err) {
        if (err.name === 'ValidationError') {
          done();
        } else {
          done('Expecting ValidationError here');
        }
      }
    });

    it('missing url', (done) => {
      try {
        configUtils.validateRegistry({
          a: { token: 'abcdefg', url: 'https://www.google.com' },
          b: { token: 'abcdefg' },
        });
        done('Expecting ValidationError');
      } catch (err) {
        if (err.name === 'ValidationError') {
          done();
        } else {
          done('Expecting ValidationError here');
        }
      }
    });

    it('missing token', (done) => {
      try {
        configUtils.validateRegistry({
          a: { token: 'abcdefg', url: 'https://www.google.com' },
          b: { url: 'https://www.google.com' },
        });
        done('Expecting ValidationError');
      } catch (err) {
        if (err.name === 'ValidationError') {
          done();
        } else {
          done('Expecting ValidationError here');
        }
      }
    });

    it('missing url AND token', (done) => {
      try {
        configUtils.validateRegistry({
          a: { token: 'abcdefg', url: 'https://www.google.com' },
          b: { x: 'https://www.google.com' },
        });
        done('Expecting ValidationError');
      } catch (err) {
        if (err.name === 'ValidationError') {
          done();
        } else {
          done('Expecting ValidationError here');
        }
      }
    });

    it('case-sensitive attribute name', (done) => {
      try {
        configUtils.validateRegistry({
          a: { Token: 'abcdefg', URL: 'https://www.google.com' },
        });
        done('Expecting ValidationError');
      } catch (err) {
        if (err.name === 'ValidationError') {
          done();
        } else {
          done('Expecting ValidationError here');
        }
      }
    });

    it('url value is null', (done) => {
      try {
        configUtils.validateRegistry({
          a: { token: 'abcdefg', url: null },
          b: { token: 'abcdefg', url: 'https://www.google.com' },
        });
        done('Expecting ValidationError');
      } catch (err) {
        if (err.name === 'ValidationError') {
          done();
        } else {
          done('Expecting ValidationError here');
        }
      }
    });

    it('url value is undefined', (done) => {
      try {
        configUtils.validateRegistry({
          a: { token: 'abcdefg', url: undefined },
          b: { token: 'abcdefg', url: 'https://www.google.com' },
        });
        done('Expecting ValidationError');
      } catch (err) {
        if (err.name === 'ValidationError') {
          done();
        } else {
          done('Expecting ValidationError here');
        }
      }
    });

    it('url value is empty', (done) => {
      try {
        configUtils.validateRegistry({
          a: { token: 'abcdefg', url: '' },
          b: { token: 'abcdefg', url: 'https://www.google.com' },
        });
        done('Expecting ValidationError');
      } catch (err) {
        if (err.name === 'ValidationError') {
          done();
        } else {
          done('Expecting ValidationError here');
        }
      }
    });

    it('url value is an array', (done) => {
      try {
        configUtils.validateRegistry({
          a: { token: 'abcdefg', url: [1, 2, 3] },
          b: { token: 'abcdefg', url: 'https://www.google.com' },
        });
        done('Expecting ValidationError');
      } catch (err) {
        if (err.name === 'ValidationError') {
          done();
        } else {
          done('Expecting ValidationError here');
        }
      }
    });

    it('url value is an object', (done) => {
      try {
        configUtils.validateRegistry({
          a: { token: 'abcdefg', url: { a: 'b' } },
          b: { token: 'abcdefg', url: 'https://www.google.com' },
        });
        done('Expecting ValidationError');
      } catch (err) {
        if (err.name === 'ValidationError') {
          done();
        } else {
          done('Expecting ValidationError here');
        }
      }
    });

    it('url value is in invalid format: 2 dots(.) in url', (done) => {
      try {
        configUtils.validateRegistry({
          a: { token: 'abcdefg', url: 'http://.com.com' },
        });
        done('Expecting ValidationError');
      } catch (err) {
        if (err.name === 'ValidationError') {
          done();
        } else {
          done('Expecting ValidationError here');
        }
      }
    });

    it('url value is in invalid format without top level ' +
      'domain ', (done) => {
      try {
        configUtils.validateRegistry({
          a: { token: 'abcdefg', url: 'invalid url' },
        });
        done('Expecting ValidationError');
      } catch (err) {
        if (err.name === 'ValidationError') {
          done();
        } else {
          done('Expecting ValidationError here');
        }
      }
    });

    it('url value is in invalid format with empty string', (done) => {
      try {
        configUtils.validateRegistry({
          a: { token: 'abcdefg', url: '' },
        });
        done('Expecting ValidationError');
      } catch (err) {
        if (err.name === 'ValidationError') {
          done();
        } else {
          done('Expecting ValidationError here');
        }
      }
    });

    it('token value is null', (done) => {
      try {
        configUtils.validateRegistry({
          a: { token: 'abcdefg', url: 'https://www.google.com' },
          b: { token: null, url: 'https://www.google.com' },
        });
        done('Expecting ValidationError');
      } catch (err) {
        if (err.name === 'ValidationError') {
          done();
        } else {
          done('Expecting ValidationError here');
        }
      }
    });

    it('token value is undefined', (done) => {
      try {
        configUtils.validateRegistry({
          a: { token: 'abcdefg', url: 'https://www.google.com' },
          b: { token: undefined, url: 'https://www.google.com' },
        });
        done('Expecting ValidationError');
      } catch (err) {
        if (err.name === 'ValidationError') {
          done();
        } else {
          done('Expecting ValidationError here');
        }
      }
    });

    it('token value is empty', (done) => {
      try {
        configUtils.validateRegistry({
          a: { token: 'abcdefg', url: 'https://www.google.com' },
          b: { token: '', url: 'https://www.google.com' },
        });
        done('Expecting ValidationError');
      } catch (err) {
        if (err.name === 'ValidationError') {
          done();
        } else {
          done('Expecting ValidationError here');
        }
      }
    });

    it('token value is an array', (done) => {
      try {
        configUtils.validateRegistry({
          a: { token: [1, 2, 3], url: 'https://www.google.com' },
          b: { token: 'abcdefg', url: 'https://www.google.com' },
        });
        done('Expecting ValidationError');
      } catch (err) {
        if (err.name === 'ValidationError') {
          done();
        } else {
          done('Expecting ValidationError here');
        }
      }
    });

    it('token value is an object', (done) => {
      try {
        configUtils.validateRegistry({
          a: { token: { a: 'b' }, url: 'https://www.google.com' },
          b: { token: 'abcdefg', url: 'https://www.google.com' },
        });
        done('Expecting ValidationError');
      } catch (err) {
        if (err.name === 'ValidationError') {
          done();
        } else {
          done('Expecting ValidationError here');
        }
      }
    });
  });
});
