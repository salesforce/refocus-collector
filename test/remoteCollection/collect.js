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
const collect = require('../../src/remoteCollection/collect');
const httpStatus = require('../../src/constants').httpStatus;
const sinon = require('sinon');
const request = require('superagent');
require('superagent-proxy')(request);

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
          transform: {
            default: 'return [{ name: "Fremont|Delay", value: 10 }, ' +
              '{ name: "UnionCity|Delay", value: 2 }]',
          },
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

    it('collecting data with simple-oauth parameter', (done) => {
      const remoteUrl = 'http://www.xyz.com/';
      const generator = {
        name: 'Generator0',
        interval: 600,
        context: {},
        generatorTemplate: {
          connection: {
            headers: {
              Authorization: 'abddr121345bb',
            },
            url: 'http://www.xyz.com/status',
            simple_oauth: 'ownerPassword',
          },
          transform: {
            default: 'return [{ name: "Fremont|Delay", value: 10 }, ' +
              '{ name: "UnionCity|Delay", value: 2 }]',
          },
        },
        subject: { absolutePath: 'EastBay' },
        simple_oauth: {
          credentials: {
            client: {
              id: '11bogus',
              secret: '11bogus%^',
            },
            auth: {
              tokenHost: 'http://www.xyz.com/',
              tokenPath: '/login',
            },
            options: {
              bodyFormat: 'json',
            },
          },
          tokenConfig: {
            username: 'testUser',
            password: 'testPassword',
          },
          tokenFormat: 'Bearer {accessToken}',
        },
      };

      const remoteData = {
        station: [{ name: 'Fremont|Delay', value: 10 },
          { name: 'UnionCity|Delay', value: 2 },
        ],
      };

      const token = {
        accessToken: 'eegduygsugfiusguguygyfkufyg',
      };

      nock(remoteUrl)
        .post('/login')
        .reply(httpStatus.OK, token);

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
        expect(collectRes.res.request.header.Authorization)
          .to.equal('Bearer eegduygsugfiusguguygyfkufyg');

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

    it('ok, request use data source proxy when present', (done) => {
      const dataSourceProxy = 'http://abcProxy.com';
      const remoteUrl = 'http://www.xyz.com/';
      const generator = {
        name: 'Generator0',
        interval: 600,
        context: {},
        generatorTemplate: {
          connection: {
            headers: {
              Authorization: 'abddr121345bb',
            },
            url: 'remoteUrl' + '/status',
            dataSourceProxy,
          },
        },
      };

      nock(remoteUrl)
        .get('/status')
        .reply(httpStatus.OK, { status: 'OK' });

      const spy = sinon.spy(request, 'get');
      collect.collect(generator)
      .then(() => {
        expect(spy.returnValues[0]._proxyUri).to.be.equal(dataSourceProxy);
        spy.restore();
        done();
      })
      .catch((err) => {
        spy.restore();
        done(err);
      });
    });

    it('ok, request does not use data source proxy if not set', (done) => {
      const remoteUrl = 'http://www.xyz.com/';
      const generator = {
        name: 'Generator0',
        interval: 600,
        context: {},
        generatorTemplate: {
          connection: {
            headers: {
              Authorization: 'abddr121345bb',
            },
            url: 'remoteUrl' + '/status',
          },
        },
      };

      nock(remoteUrl)
        .get('/status')
        .reply(httpStatus.OK, { status: 'OK' });

      const spy = sinon.spy(request, 'get');
      collect.collect(generator)
      .then(() => {
        expect(spy.returnValues[0]._proxyUri).to.be.equal(undefined);
        spy.restore();
        done();
      })
      .catch((err) => {
        spy.restore();
        done(err);
      });
    });
  }); // collect
});
