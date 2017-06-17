/**
 * Copyright (c) 2017, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or
 * https://opensource.org/licenses/BSD-3-Clause
 */

/**
 * test/remoteCollection/collect.js
 */
const expect = require('chai').expect;
const nock = require('nock');
const mockRest = require('../mockedResponse');
const bulkEndPoint = require('../../src/constants').bulkUpsertEndpoint;
const tu = require('../testUtils');
const registry = tu.config.registry[Object.keys(tu.config.registry)[0]];
const refocusUrl = registry.url;
const handleCollectRes =
  require('../../src/remoteCollection/handleCollectResponse')
    .handleCollectResponse;
const collect = require('../../src/remoteCollection/collect').collect;
const httpStatus = require('../../src/constants').httpStatus;

describe('test/remoteCollection/handleCollectResponse.js >', () => {
  const sampleArr = [{ name: 'Fremont|Delay', value: 10 },
        { name: 'UnionCity|Delay', value: 2 },
  ];

  it('collect should return a response with "res" attribute that is ' +
    'a superagent object', (done) => {
    const remoteUrl = 'http://bart.gov.api/';
    const generator = {
      name: 'Generator0',
      interval: 600,
      ctx: {},
      generatorTemplate: {
        connection: {
          headers: {
            Authorization: 'abddr121345bb',
          },
          url: 'http://bart.gov.api/status',
        },
        transform:
        'return [{ name: "Fremont|Delay", value: 10 }, ' +
          '{ name: "UnionCity|Delay", value: 2 }]',
      },
      subject: { absolutePath: 'EastBay' },
    };
    const remoteData = {
      station: [{ name: 'Fremont|Delay', value: 10 },
        { name: 'UnionCity|Delay', value: 2 },
      ],
    };
    nock(remoteUrl)
      .get('/status')
      .reply(httpStatus.OK, remoteData);

    collect(generator)
    .then((collectRes) => {
      expect(collectRes.res).to.not.equal(undefined);
      expect(collectRes.res.status).to.equal(httpStatus.OK);
      expect(collectRes.res.body).to.deep.equal(remoteData);

      expect(collectRes.res.req.headers['user-agent'])
        .to.contain('node-superagent');

      expect(collectRes.generatorTemplate).to.deep
        .equal(generator.generatorTemplate);
      expect(collectRes.ctx).to.deep.equal(generator.ctx);
      expect(collectRes.subject).to.deep.equal(generator.subject);

      done();
    })
    .catch(done);
  });

  it('SERVER ERROR: bad responses from collect should also be a part of ' +
    'the "res" attribute', (done) => {
    const remoteUrl1 = 'http://randonUnAvailableUrl.false/';
    const generator = {
      name: 'Generator0',
      interval: 600,
      ctx: {},
      generatorTemplate: {
        connection: {
          headers: {
            Authorization: 'abddr121345bb',
          },
          url: 'http://randonUnAvailableUrl.false/',
        },
      },
    };
    const serverError = {
      error: { message: 'Server is down' },
    };
    nock(remoteUrl1)
      .get('/')
      .reply(httpStatus.SERVICE_UNAVAILABLE, serverError);

    collect(generator)
    .then((collectRes) => {
      expect(collectRes.res).to.not.equal(undefined);
      expect(collectRes.res.status).to.equal(httpStatus.SERVICE_UNAVAILABLE);
      expect(collectRes.res.response.text).to.contain('Server is down');
      done();
    })
    .catch(done);
  });

  it('CLIENT ERROR:  bad responses from collect should also be a part of ' +
    'the "res" attribute', (done) => {
    const generator = {
      name: 'Generator0',
      interval: 600,
      ctx: {},
      generatorTemplate: {
        connection: {
          headers: {
            Authorization: 'abddr121345bb',
          },
          url: 'notaural',
        },
      },
    };
    collect(generator)
    .then((collectRes) => {
      expect(collectRes.res).to.not.equal(undefined);
      expect(collectRes.res.errno).to.equal('ENOTFOUND');
      done();
    })
    .catch(done);
  });

  it('handleCollectResponse should be work with a good response ' +
    'from collect  ', (done) => {
    const remoteUrl = 'http://bart.gov.api/';
    const generator = {
      name: 'Generator0',
      interval: 600,
      ctx: {},
      generatorTemplate: {
        connection: {
          headers: {
            Authorization: 'abddr121345bb',
          },
          url: 'http://bart.gov.api/status',
        },
        transform: 'return [{ name: "Fremont|Delay", value: 10 }, ' +
          '{ name: "UnionCity|Delay", value: 2 }]',
      },
      subject: { absolutePath: 'OneSubject' },
    };
    const remoteData = {
      station: [{ name: 'Fremont|Delay', value: 10 },
        { name: 'UnionCity|Delay', value: 2 },
      ],
    };
    nock(remoteUrl)
      .get('/status')
      .reply(httpStatus.OK, remoteData);

    nock(refocusUrl)
      .post(bulkEndPoint, sampleArr)
      .reply(httpStatus.CREATED, mockRest.bulkUpsertPostOk);

    handleCollectRes(collect(generator))
    .then((collectRes) => {
      expect(collectRes.status).to.equal(httpStatus.CREATED);
      expect(collectRes.body.status).to.equal('OK');
      expect(collectRes.body.jobId).not.equal(undefined);
      done();
    })
    .catch(done);
  });
});
