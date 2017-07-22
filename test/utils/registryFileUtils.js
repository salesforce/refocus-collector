/**
 * Copyright (c) 2017, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or
 * https://opensource.org/licenses/BSD-3-Clause
 */

/**
 * test/utils/regsitryFileUtils.js
 */

const expect = require('chai').expect;
const registryFileUtils = require('../../src/utils/registryFileUtils');
const fs = require('fs');

describe('test/utils/registryFileUtils.js - Registry File >', () => {
  it('create file', (done) => {
    registryFileUtils.createRegistryFile('test.json');
    setTimeout(() => {
      try {
        fs.readFileSync('test.json');
        fs.unlinkSync('test.json');
        done();
      } catch (err) {
        done(err);
      }
    }, 1000);
  });
});

describe('test/utils/registryFileUtils.js - Registry Obj >', () => {
  before(() => {
    registryFileUtils.createRegistryFile('test.json');
  });

  after(() => {
    registryFileUtils.deleteRegistryFile('test.json');
  });

  const reg1 = {
    name: 'reg1',
    url: 'xyz.com',
    token: 'rrrrrehfsufdhksdgvffvgi',
  };

  const reg2 = {
    name: 'reg2',
    url: 'xyz.com',
    token: 'rrrrrehfsufdhksdgvffvgi',
  };

  it('add registry', (done) => {
    registryFileUtils.addRegistry('reg1', reg1, 'test.json');
    ret = registryFileUtils.getRegistry('reg1', 'test.json');
    console.log(ret);
    done();
  });

  it('get registry after adding one more', (done) => {
    registryFileUtils.addRegistry('reg1', reg1, 'test.json');
    registryFileUtils.addRegistry('reg2', reg2, 'test.json');
    ret = registryFileUtils.getRegistry('reg2', 'test.json');
    expect(ret).to.deep.equal(reg2);
    done();
  });

  it('update registry', (done) => {
    updatedReg = {
      name: 'reg1',
      url: 'xyzw.com',
      token: 'rrrrrehfsufdhksdgvffvgi',
    };

    registryFileUtils.addRegistry('reg1', reg1, 'test.json');
    registryFileUtils.updateRegistry('reg1', updatedReg, 'test.json');
    ret = registryFileUtils.getRegistry('reg1', 'test.json');
    expect(ret).to.deep.equal(updatedReg);
    done();
  });

  it('update registry error', (done) => {
    updatedReg = {
      name: 'reg1',
      url: 'xyzw.com',
      token: 'rrrrrehfsufdhksdgvffvgi',
    };

    registryFileUtils.addRegistry('reg1', reg1, 'test.json');
    try {
      registryFileUtils.updateRegistry('reg22', updatedReg, 'test.json');
    } catch (err) {
      expect(err.message).contains('There is no registry entry based on name');
    }

    done();
  });

  it('get registry', (done) => {
    registryFileUtils.addRegistry('reg1', reg1, 'test.json');
    ret = registryFileUtils.getRegistry('reg1', 'test.json');
    expect(ret).to.deep.equal(reg1);
    done();
  });

  it('get registry error', (done) => {
    ret = registryFileUtils.getRegistry('reg12', 'test.json');
    expect(ret.message).contains('There is no registry with name');
    done();
  });

  it('delete registry', (done) => {
    registryFileUtils.addRegistry('reg1', reg1, 'test.json');
    ret = registryFileUtils.getRegistry('reg1', 'test.json');
    expect(ret).to.deep.equal(reg1);

    registryFileUtils.removeRegistry('reg1', 'test.json');
    ret = registryFileUtils.getRegistry('reg12', 'test.json');
    expect(ret.message).contains('There is no registry with name');
    done();
  });

  it('delete registry irrelavent entry', (done) => {
    registryFileUtils.addRegistry('reg1', reg1, 'test.json');
    ret = registryFileUtils.getRegistry('reg1', 'test.json');
    expect(ret).to.deep.equal(reg1);

    try {
      registryFileUtils.removeRegistry('reg13', 'test.json');
    } catch (err) {
      expect(err.message).contains('There is no registry entry based on name');
    }

    done();
  });
});
