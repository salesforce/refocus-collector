/**
 * Copyright (c) 2017, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or
 * https://opensource.org/licenses/BSD-3-Clause
 */

/**
 * test/heartbeat/heartbeat.js
 */
'use strict';

const mock = require('mock-fs');
const expect = require('chai').expect;
const errors = require('../../src/errors');
const configModule = require('../../src/config/config');
configModule.clearConfig();
configModule.setRegistry({ refocusInstances: {} });
let config = configModule.getConfig();
const heartbeat = require('../../src/heartbeat/heartbeat');

const generator1 = {
  name: 'generator1',
  interval: 6000,
  aspects: [{ name: 'A1', timeout: '1m' }],
  generatorTemplate: {
    connection: {
      url: 'http://www.abc.com',
      bulk: true,
    },
  },
};

const generator2 = {
  name: 'generator2',
  interval: 6000,
  aspects: [{ name: 'A2', timeout: '1m' }],
  subjects: [{ absolutePath: 'S1.S2', name: 'S2' }],
  generatorTemplate: {
    connection: {
      url: 'http://www.abc.com',
      bulk: false,
    },
  },
};

const generator3 = {
  name: 'generator3',
  interval: 6000,
  aspects: [{ name: 'A3', timeout: '1m' }],
  subjects: [{ absolutePath: 'S1.S2', name: 'S2' }],
  generatorTemplate: {
    connection: {
      url: 'http://www.abc.com',
      bulk: false,
    },
  },
};

function mockOld(contents) {
  return mock.file({
    content: JSON.stringify(contents),
    mtime: Date.now() - 10000,
  });
}

function mockNew(contents) {
  return mock.file({
    content: JSON.stringify(contents),
    mtime: Date.now(),
  });
}

describe('test/heartbeat/heartbeat.js >', () => {
  const url = 'https://www.example.com';
  const token = 'cCI6IkpXV5ciOiJIUzI1CJ9eyJhbGNiIsInR';
  const refocusInstanceName = 'exampleRefocusInstance';

  before(() => {
    configModule.setRegistry({ refocusInstances: {} });
    config = configModule.getConfig();
  });

  after(() => {
    configModule.clearConfig();
    mock.restore();
  });

  it('buildMockResponse - added', (done) => {
    config.generators = {};

    mock({
      './generators': {
        'generator1.json': mockNew(generator1),
        'generator2.json': mockNew(generator2),
      },
    });

    heartbeat.buildMockResponse('./generators')
    .then((response) => {
      expect(response.generatorsAdded).to.be.an('array').of.length(2);
      expect(response.generatorsUpdated).to.be.an('array').of.length(0);
      expect(response.generatorsDeleted).to.be.an('array').of.length(0);
      expect(response.generatorsAdded[0].name).to.equal('generator1');
      expect(response.generatorsAdded[1].name).to.equal('generator2');
      done();
    });
  });

  it('buildMockResponse - updates', (done) => {
    config.generators[generator1.name] = generator1;
    config.generators[generator2.name] = generator2;

    mock({
      './generators': {
        'generator1.json': mockNew(generator1),
        'generator2.json': mockNew(generator2),
      },
    });

    heartbeat.buildMockResponse('./generators')
    .then((res) => {
      mock({
        './generators': {
          'generator1.json': mockNew(generator1),
          'generator2.json': mockOld(generator2),
        },
      });

      heartbeat.buildMockResponse('./generators')
      .then((response) => {
        expect(response.generatorsAdded).to.be.an('array').of.length(0);
        expect(response.generatorsUpdated).to.be.an('array').of.length(1);
        expect(response.generatorsDeleted).to.be.an('array').of.length(0);
        expect(response.generatorsUpdated[0].name).to.equal('generator1');
        done();
      });
    });
  });

  it('buildMockResponse - deleted', (done) => {
    config.generators[generator1.name] = generator1;
    config.generators[generator2.name] = generator2;

    mock({
      './generators': {
        'generator1.json': mockOld(generator1),
      },
    });

    heartbeat.buildMockResponse('./generators')
    .then((response) => {
      expect(response.generatorsAdded).to.be.an('array').of.length(0);
      expect(response.generatorsUpdated).to.be.an('array').of.length(0);
      expect(response.generatorsDeleted).to.be.an('array').of.length(1);
      expect(response.generatorsDeleted[0].name).to.equal('generator2');
      done();
    });
  });

  it('buildMockResponse - add/update/delete', (done) => {
    config.generators[generator1.name] = generator1;
    config.generators[generator2.name] = generator2;

    mock({
      './generators': {
        'generator1.json': mockNew(generator1),
        'generator3.json': mockNew(generator3),
      },
    });

    heartbeat.buildMockResponse('./generators')
    .then((response) => {
      expect(response.generatorsAdded).to.be.an('array').of.length(1);
      expect(response.generatorsUpdated).to.be.an('array').of.length(1);
      expect(response.generatorsDeleted).to.be.an('array').of.length(1);
      expect(response.generatorsAdded[0].name).to.equal('generator3');
      expect(response.generatorsUpdated[0].name).to.equal('generator1');
      expect(response.generatorsDeleted[0].name).to.equal('generator2');
      done();
    });
  });

  it('buildMockResponse - missing directory (error)', (done) => {
    mock({});

    heartbeat.buildMockResponse('./generators')
    .catch((err) => {
      expect(err.name).to.equal('Error');
      expect(err.code).to.equal('ENOENT');
      done();
    });

  });

  it('buildMockResponse - invalid json (error)', (done) => {
    mock({
      './generators': {
        'generator1.json': mockNew(generator1),
        'generator2.json': '',
      },
    });

    heartbeat.buildMockResponse('./generators')
    .catch((err) => {
      expect(err.name).to.equal('ValidationError');
      expect(err.message).to.equal('Invalid Generator in generator2.json');
      done();
    });
  });

  it('buildMockResponse - invalid json (error)', (done) => {
    mock({
      './generators': {
        'generator1.json': mockNew(generator1),
        'generator2.json': '{} {}',
      },
    });

    heartbeat.buildMockResponse('./generators')
    .catch((err) => {
      expect(err.name).to.equal('ValidationError');
      expect(err.message).to.equal('Invalid Generator in generator2.json');
      done();
    });
  });

  it('buildMockResponse - array (error)', (done) => {
    mock({
      './generators': {
        'generator1.json': mockNew(generator1),
        'generator2.json': '[{}, {}]',
      },
    });

    heartbeat.buildMockResponse('./generators')
    .catch((err) => {
      expect(err.name).to.equal('ValidationError');
      expect(err.message).to.equal('Invalid Generator in generator2.json');
      done();
    });

  });
  it('buildMockResponse - primitive (error)', (done) => {
    mock({
      './generators': {
        'generator1.json': mockNew(generator1),
        'generator2.json': '4',
      },
    });

    heartbeat.buildMockResponse('./generators')
    .catch((err) => {
      expect(err.name).to.equal('ValidationError');
      expect(err.message).to.equal('Invalid Generator in generator2.json');
      done();
    });
  });

  it('buildMockResponse - no name (error)', (done) => {
    mock({
      './generators': {
        'generator1.json': mockNew(generator1),
        'generator2.json': '{prop: "value"}',
      },
    });

    heartbeat.buildMockResponse('./generators')
    .catch((err) => {
      expect(err.name).to.equal('ValidationError');
      expect(err.message).to.equal('Invalid Generator in generator2.json');
      done();
    });
  });

  it('sendHeartbeat - end-to-end', (done) => {
    config.generators = {};
    config.registry[refocusInstanceName] = {
      url: url,
      token: token,
      name: 'Test',
    };

    const regObj = {
      url: url,
      token: token,
      name: 'Test',
    };

    mock({
      './generators': {
        'generator1.json': mockNew(generator1),
        'generator2.json': mockNew(generator2),
      },
    });

    heartbeat.sendHeartbeat(regObj)
    .then((ret) => {
      expect(ret).to.equal(config);
      expect(config.generators.generator1).to.exist;
      expect(config.generators.generator2).to.exist;
      done();
    });
  });

  it('sendHeartbeat - end-to-end (error)', (done) => {
    config.generators = {};
    config.registry.refocusInstances[refocusInstanceName] = {
      url: url,
      token: token,
      name: 'Test',
    };

    const regObj = {
      url: url,
      token: token,
      name: 'Test',
    };

    mock({
      './generators': {
        'generator1.json': mockNew(generator1),
        'generator2.json': mockNew(''),
      },
    });

    heartbeat.sendHeartbeat(regObj)
    .then((ret) => {
      expect(ret).to.be.an.instanceof(errors.ValidationError);
      expect(config.generators.generator2).to.not.exist;
      done();
    });
  });

  it('sendHeartbeat - missing token', (done) => {
    const regObj = {
      url: url,
      token: null,
      name: 'Test',
    };

    try {
      heartbeat.sendHeartbeat(regObj);
    } catch (err) {
      expect(err.name).to.equal('ValidationError');
      done();
    }
  });

  it('sendHeartbeat - url null', (done) => {
    const regObj = {
      url: null,
      token: token,
      name: 'Test',
    };

    try {
      heartbeat.sendHeartbeat(regObj);
    } catch (err) {
      expect(err.name).to.equal('ValidationError');
      done();
    }

  });

  it('sendHeartbeat - missing url', (done) => {
    const regObj = {
      token: token,
      name: 'Test',
    };

    try {
      heartbeat.sendHeartbeat(regObj);
    } catch (err) {
      expect(err.name).to.equal('ValidationError');
      done();
    }
  });

  it('sendHeartbeat - empty refocus instance', (done) => {
    config.registry = { refocusInstances: {} };
    try {
      heartbeat.sendHeartbeat(
        config.registry.refocusInstances[refocusInstanceName]
      );
    } catch (err) {
      expect(err.name).to.equal('ValidationError');
      done();
    }
  });
});
