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
const logger = require('winston');
logger.configure({ level: 0 });
require('superagent-proxy')(request);
const configModule = require('../../src/config/config');

/* eslint-disable no-magic-numbers */
describe('test/remoteCollection/collect.js >', () => {
  before((done) => {
    configModule.clearConfig();
    configModule.initializeConfig();
    configModule.getConfig().name = 'collector1';
    done();
  });

  it('collecting data with simple-oauth parameter', (done) => {
    const remoteUrl = 'http://www.xyz.com/';
    const generator = {
      name: 'Generator0',
      intervalSecs: 1,
      context: {},
      subjectQuery: '?absolutePath=EastBay',
      token: 'abcdefg',
      refocus: {
        url: 'http://www.refocus.com',
      },
      generatorTemplate: {
        connection: {
          headers: {
            Authorization: 'abddr121345bb',
          },
          url: 'http://www.xyz.com/status',
          simple_oauth: 'ownerPassword', // eslint-disable-line camelcase
        },
        transform: {
          default: 'return [{ name: "Fremont|Delay", value: 10 }, ' +
            '{ name: "UnionCity|Delay", value: 2 }]',
        },
      },
      connection: {
        simple_oauth: { // eslint-disable-line camelcase
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
          method: 'ownerPassword',
        },
      },
    };
    const subjects = [{ absolutePath: 'EastBay' }];

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
      .reply(httpStatus.OK, token,
        { 'Content-Type': 'application/json' });

    nock(remoteUrl)
      .get('/status')
      .reply(httpStatus.OK, remoteData,
        { 'Content-Type': 'application/json' });

    nock(generator.refocus.url)
      .get('/v1/subjects?absolutePath=EastBay&isPublished=true')
      .reply(httpStatus.OK, [{ absolutePath: 'EastBay' }]);

    collect.collectBulk(generator, subjects)
      .then(({ subjects, preparedUrl, preparedHeaders, res }) => {
        expect(subjects).to.deep.equal([{ absolutePath: 'EastBay' }]);
        expect(preparedUrl).to.equal('http://www.xyz.com/status');
        expect(preparedHeaders).to.deep.equal({
          Accept: 'application/json',
          Authorization: 'Bearer eegduygsugfiusguguygyfkufyg',
        });

        expect(res).to.not.equal(undefined);
        expect(res.status).to.equal(httpStatus.OK);
        expect(res.body).to.deep.equal(remoteData);

        expect(res.req.headers['user-agent'])
          .to.contain('node-superagent');

        expect(res.request.header.Authorization)
          .to.equal('Bearer eegduygsugfiusguguygyfkufyg');

        done();
      })
      .catch(done);
  });

  it('collect should return a response with "res" attribute that is ' +
    'a superagent object', (done) => {
    const remoteUrl = 'http://bart.gov.api/';
    const generator = {
      name: 'Generator0',
      intervalSecs: 1,
      context: {},
      subjectQuery: '?absolutePath=EastBay',
      token: 'abcdefg',
      refocus: {
        url: 'http://www.refocus.com',
      },
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
      connection: {},
    };
    const subjects = [{ absolutePath: 'EastBay' }];
    const remoteData = {
      station: [{ name: 'Fremont|Delay', value: 10 },
        { name: 'UnionCity|Delay', value: 2 },
      ],
    };
    nock(remoteUrl)
      .get('/status')
      .reply(httpStatus.OK, remoteData,
        { 'Content-Type': 'application/json' });

    nock(generator.refocus.url)
      .get('/v1/subjects?absolutePath=EastBay&isPublished=true')
      .reply(httpStatus.OK, [{ absolutePath: 'EastBay' }]);

    collect.collectBulk(generator, subjects)
      .then(({ subjects, preparedUrl, preparedHeaders, res }) => {
        expect(subjects).to.deep.equal([{ absolutePath: 'EastBay' }]);
        expect(preparedUrl).to.equal('http://bart.gov.api/status');
        expect(preparedHeaders).to.deep.equal({
          Accept: 'application/json',
          Authorization: 'abddr121345bb',
        });

        expect(res).to.not.equal(undefined);
        expect(res.status).to.equal(httpStatus.OK);
        expect(res.body).to.deep.equal(remoteData);
        expect(res.req.headers['user-agent'])
          .to.contain('node-superagent');
        done();
      })
      .catch(done);
  });

  it('collecting data with masking details', (done) => {
    const remoteUrl = 'http://www.xyz.com/';
    const generator = {
      name: 'Generator0',
      intervalSecs: 1,
      context: {
        username: 'testUser',
        password: 'testPassword',
      },
      subjectQuery: '?absolutePath=EastBay',
      token: 'abcdefg',
      refocus: {
        url: 'http://www.refocus.com',
      },
      generatorTemplate: {
        connection: {
          headers: {
            Authorization: 'abddr121345bb',
          },
          url: 'http://www.xyz.com/status',
          simple_oauth: 'ownerPassword', // eslint-disable-line camelcase
        },
        transform: {
          default: 'return [{ name: "Fremont|Delay", value: 10 }, ' +
            '{ name: "UnionCity|Delay", value: 2 }]',
        },
      },
      connection: {
        simple_oauth: { // eslint-disable-line camelcase
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
            username: '{{username}}',
            password: '{{password}}',
          },
          tokenFormat: 'Bearer {accessToken}',
          method: 'ownerPassword',
        },
      },
    };
    const subjects = [{ absolutePath: 'EastBay' }];

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
      .reply(httpStatus.OK, token,
        { 'Content-Type': 'application/json' });

    nock(remoteUrl)
      .get('/status')
      .reply(httpStatus.OK, remoteData,
        { 'Content-Type': 'application/json' });

    nock(generator.refocus.url)
      .get('/v1/subjects?absolutePath=EastBay&isPublished=true')
      .reply(httpStatus.OK, [{ absolutePath: 'EastBay' }]);

    collect.collectBulk(generator, subjects)
      .then(({ subjects, preparedUrl, preparedHeaders, res }) => {
        expect(subjects).to.deep.equal([{ absolutePath: 'EastBay' }]);
        expect(preparedUrl).to.equal('http://www.xyz.com/status');
        expect(preparedHeaders).to.deep.equal({
          Accept: 'application/json',
          Authorization: 'Bearer eegduygsugfiusguguygyfkufyg',
        });

        expect(res).to.not.equal(undefined);
        expect(res.status).to.equal(httpStatus.OK);
        expect(res.body).to.deep.equal(remoteData);

        expect(res.req.headers['user-agent'])
          .to.contain('node-superagent');

        expect(res.request.header.Authorization)
          .to.equal('Bearer eegduygsugfiusguguygyfkufyg');
        expect(generator.connection.simple_oauth.tokenConfig.username)
          .to.equal('testUser');
        expect(generator.connection.simple_oauth.tokenConfig.password)
          .to.equal('testPassword');

        done();
      })
      .catch(done);
  });

  it('collecting data with masking details, connection undefined', (done) => {
    const remoteUrl = 'http://www.xyz.com/';
    const generator = {
      name: 'Generator0',
      intervalSecs: 1,
      context: {
        username: 'testUser',
        password: 'testPassword',
      },
      subjectQuery: '?absolutePath=EastBay',
      token: 'abcdefg',
      refocus: {
        url: 'http://www.refocus.com',
      },
      generatorTemplate: {
        connection: {
          headers: {
            Authorization: 'abddr121345bb',
          },
          url: 'http://www.xyz.com/status',
          simple_oauth: 'ownerPassword', // eslint-disable-line camelcase
        },
        transform: {
          default: 'return [{ name: "Fremont|Delay", value: 10 }, ' +
            '{ name: "UnionCity|Delay", value: 2 }]',
        },
      },
    };
    const subjects = [{ absolutePath: 'EastBay' }];

    const remoteData = {
      station: [{ name: 'Fremont|Delay', value: 10 },
        { name: 'UnionCity|Delay', value: 2 },
      ],
    };

    nock(remoteUrl)
      .get('/status')
      .reply(httpStatus.OK, remoteData,
        { 'Content-Type': 'application/json' });

    nock(generator.refocus.url)
      .get('/v1/subjects?absolutePath=EastBay&isPublished=true')
      .reply(httpStatus.OK, [{ absolutePath: 'EastBay' }]);

    collect.collectBulk(generator, subjects)
      .then(({ subjects, preparedUrl, preparedHeaders, res }) => {
        expect(subjects).to.deep.equal([{ absolutePath: 'EastBay' }]);
        expect(preparedUrl).to.equal('http://www.xyz.com/status');
        expect(preparedHeaders).to.deep.equal({
          Accept: 'application/json',
          Authorization: 'abddr121345bb',
        });

        expect(res).to.not.equal(undefined);
        expect(res.status).to.equal(httpStatus.OK);
        expect(res.body).to.deep.equal(remoteData);

        expect(res.req.headers['user-agent'])
          .to.contain('node-superagent');

        expect(res.request.header.Authorization)
          .to.equal('abddr121345bb');
        expect(generator.connection).to.equal(undefined);

        done();
      })
      .catch(done);
  });

  it('collecting data from salesforce org', (done) => {
    const remoteUrl = 'https://xyztest.salesforcetest.com';
    const generator = {
      name: 'Generator0',
      intervalSecs: 1,
      context: {},
      subjectQuery: '?absolutePath=EastBay',
      token: 'abcdefg',
      refocus: {
        url: 'http://www.refocus.com',
      },
      generatorTemplate: {
        connection: {
          headers: {
            Authorization: 'abddr121345bb',
          },
          url: 'https://xyztest.salesforcetest.com/status',
          simple_oauth: 'ownerPassword', // eslint-disable-line camelcase
        },
        transform: {
          default: 'return [{ name: "Fremont|Delay", value: 10 }, ' +
            '{ name: "UnionCity|Delay", value: 2 }]',
        },
      },
      connection: {
        simple_oauth: { // eslint-disable-line camelcase
          credentials: {
            client: {
              id: 'ADFJSD234ADF765SFG55FD54S',
              secret: 'ADFJSD234ADF765SFG55FD54S',
              redirectUri: 'http://localhost:3000/oauth/_callback',
            },
            auth: {
              tokenHost: 'https://xyztest.salesforcetest.com',
              tokenPath: '/argusws/v2/auth/login',
            },
            options: {
              bodyFormat: 'json',
            },
          },
          tokenConfig: {
            username: 'test',
            password: 'test',
          },
          tokenFormat: '{accessToken}',
          salesforce: true,
          method: 'ownerPassword',
        },
      },
    };
    const subjects = [{ absolutePath: 'EastBay' }];

    const token = {
      // eslint-disable-next-line camelcase
      access_token: 'eegduygsugfiusguguygyfkufyg',
    };

    const remoteData = {
      station: [{ name: 'Fremont|Delay', value: 10 },
        { name: 'UnionCity|Delay', value: 2 },
      ],
    };

    nock('https://login.salesforce.com')
      .post('/services/oauth2/authorize')
      .reply(httpStatus.OK, token,
        { 'Content-Type': 'application/json' });

    nock('https://login.salesforce.com')
      .post('/services/oauth2/token')
      .reply(httpStatus.OK, token,
        { 'Content-Type': 'application/json' });

    nock(remoteUrl)
      .get('/status')
      .reply(httpStatus.OK, remoteData,
        { 'Content-Type': 'application/json' });

    nock(generator.refocus.url)
      .get('/v1/subjects?absolutePath=EastBay&isPublished=true')
      .reply(httpStatus.OK, [{ absolutePath: 'EastBay' }]);

    collect.collectBulk(generator, subjects)
      .then(({ subjects, preparedUrl, preparedHeaders, res }) => {
        expect(subjects).to.deep.equal([{ absolutePath: 'EastBay' }]);
        expect(preparedUrl).to.equal('https://xyztest.salesforcetest.com/status');
        expect(preparedHeaders).to.deep.equal({
          Accept: 'application/json',
          Authorization: 'eegduygsugfiusguguygyfkufyg',
        });

        expect(res).to.not.equal(undefined);
        expect(res.status).to.equal(httpStatus.OK);
        expect(res.body).to.deep.equal(remoteData);

        expect(res.request.header.Authorization)
          .to.equal('eegduygsugfiusguguygyfkufyg');

        done();
      })
      .catch(done);
  });

  it('collecting data from argus', (done) => {
    const remoteUrl = 'https://xyztest.argusTest.com';
    const generator = {
      name: 'Generator0',
      intervalSecs: 1,
      context: {},
      subjectQuery: '?absolutePath=EastBay',
      token: 'abcdefg',
      refocus: {
        url: 'http://www.refocus.com',
      },
      generatorTemplate: {
        connection: {
          headers: {
            Authorization: 'abddr121345bb',
          },
          url: 'https://xyztest.argusTest.com/status',
          simple_oauth: 'ownerPassword', // eslint-disable-line camelcase
        },
        transform: {
          default: 'return [{ name: "Fremont|Delay", value: 10 }, ' +
            '{ name: "UnionCity|Delay", value: 2 }]',
        },
      },
      connection: {
        simple_oauth: { // eslint-disable-line camelcase
          credentials: {
            client: {},
            auth: {
              tokenHost: 'https://xyztest.argusTest.com',
              tokenPath: '/argusws/v2/auth/login',
            },
            options: {
              bodyFormat: 'json',
            },
          },
          tokenConfig: {
            username: 'test',
            password: 'test',
          },
          tokenFormat: 'Bearer {accessToken}',
          method: 'ownerPassword',
        },
      },
    };
    const subjects = [{ absolutePath: 'EastBay' }];

    const token = {
      // eslint-disable-next-line camelcase
      access_token: 'eegduygsugfiusguguygyfkufyg',
    };

    const remoteData = {
      station: [{ name: 'Fremont|Delay', value: 10 },
        { name: 'UnionCity|Delay', value: 2 },
      ],
    };

    nock(remoteUrl)
      .post('/argusws/v2/auth/login')
      .reply(httpStatus.OK, token,
        { 'Content-Type': 'application/json' });

    nock(remoteUrl)
      .get('/status')
      .reply(httpStatus.OK, remoteData,
        { 'Content-Type': 'application/json' });

    nock(generator.refocus.url)
      .get('/v1/subjects?absolutePath=EastBay&isPublished=true')
      .reply(httpStatus.OK, [{ absolutePath: 'EastBay' }]);

    collect.collectBulk(generator, subjects)
      .then(({ subjects, preparedUrl, preparedHeaders, res }) => {
        expect(subjects).to.deep.equal([{ absolutePath: 'EastBay' }]);
        expect(preparedUrl).to.equal('https://xyztest.argusTest.com/status');
        expect(preparedHeaders).to.deep.equal({
          Accept: 'application/json',
          Authorization: 'Bearer eegduygsugfiusguguygyfkufyg',
        });

        expect(res).to.not.equal(undefined);
        expect(res.status).to.equal(httpStatus.OK);
        expect(res.body).to.deep.equal(remoteData);

        expect(res.request.header.Authorization)
          .to.equal('Bearer eegduygsugfiusguguygyfkufyg');

        done();
      })
      .catch(done);
  });

  it('collecting data with access token', (done) => {
    const remoteUrl = 'http://www.xyz.com/';
    const generator = {
      name: 'Generator0',
      intervalSecs: 1,
      context: {},
      OAuthToken: {
        accessToken: 'eegduygsugfiusguguygyfkufyg',
      },
      subjectQuery: '?absolutePath=EastBay',
      token: 'abcdefg',
      refocus: {
        url: 'http://www.refocus.com',
      },
      generatorTemplate: {
        connection: {
          headers: {
            Authorization: 'abddr121345bb',
          },
          url: 'http://www.xyz.com/status',
        },
        transform: {
          default: 'return [{ name: "Fremont|Delay", value: 10 }, ' +
            '{ name: "UnionCity|Delay", value: 2 }]',
        },
      },
      connection: {},
    };
    const subjects = [{ absolutePath: 'EastBay' }];

    const remoteData = {
      station: [{ name: 'Fremont|Delay', value: 10 },
        { name: 'UnionCity|Delay', value: 2 },
      ],
    };

    nock(remoteUrl)
      .post('/login')
      .reply(httpStatus.OK, { 'Content-Type': 'application/json' });

    nock(remoteUrl)
      .get('/status')
      .reply(httpStatus.OK, remoteData,
        { 'Content-Type': 'application/json' });

    nock(generator.refocus.url)
      .get('/v1/subjects?absolutePath=EastBay&isPublished=true')
      .reply(httpStatus.OK, [{ absolutePath: 'EastBay' }]);

    collect.collectBulk(generator, subjects)
      .then(({ subjects, preparedUrl, preparedHeaders, res }) => {
        expect(subjects).to.deep.equal([{ absolutePath: 'EastBay' }]);
        expect(preparedUrl).to.equal('http://www.xyz.com/status');
        expect(preparedHeaders).to.deep.equal({
          Accept: 'application/json',
          Authorization: 'eegduygsugfiusguguygyfkufyg',
        });

        expect(res).to.not.equal(undefined);
        expect(res.status).to.equal(httpStatus.OK);
        expect(res.body).to.deep.equal(remoteData);
        expect(res.req.headers['user-agent'])
          .to.contain('node-superagent');
        expect(res.request.header.Authorization)
          .to.equal('eegduygsugfiusguguygyfkufyg');
        done();
      })
      .catch(done);
  });

  it('SERVER ERROR: bad responses from collect should also be a part of ' +
    'the "res" attribute', (done) => {
    const remoteUrl1 = 'http://randonUnAvailableUrl.false/';
    const generator = {
      name: 'Generator0',
      intervalSecs: 1,
      context: {},
      subjectQuery: '?absolutePath=EastBay',
      token: 'abcdefg',
      refocus: {
        url: 'http://www.refocus.com',
      },
      generatorTemplate: {
        connection: {
          headers: {
            Authorization: 'abddr121345bb',
          },
          url: 'http://randonUnAvailableUrl.false/',
        },
      },
      connection: {},
    };
    const subjects = [{ absolutePath: 'EastBay' }];
    const serverError = {
      error: { message: 'Server is down' },
    };
    nock(remoteUrl1)
      .get('/')
      .times(5)
      .reply(httpStatus.SERVICE_UNAVAILABLE, serverError);

    nock(generator.refocus.url)
      .get('/v1/subjects?absolutePath=EastBay&isPublished=true')
      .reply(httpStatus.OK, [{ absolutePath: 'EastBay' }]);

    collect.collectBulk(generator, subjects)
      .then(({ subjects, preparedUrl, preparedHeaders, res }) => {
        expect(subjects).to.deep.equal([{ absolutePath: 'EastBay' }]);
        expect(preparedUrl).to.equal('http://randonUnAvailableUrl.false/');
        expect(preparedHeaders).to.deep.equal({
          Accept: 'application/json',
          Authorization: 'abddr121345bb',
        });

        expect(res).to.not.equal(undefined);
        expect(res.status).to
          .equal(httpStatus.SERVICE_UNAVAILABLE);
        expect(res.response.body.error.message)
          .to.contain('Server is down');
        done();
      })
      .catch(done);
  });

  it('CLIENT ERROR:  bad responses from collect should also be a part of ' +
    'the "res" attribute', (done) => {
    const generator = {
      name: 'Generator0',
      intervalSecs: 1,
      context: {},
      subjectQuery: '?absolutePath=EastBay',
      token: 'abcdefg',
      refocus: {
        url: 'http://www.refocus.com',
      },
      generatorTemplate: {
        connection: {
          headers: {
            Authorization: 'abddr121345bb',
          },
          url: 'notaural',
        },
      },
      connection: {},
    };
    const subjects = [{ absolutePath: 'EastBay' }];
    nock(generator.refocus.url)
      .get('/v1/subjects?absolutePath=EastBay&isPublished=true')
      .reply(httpStatus.OK, [{ absolutePath: 'EastBay' }]);

    collect.collectBulk(generator, subjects)
      .then(({ subjects, preparedUrl, preparedHeaders, res }) => {
        expect(subjects).to.deep.equal([{ absolutePath: 'EastBay' }]);
        expect(preparedUrl).to.equal('notaural');
        expect(preparedHeaders).to.deep.equal({
          Accept: 'application/json',
          Authorization: 'abddr121345bb',
        });

        expect(res).to.not.equal(undefined);
        expect(res.errno).to.equal('ENOTFOUND');
        done();
      })
      .catch(done);
  });

  it('ok, request use data source proxy when present', (done) => {
    const dataSourceProxy = 'http://abcProxy.com';
    const remoteUrl = 'http://www.xyz.com/';
    const generator = {
      name: 'Generator0',
      intervalSecs: 1,
      context: {},
      subjectQuery: '?absolutePath=EastBay',
      token: 'abcdefg',
      refocus: {
        url: 'http://www.refocus.com',
      },
      generatorTemplate: {
        connection: {
          headers: {
            Authorization: 'abddr121345bb',
          },
          url: 'remoteUrl' + '/status',
          dataSourceProxy,
        },
      },
      connection: {},
    };
    const subjects = [{ absolutePath: 'EastBay' }];

    nock(remoteUrl)
      .get('/status')
      .reply(httpStatus.OK, { status: 'OK' },
        { 'Content-Type': 'application/json' });

    const spy = sinon.spy(request, 'get');
    nock(generator.refocus.url)
      .get('/v1/subjects?absolutePath=EastBay&isPublished=true')
      .reply(httpStatus.OK, [{ absolutePath: 'EastBay' }]);

    collect.collectBulk(generator, subjects)
      .then(() => {
        expect(spy.withArgs('remoteUrl/status').returnValues[0]._proxyUri)
          .to.be.equal(dataSourceProxy);
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
      intervalSecs: 1,
      context: {},
      subjectQuery: '?absolutePath=EastBay',
      token: 'abcdefg',
      refocus: {
        url: 'http://www.refocus.com',
      },
      generatorTemplate: {
        connection: {
          headers: {
            Authorization: 'abddr121345bb',
          },
          url: `${remoteUrl}/status`,
        },
      },
      connection: {},
    };
    const subjects = [{ absolutePath: 'EastBay' }];

    nock(remoteUrl)
      .get('/status')
      .reply(httpStatus.OK, { status: 'OK' },
        { 'Content-Type': 'application/json' });

    const spy = sinon.spy(request, 'get');
    nock(generator.refocus.url)
      .get('/v1/subjects?absolutePath=EastBay&isPublished=true')
      .reply(httpStatus.OK, [{ absolutePath: 'EastBay' }]);

    collect.collectBulk(generator, subjects)
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

  it('must fail when require ssl and remote source is not https',
    (done) => {
      configModule.getConfig().refocus.requireSslToRemoteDataSource = true;

      const generator = {
        name: 'generator_ssl',
        context: {},
        subjectQuery: '?absolutePath=EastBay',
        token: 'abcdefg',
        refocus: {
          url: 'http://www.refocus.com',
        },
        generatorTemplate: {
          connection: {
            headers: {
              Authorization: 'some_data',
            },
            url: 'http://foo.io',
          },
        },
        connection: {},
      };
      const subjects = [{ absolutePath: 'EastBay' }];

      nock(generator.refocus.url)
        .get('/v1/subjects?absolutePath=EastBay&isPublished=true')
        .reply(httpStatus.OK, [{ absolutePath: 'EastBay' }]);

      collect.collectBulk(generator, subjects)
        .then(({ subjects, preparedUrl, preparedHeaders, res }) => {
          expect(subjects).to.deep.equal([{ absolutePath: 'EastBay' }]);
          expect(preparedUrl).to.equal('http://foo.io');
          expect(preparedHeaders).to.deep.equal({
            Accept: 'application/json',
            Authorization: 'some_data',
          });

          expect(res).to.not.equal(undefined);
          expect(res.status).to.equal(httpStatus.BAD_REQUEST);
          const expectedMessage = 'Your Refocus instance is configured to ' +
            'require SSL for connections to remote data sources. Please ' +
            'update Sample Generator "generator_ssl" to specify an ' +
            'https connection url.';
          expect(res.message).to.equal(expectedMessage);
          done();
        })
        .catch(done);
    });

  it('retry max times on timeout', (done) => {
    const remoteUrl1 = 'https://randonUnAvailableUrl.false/';
    const generator = {
      name: 'Generator0',
      intervalSecs: 1,
      context: {},
      subjectQuery: '?absolutePath=EastBay',
      token: 'abcdefg',
      refocus: {
        url: 'http://www.refocus.com',
      },
      generatorTemplate: {
        connection: {
          headers: {
            Authorization: 'abddr121345bb',
          },
          url: 'https://randonUnAvailableUrl.false/',
        },
      },
      connection: {},
      timeout: {
        response: 10,
        deadline: 10,
      },
    };
    const subjects = [{ absolutePath: 'EastBay' }];
    const err = new Error('Timeout of 10ms exceeded');
    err.timeout = 10;
    err.code = 'ECONNABORTED';
    nock(remoteUrl1)
      .get('/')
      .delay(15)
      .times(4) // initial req + 3 retries
      .replyWithError(err);

    nock(generator.refocus.url)
      .get('/v1/subjects?absolutePath=EastBay&isPublished=true')
      .reply(httpStatus.OK, [{ absolutePath: 'EastBay' }]);

    collect.collectBulk(generator, subjects)
      .then(({ subjects, preparedUrl, preparedHeaders, res }) => {
        expect(subjects).to.deep.equal([{ absolutePath: 'EastBay' }]);
        expect(preparedUrl).to.equal('https://randonUnAvailableUrl.false/');
        expect(preparedHeaders).to.deep.equal({
          Accept: 'application/json',
          Authorization: 'abddr121345bb',
        });

        expect(res)
          .to.have.property('message', 'Timeout of 10ms exceeded');
        expect(res).to.have.property('timeout', 10);
        expect(res).to.have.property('code', 'ECONNABORTED');
        done();
      })
      .catch(done);
  });

  it('retry on timeout then ok', (done) => {
    const remoteUrl1 = 'https://randonUnAvailableUrl.false/';
    const generator = {
      name: 'Generator0',
      intervalSecs: 1,
      context: {},
      subjectQuery: '?absolutePath=EastBay',
      token: 'abcdefg',
      refocus: {
        url: 'http://www.refocus.com',
      },
      generatorTemplate: {
        connection: {
          headers: {
            Authorization: 'abddr121345bb',
          },
          url: 'https://randonUnAvailableUrl.false/',
        },
      },
      connection: {},
      timeout: {
        response: 10,
        deadline: 10,
      },
    };
    const subjects = [{ absolutePath: 'EastBay' }];
    const err = new Error('Timeout of 10ms exceeded');
    err.timeout = 10;
    err.code = 'ECONNABORTED';
    nock(remoteUrl1)
      .get('/')
      .delay(15)
      .replyWithError(err);
    nock(remoteUrl1)
      .get('/')
      .reply(httpStatus.OK, { status: 'OK' },
        { 'Content-Type': 'application/json' });

    nock(generator.refocus.url)
      .get('/v1/subjects?absolutePath=EastBay&isPublished=true')
      .reply(httpStatus.OK, [{ absolutePath: 'EastBay' }]);

    collect.collectBulk(generator, subjects)
      .then(({ subjects, preparedUrl, preparedHeaders, res }) => {
        expect(subjects).to.deep.equal([{ absolutePath: 'EastBay' }]);
        expect(preparedUrl).to.equal('https://randonUnAvailableUrl.false/');
        expect(preparedHeaders).to.deep.equal({
          Accept: 'application/json',
          Authorization: 'abddr121345bb',
        });

        expect(res).to.have.property('status', 200);
        done();
      })
      .catch(done);
  });

  it('retry max times on socket hang up', (done) => {
    const remoteUrl1 = 'https://randonUnAvailableUrl.false/';
    const generator = {
      name: 'Generator0',
      intervalSecs: 1,
      context: {},
      subjectQuery: '?absolutePath=EastBay',
      token: 'abcdefg',
      refocus: {
        url: 'http://www.refocus.com',
      },
      generatorTemplate: {
        connection: {
          headers: {
            Authorization: 'abddr121345bb',
          },
          url: 'https://randonUnAvailableUrl.false/',
        },
      },
      connection: {},
    };
    const subjects = [{ absolutePath: 'EastBay' }];
    const err = new Error('socket hang up');
    err.code = 'ECONNRESET';
    nock(remoteUrl1)
      .get('/')
      .times(4) // initial req + 3 retries
      .replyWithError(err);

    nock(generator.refocus.url)
      .get('/v1/subjects?absolutePath=EastBay&isPublished=true')
      .reply(httpStatus.OK, [{ absolutePath: 'EastBay' }]);

    collect.collectBulk(generator, subjects)
      .then(({ subjects, preparedUrl, preparedHeaders, res }) => {
        expect(subjects).to.deep.equal([{ absolutePath: 'EastBay' }]);
        expect(preparedUrl).to.equal('https://randonUnAvailableUrl.false/');
        expect(preparedHeaders).to.deep.equal({
          Accept: 'application/json',
          Authorization: 'abddr121345bb',
        });

        expect(res).to.have.property('message', 'socket hang up');
        expect(res).to.have.property('code', 'ECONNRESET');
        done();
      })
      .catch(done);
  });
});
