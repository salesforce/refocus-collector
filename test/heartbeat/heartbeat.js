/**
 * Copyright (c) 2017, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or
 * https://opensource.org/licenses/BSD-3-Clause
 */

/**
 * tests/heartbeat/heartbeat.js
 */
'use strict';
require('../../src/config/config').setRegistry({});
const mock = require('mock-fs');
const config = require('../../src/config/config').getConfig();
const expect = require('chai').expect;
const errors = require('../../src/errors/errors');
const heartbeat = require('../../src/heartbeat/heartbeat');
const sendHeartbeat = heartbeat.sendHeartbeat;

const generator1 = {
  name: 'generator1',
  interval: 6000,
};

const generator2 = {
  name: 'generator2',
  interval: 6000,
};

const generator3 = {
  name: 'generator3',
  interval: 6000,
};

after(() => {
  mock.restore();
});

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
  const collectorName = 'exampleCollector';

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
    config.registry[collectorName] = {
      url: url,
      token: token,
    };

    mock({
      './generators': {
        'generator1.json': mockNew(generator1),
        'generator2.json': mockNew(generator2),
      },
    });

    sendHeartbeat()
    .then((ret) => {
      expect(ret).to.equal(config);
      expect(config.generators.generator1).to.exist;
      expect(config.generators.generator2).to.exist;
      done();
    });
  });

  it('sendHeartbeat - end-to-end (error)', (done) => {
    config.generators = {};
    config.registry[collectorName] = {
      url: url,
      token: token,
    };

    mock({
      './generators': {
        'generator1.json': mockNew(generator1),
        'generator2.json': mockNew(''),
      },
    });

    sendHeartbeat()
    .then((ret) => {
      expect(ret).to.be.an.instanceof(errors.ValidationError);
      expect(config.generators.generator1).to.not.exist;
      expect(config.generators.generator2).to.not.exist;
      done();
    });
  });

  //it('sendHeartbeat', (done) => {
  //  config.generators = {};
  //  config.registry[collectorName] = {
  //    url: url,
  //    token: token,
  //  };
  //
  //  mock({
  //    './generators': {},
  //  });
  //
  //  const request = sendHeartbeat();
  //  expect(request).to.exist;
  //  expect(request.method).to.equal('POST');
  //  expect(request.url).to.equal(`${url}/v1/collectors/${collectorName}/heartbeat`);
  //  expect(request.header.Authorization).to.equal(token);
  //  expect(request._data).to.deep.equal({ logLines: [] });
  //  done();
  //});

  it('sendHeartbeat - missing token', (done) => {
    config.registry[collectorName] = {
      url: url,
      token: null,
    };

    try {
      sendHeartbeat();
    } catch (err) {
      expect(err.name).to.equal('ValidationError');
      done();
    }
  });

  it('sendHeartbeat - missing url', (done) => {
    config.registry[collectorName] = {
      url: null,
      token: token,
    };

    try {
      sendHeartbeat();
    } catch (err) {
      expect(err.name).to.equal('ValidationError');
      done();
    }
  });

  it('sendHeartbeat - missing url', (done) => {
    config.registry[collectorName] = {
      token: token,
    };

    try {
      sendHeartbeat();
    } catch (err) {
      expect(err.name).to.equal('ValidationError');
      done();
    }
  });

  it('sendHeartbeat - empty registry', (done) => {
    config.registry = {};
    try {
      sendHeartbeat();
    } catch (err) {
      expect(err.name).to.equal('ValidationError');
      done();
    }
  });

  it('sendHeartbeat - missing registry', (done) => {
    delete config.registry;
    try {
      sendHeartbeat();
    } catch (err) {
      expect(err.name).to.equal('ValidationError');
      done();
    }
  });

});
