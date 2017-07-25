/**
 * Copyright (c) 2017, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or
 * https://opensource.org/licenses/BSD-3-Clause
 */

/**
 * test/remoteCollection/urlUtils.js
 */
const expect = require('chai').expect;
const expand = require('../../src/remoteCollection/urlUtils').expand;

describe('test/remoteCollection/urlUtils.js >', () => {
  describe(' expand >', () => {
    it('No expansion needed', (done) => {
      const url = 'http://www.xyz.com';
      const expandedUrl = 'http://www.xyz.com';
      const ctx = {
        key: '12345',
        ok: 'true',
      };

      expect(expand(url, ctx)).to.equal(expandedUrl);
      done();
    });

    it('1 variable', (done) => {
      const url = 'http://www.xyz.com?id={{key}}';
      const expandedUrl = 'http://www.xyz.com?id=12345';
      const ctx = {
        key: '12345',
      };

      expect(expand(url, ctx)).to.equal(expandedUrl);
      done();
    });

    it('2 variables', (done) => {
      const url = 'http://www.xyz.com?id={{key}}&ok={{ok}}';
      const expandedUrl = 'http://www.xyz.com?id=12345&ok=true';
      const ctx = {
        key: '12345',
        ok: 'true',
      };

      expect(expand(url, ctx)).to.equal(expandedUrl);
      done();
    });

    it('3 variables', (done) => {
      const url = 'http://www.{{domain}}.com?id={{key}}&ok={{ok}}';
      const expandedUrl = 'http://www.xyz.com?id=12345&ok=true';
      const ctx = {
        key: '12345',
        ok: 'true',
        domain: 'xyz',
      };

      expect(expand(url, ctx)).to.equal(expandedUrl);
      done();
    });

    it('duplicate variables', (done) => {
      const url = 'http://www.{{domain}}.com?id={{key}}&ok={{key}}';
      const expandedUrl = 'http://www.xyz.com?id=12345&ok=12345';
      const ctx = {
        key: '12345',
        ok: 'true',
        domain: 'xyz',
      };

      expect(expand(url, ctx)).to.equal(expandedUrl);
      done();
    });

    it('context missing treats as empty', (done) => {
      const url = 'http://www.{{domain}}.com?id={{key}}&ok={{ok}}';
      const ctx = {
        key: '12345',
        ok: 'yes',
      };

      expect(expand(url, ctx)).to.equal('http://www..com?id=12345&ok=yes');
      done();
    });

    it('context null ok', (done) => {
      const url = 'http://www.{{domain1}}{{domain2}}.com?id={{key}}&ok={{ok}}';
      const expandedUrl = 'http://www.xyz.com?id=12345&ok=true';
      const ctx = {
        key: '12345',
        ok: 'true',
        domain1: 'xyz',
        domain2: null,
      };
      expect(expand(url, ctx)).to.equal(expandedUrl);
      done();
    });

    it('replace with empty string', (done) => {
      const url = 'http://www.{{domain1}}{{domain2}}.com?id={{key}}&ok={{ok}}';
      const expandedUrl = 'http://www.xyz.com?id=12345&ok=true';
      const ctx = {
        key: '12345',
        ok: 'true',
        domain1: 'xyz',
        domain2: '',
      };

      expect(expand(url, ctx)).to.equal(expandedUrl);
      done();
    });

    it('missing context attribute name? error', (done) => {
      const url = 'http://www.do{{}}in.com?id={{key}}&ok={{ok}}';
      const expandedUrl = 'http://www.do---in.com?id=12345&ok=true';
      const ctx = {
        key: '12345',
        ok: 'true',
        '': '---',
      };

      try {
        expand(url, ctx);
        done('expecting error');
      } catch (err) {
        expect(err.name).to.equal('TemplateVariableSubstitutionError');
        done();
      }
    });

    it('space match ok', (done) => {
      const url = 'http://www.do{{ }}in.com?id={{key}}&ok={{ok}}';
      const expandedUrl = 'http://www.do---in.com?id=12345&ok=true';
      const ctx = {
        key: '12345',
        ok: 'true',
        ' ': '---',
      };
      expect(expand(url, ctx)).to.equal(expandedUrl);
      done();
    });

    it('single character match', (done) => {
      const url = 'http://www.do{{m}}in.com?id={{key}}&ok={{ok}}';
      const expandedUrl = 'http://www.do---in.com?id=12345&ok=true';
      const ctx = {
        key: '12345',
        ok: 'true',
        m: '---',
      };

      expect(expand(url, ctx)).to.equal(expandedUrl);
      done();
    });

    it('unmatched curly brace in template OK', (done) => {
      const url = 'http://www.{{domain}}}.com?id={{key}}&ok={{ok}}';
      const expandedUrl = 'http://www.xyz}.com?id=12345&ok=true';
      const ctx = {
        key: '12345',
        ok: 'true',
        domain: 'xyz',
      };
      expect(expand(url, ctx)).to.equal(expandedUrl);
      done();
    });

    it('single curly braces inside context attribute name ignored', (done) => {
      const url = 'http://www.{{do{ma}in}}.com?id={{key}}&ok={{ok}}';
      const expandedUrl = 'http://www.{{do{ma}in}}.com?id=12345&ok=true';
      const ctx = {
        key: '12345',
        ok: 'true',
        'do{ma}in': 'xyz',
      };
      expect(expand(url, ctx)).to.equal(expandedUrl);
      done();
    });

    it('unmatched curly braces inside context attribute name name ok',
    (done) => {
      const url = 'http://www.{{do{{ma}}in.com?id={{key}}&ok={{ok}}';
      const expandedUrl = 'http://www.---in.com?id=12345&ok=true';
      const ctx = {
        key: '12345',
        ok: 'true',
        'do{{ma': '---',
      };
      expect(expand(url, ctx)).to.equal(expandedUrl);
      done();
    });

    it('weird curly braces in match (error)', (done) => {
      const url = 'http://www.{{}}do{{}}in.com?id={{key}}&ok={{ok}}';
      const expandedUrl = 'http://www.---in.com?id=12345&ok=true';
      const ctx = {
        key: '12345',
        ok: 'true',
        '}}do{{': '---',
      };

      try {
        expand(url, ctx);
        done('Expecting err');
      } catch (err) {
        expect(err.name).to.equal('TemplateVariableSubstitutionError');
        done();
      }
    });
  });
});
