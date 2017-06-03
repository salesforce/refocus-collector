/**
 * Copyright (c) 2017, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or
 * https://opensource.org/licenses/BSD-3-Clause
 */

/**
 * test/utils/urlUtils.js
 */
const expect = require('chai').expect;
const expand = require('../../src/utils/urlUtils').expand;

describe('test/utils/urlUtils.js >', () => {

  it('expand - 1 variable', (done) => {
    const url = 'http://www.xyz.com?id={{key}}';
    const expandedUrl = 'http://www.xyz.com?id=12345';
    const ctx = {
      key: '12345',
    };

    expect(expand(url, ctx)).to.equal(expandedUrl);
    done();
  });

  it('expand - 2 variables', (done) => {
    const url = 'http://www.xyz.com?id={{key}}&ok={{ok}}';
    const expandedUrl = 'http://www.xyz.com?id=12345&ok=true';
    const ctx = {
      key: '12345',
      ok: 'true',
    };

    expect(expand(url, ctx)).to.equal(expandedUrl);
    done();
  });

  it('expand - 3 variables', (done) => {
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

  it('expand - duplicate variables', (done) => {
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

  it('expand - context missing (error)', (done) => {
    const url = 'http://www.{{domain}}.com?id={{key}}&ok={{ok}}';
    const ctx = {
      key: '12345',
      domain: 'xyz',
    };

    try {
      expand(url, ctx);
    } catch (err) {
      expect(err.name).to.equal('ValidationError');
      done();
    }
  });

  it('expand - context null (error)', (done) => {
    const url = 'http://www.{{domain1}}{{domain2}}.com?id={{key}}&ok={{ok}}';
    const expandedUrl = 'http://www.xyz.com?id=12345&ok=true';
    const ctx = {
      key: '12345',
      ok: 'true',
      domain1: 'xyz',
      domain2: null,
    };

    try {
      expand(url, ctx);
    } catch (err) {
      expect(err.name).to.equal('ValidationError');
      done();
    }
  });

  it('expand - replace with empty string', (done) => {
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

  it('expand - empty match (error)', (done) => {
    const url = 'http://www.do{{}}in.com?id={{key}}&ok={{ok}}';
    const expandedUrl = 'http://www.do{{}}in.com?id=12345&ok=true';
    const ctx = {
      key: '12345',
      ok: 'true',
      '': '---',
    };

    try {
      expand(url, ctx);
    } catch (err) {
      expect(err.name).to.equal('ValidationError');
      done();
    }
  });

  it('expand - space match (error)', (done) => {
    const url = 'http://www.do{{ }}in.com?id={{key}}&ok={{ok}}';
    const expandedUrl = 'http://www.do{{}}in.com?id=12345&ok=true';
    const ctx = {
      key: '12345',
      ok: 'true',
      ' ': '---',
    };

    try {
      expand(url, ctx);
    } catch (err) {
      expect(err.name).to.equal('ValidationError');
      done();
    }
  });

  it('expand - single character match', (done) => {
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

  it('expand - invalid curly braces in url (error)', (done) => {
    const url = 'http://www.{{domain}}.co}}m?id={{key}}&ok={{ok}}';
    const expandedUrl = 'http://www.xyz.co}}m?id=12345&ok=true';
    const ctx = {
      key: '12345',
      ok: 'true',
      domain: 'xyz',
    };

    try {
      expand(url, ctx);
    } catch (err) {
      expect(err.name).to.equal('ValidationError');
      done();
    }
  });

  it('expand - invalid curly braces in url (error)', (done) => {
    const url = 'http://www.{{domain}}}.com?id={{key}}&ok={{ok}}';
    const expandedUrl = 'http://www.xyz}.com?id=12345&ok=true';
    const ctx = {
      key: '12345',
      ok: 'true',
      domain: 'xyz',
    };

    try {
      expand(url, ctx);
    } catch (err) {
      expect(err.name).to.equal('ValidationError');
      done();
    }
  });

  it('expand - invalid curly braces in url (error)', (done) => {
    const url = 'http://www.{{do{{ma}}in}}.com?id={{key}}&ok={{ok}}';
    const expandedUrl = 'http://www.---in}}.com?id=12345&ok=true';
    const ctx = {
      key: '12345',
      ok: 'true',
      'do{{ma': '---',
    };

    try {
      expand(url, ctx);
    } catch (err) {
      expect(err.name).to.equal('ValidationError');
      done();
    }
  });

  it('expand - curly braces in match (error)', (done) => {
    const url = 'http://www.{{do{ma}in}}.com?id={{key}}&ok={{ok}}';
    const expandedUrl = 'http://www.xyz.com?id=12345&ok=true';
    const ctx = {
      key: '12345',
      ok: 'true',
      'do{ma}in': 'xyz',
    };

    try {
      expand(url, ctx);
    } catch (err) {
      expect(err.name).to.equal('ValidationError');
      done();
    }
  });

  it('expand - curly braces in match (error)', (done) => {
    const url = 'http://www.{{do{{ma}}in.com?id={{key}}&ok={{ok}}';
    const expandedUrl = 'http://www.---in.com?id=12345&ok=true';
    const ctx = {
      key: '12345',
      ok: 'true',
      'do{{ma': '---',
    };

    try {
      expand(url, ctx);
    } catch (err) {
      expect(err.name).to.equal('ValidationError');
      done();
    }
  });

  it('expand - curly braces in match (error)', (done) => {
    const url = 'http://www.{{}}do{{}}in.com?id={{key}}&ok={{ok}}';
    const expandedUrl = 'http://www.---in.com?id=12345&ok=true';
    const ctx = {
      key: '12345',
      ok: 'true',
      '}}do{{': '---',
    };

    try {
      expand(url, ctx);
    } catch (err) {
      expect(err.name).to.equal('ValidationError');
      done();
    }
  });

});
