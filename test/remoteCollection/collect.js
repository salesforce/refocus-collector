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
const collect = require('../../src/remoteCollection/collect');
const httpStatus = require('../../src/constants').httpStatus;
const sampleQueueOps = require('../../src/sampleQueue/sampleQueueOps');

describe('test/remoteCollection/collect.js >', () => {
  describe('collect >', () => {
    const sampleArr = [{ name: 'Fremont|Delay', value: 10 },
          { name: 'UnionCity|Delay', value: 2 },
    ];

    it('collect should return a response with "res" attribute that is ' +
      'a superagent object', (done) => {
      const remoteUrl = 'http://bart.gov.api/';
      const generator = {
        name: 'Generator0',
        interval: 600,
        context: {},
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

      collect.collect(generator)
      .then((collectRes) => {
        expect(collectRes.res).to.not.equal(undefined);
        expect(collectRes.res.status).to.equal(httpStatus.OK);
        expect(collectRes.res.body).to.deep.equal(remoteData);

        expect(collectRes.res.req.headers['user-agent'])
          .to.contain('node-superagent');

        expect(collectRes.generatorTemplate).to.deep
          .equal(generator.generatorTemplate);
        expect(collectRes.context).to.deep.equal(generator.context);
        expect(collectRes.subject).to.deep.equal(generator.subject);

        done();
      })
      .catch(done);
    });

    it('collect should return a response with "res" attribute that is ' +
      'a superagent object', (done) => {
      const remoteUrl = 'http://bart.gov.api/';
      const generator = {
        name: 'Generator0',
        interval: 600,
        context: {},
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

      collect.collect(generator)
      .then((collectRes) => {
        expect(collectRes.res).to.not.equal(undefined);
        expect(collectRes.res.status).to.equal(httpStatus.OK);
        expect(collectRes.res.body).to.deep.equal(remoteData);

        expect(collectRes.res.req.headers['user-agent'])
          .to.contain('node-superagent');

        expect(collectRes.generatorTemplate).to.deep
          .equal(generator.generatorTemplate);
        expect(collectRes.context).to.deep.equal(generator.context);
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
        context: {},
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

      collect.collect(generator)
      .then((collectRes) => {
        expect(collectRes.res).to.not.equal(undefined);
        expect(collectRes.res.status).to.equal(httpStatus.SERVICE_UNAVAILABLE);
        expect(collectRes.res.body.error.message).to.contain('Server is down');
        done();
      })
      .catch(done);
    });

    it('CLIENT ERROR:  bad responses from collect should also be a part of ' +
      'the "res" attribute', (done) => {
      const generator = {
        name: 'Generator0',
        interval: 600,
        context: {},
        generatorTemplate: {
          connection: {
            headers: {
              Authorization: 'abddr121345bb',
            },
            url: 'notaural',
          },
        },
      };
      collect.collect(generator)
      .then((collectRes) => {
        expect(collectRes.res).to.not.equal(undefined);
        expect(collectRes.res.errno).to.equal('ENOTFOUND');
        done();
      })
      .catch(done);
    });

    it('handleCollectResponse should work with a good response from collect',
    (done) => {
      const remoteUrl = 'http://bart.gov.api/';
      const generator = {
        name: 'Generator0',
        interval: 600,
        aspects: [{ name: 'Delay', timeout: '1m' }],
        context: {},
        generatorTemplate: {
          connection: {
            headers: {
              Authorization: 'abddr121345bb',
            },
            url: 'http://bart.gov.api/status',
          },
          transform: 'return [{ name: "Fremont|Delay", value: "10" }, ' +
            '{ name: "UnionCity|Delay", value: "2" }]',
        },
        bulk: true,
        subjects: [{ absolutePath: 'Fremont' }, { absolutePath: 'UnionCity' }],
        aspects: [{ name: 'Delay', timeout: '1m' }],
      };
      const remoteData = {
        station: [{ name: 'Fremont|Delay', value: '10' },
          { name: 'UnionCity|Delay', value: '2' },
        ],
      };
      nock(remoteUrl)
        .get('/status')
        .reply(httpStatus.OK, remoteData);

      nock(refocusUrl)
        .post(bulkEndPoint, sampleArr)
        .reply(httpStatus.CREATED, mockRest.bulkUpsertPostOk);

      handleCollectRes(collect.collect(generator))
      .then(() => {
        expect(sampleQueueOps.sampleQueue.length).to.be.equal(2);
        expect(sampleQueueOps.sampleQueue[0])
          .to.eql({ name: 'Fremont|Delay', value: '10' });
        expect(sampleQueueOps.sampleQueue[1])
          .to.eql({ name: 'UnionCity|Delay', value: '2' });
        sampleQueueOps.flush(100, tu.firstKeyPairInRegistry);
        done();
      })
      .catch(done);
    });
  }); // collect

  describe('prepareUrl >', () => {
    it('url is provided', () => {
      const g = {
        name: 'MyGen',
        interval: 6000,
        aspects: [{ name: 'Delay', timeout: '1m' }],
        context: {
          host: 'bart.gov.api',
        },
        generatorTemplate: {
          connection: {
            headers: {
              Authorization: 'abddr121345bb',
            },
            url: 'http://{{host}}/status',
            bulk: true,
          },
          transform: 'return [{ name: "Fremont|Delay", value: 10 }, ' +
            '{ name: "UnionCity|Delay", value: 2 }]',
        },
        subjects: [{ absolutePath: 'Fremont' }, { absolutePath: 'UnionCity' }],
      };
      expect(collect.prepareUrl(g)).to.be.equal('http://bart.gov.api/status');
    });

    it('toUrl is provided', () => {
      const g = {
        name: 'MyGen',
        interval: 6000,
        aspects: [{ name: 'Delay', timeout: '1m' }],
        context: {},
        generatorTemplate: {
          connection: {
            headers: {
              Authorization: 'abddr121345bb',
            },
            bulk: true,
            toUrl: 'return "http://bart.gov.api/status";',
          },
          transform: 'return [{ name: "Fremont|Delay", value: 10 }, ' +
            '{ name: "UnionCity|Delay", value: 2 }]',
        },
        subjects: [{ absolutePath: 'Fremont' }, { absolutePath: 'UnionCity' }],
      };
      expect(collect.prepareUrl(g)).to.be.equal('http://bart.gov.api/status');
    });

    it('neither url nor toUrl is provided', (done) => {
      const g = {
        name: 'MyGen',
        interval: 6000,
        aspects: [{ name: 'Delay', timeout: '1m' }],
        context: {},
        generatorTemplate: {
          connection: {
            headers: {
              Authorization: 'abddr121345bb',
            },
            bulk: true,
          },
          transform: 'return [{ name: "Fremont|Delay", value: 10 }, ' +
            '{ name: "UnionCity|Delay", value: 2 }]',
        },
        subjects: [{ absolutePath: 'Fremont' }, { absolutePath: 'UnionCity' }],
      };
      try {
        expect(collect.prepareUrl(g)).to.be.equal('http://bart.gov.api/status');
        done('Expecting ValidationError');
      } catch (err) {
        expect(err.name).to.be.equal('ValidationError');
        done();
      }
    });
  }); // prepareUrl

  describe('prepareHeaders >', () => {
    it('OK', () => {
      const headers = {
        Accept: 'application/xml',
        Authorization: 'bearer: {{myToken}}',
      };
      const context = {
        myToken: 'abcdef',
      };
      const actual = collect.prepareHeaders(headers, context);
      expect(actual).to.have.property('Accept', 'application/xml');
      expect(actual).to.have.property('Authorization', 'bearer: abcdef');
    });
  }); // prepareHeaders
});
