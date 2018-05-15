/**
 * Copyright (c) 2017, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or
 * https://opensource.org/licenses/BSD-3-Clause
 */

/**
 * test/heartbeat/listener.js
 */
'use strict'; // eslint-disable-line strict
const configModule = require('../../src/config/config');
const listener = require('../../src/heartbeat/listener');
const repeater = require('../../src/repeater/repeater');
const tracker = repeater.tracker;
const sgt = require('../sgt');
const expect = require('chai').expect;
const encrypt = require('../../src/utils/commonUtils').encrypt;
const encryptionAlgorithm = 'aes-256-cbc';
const logger = require('winston');
logger.configure({ level: 0 });

describe('test/heartbeat/listener.js >', () => {
  before(() => {
    configModule.clearConfig();
    configModule.initializeConfig();
    const config = configModule.getConfig();
    config.name = 'collector1';
    config.refocus.url = 'refocus.com';
    config.refocus.collectorToken = 'collectortoken';
  });

  after(() => {
    configModule.clearConfig();
  });

  afterEach(() => repeater.stopAllRepeaters());

  const hbResponse = {
    collectorConfig: {
      heartbeatIntervalMillis: 50,
      maxSamplesPerBulkRequest: 10,
      status: 'Running',
    },
    encryptionAlgorithm,
    generatorsAdded: [
      {
        name: 'Core_Trust1',
        aspects: [{ name: 'A1' }],
        generatorTemplateName: 'refocus-trust1-collector',
        subjectQuery: 'absolutePath=Parent.Child.*&tags=Primary',
        context: { baseTrustUrl: 'https://example.api', },
        collectors: [{ name: 'agent1' }],
        generatorTemplate: sgt,
        token: 'asd123asd',
        intervalSecs: 6,
      },
    ],
    generatorsUpdated: [],
    generatorsDeleted: [],
  };

  it('should handle errors passed to the function', (done) => {
    const err = { status: 404,
      description: 'heartbeat not received', };
    const ret = listener(err, hbResponse);
    expect(ret).to.deep.equal(err);
    done();
  });

  it('collector config should be updated', (done) => {
    const updatedConfig = listener(null, hbResponse);
    expect(updatedConfig.refocus.heartbeatIntervalMillis)
      .to.equal(hbResponse.collectorConfig.heartbeatIntervalMillis);
    expect(updatedConfig.refocus.status)
      .to.equal(hbResponse.collectorConfig.status);
    done();
  });

  it('added generators should be added to the config and the repeat tracker ' +
    'should be setup', (done) => {
    const res = {
      collectorConfig: {
        heartbeatIntervalMillis: 50,
        maxSamplesPerBulkRequest: 10,
        status: 'Running',
      },
      generatorsAdded: [
        {
          name: 'Core_Trust2',
          generatorTemplateName: 'refocus-trust1-collector',
          generatorTemplate: sgt,
          subjectQuery: 'absolutePath=Parent.Child.*&tags=Primary',
          context: { baseTrustUrl: 'https://example.api' },
          collectors: [{ name: 'agent1' }],
          intervalSecs: 6,
          token: 'asd123asd',
        },
      ],
    };
    const updatedConfig = listener(null, res);
    expect(updatedConfig.generators.Core_Trust2)
      .to.deep.equal(res.generatorsAdded[0]);
    expect(tracker.Core_Trust2._bulk).not.equal(undefined);
    done();
  });

  it('updated generators should be updated in the config', (done) => {
    const res = {
      collectorConfig: {
        heartbeatIntervalMillis: 50,
        maxSamplesPerBulkRequest: 10,
        status: 'Running',
      },
      generatorsAdded: [
        {
          name: 'Core_Trust3',
          generatorTemplateName: 'refocus-trust1-collector',
          generatorTemplate: sgt,
          subjectQuery: 'absolutePath=Parent.Child.*&tags=Primary',
          context: { baseTrustUrl: 'https://example.api', },
          collectors: [{ name: 'agent1' }],
          intervalSecs: 6,
          token: 'asd123asd',
        },
      ],
    };
    listener(null, res);
    hbResponse.generatorsUpdated = [
      {
        name: 'Core_Trust3',
        intervalSecs: 1,
        context: { baseTrustUrl: 'https://example.api', },
        generatorTemplate: sgt,
        subjectQuery: 'absolutePath=Parent.Child.*&tags=Primary',
        token: 'asd123asd',
      },
    ];
    hbResponse.generatorsAdded = [];
    const updatedConfig = listener(null, hbResponse);
    expect(updatedConfig.generators.Core_Trust3.context.baseTrustUrl)
      .to.deep.equal('https://example.api');
    expect(tracker.Core_Trust3).not.equal(null);
    done();
  });

  // FIXME once we have the bulk=false code updated and working
  it.skip('SGT with bulk=false should be handled', (done) => {
    const res = {
      collectorConfig: {
        heartbeatIntervalMillis: 50,
        maxSamplesPerBulkRequest: 10,
        status: 'Running',
      },
      generatorsAdded: [
        {
          name: 'Core_Trust_nonBulk_NA1_NA2',
          generatorTemplateName: 'refocus-trust1-collector',
          generatorTemplate: sgt,
          subjects: [{ absolutePath: 'NA1' }, { absolutePath: 'NA2' }],
          subjectQuery: 'absolutePath=Parent.Child.*&tags=Primary',
          context: { baseTrustUrl: 'https://example.api', },
          collectors: [{ name: 'agent1' }],
          intervalSecs: 6,
          token: 'asd123asd',
        },
      ],
    };
    const updatedConfig = listener(null, res);
    expect(updatedConfig.generators.Core_Trust_nonBulk_NA1_NA2)
      .to.deep.equal(res.generatorsAdded[0]);
    expect(tracker.Core_Trust_nonBulk_NA1_NA2.NA1).not.equal(undefined);
    expect(tracker.Core_Trust_nonBulk_NA1_NA2.NA2).not.equal(undefined);
    done();
  });

  // FIXME once we have the bulk=false code updated and working
  it.skip('SGT update from bulk=true to bulk=false', (done) => {
    const res = {
      collectorConfig: {
        heartbeatIntervalMillis: 50,
        maxSamplesPerBulkRequest: 10,
        status: 'Running',
      },
      generatorsAdded: [
        {
          name: 'bulktrueToBulkFalse_1',
          generatorTemplateName: 'refocus-sample-collector',
          generatorTemplate: sgt,
          subjectQuery: 'absolutePath=Parent.Child.*&tags=Primary',
          context: { baseTrustUrl: 'https://example.api', },
          collectors: [{ name: 'agent1' }],
          intervalSecs: 6,
          token: 'asd123asd',
        },
      ],
    };

    let updatedConfig = listener(null, res);
    expect(updatedConfig.generators.bulktrueToBulkFalse_1)
      .to.deep.equal(res.generatorsAdded[0]);
    expect(tracker.bulktrueToBulkFalse_1._bulk).not.equal(undefined);
    const updatedRes = {
      collectorConfig: {
        heartbeatIntervalMillis: 50,
        maxSamplesPerBulkRequest: 50,
        status: 'Running',
      },
      generatorsUpdated: [
        {
          name: 'bulktrueToBulkFalse_1',
          generatorTemplateName: 'refocus-sample-collector',
          generatorTemplate: sgt,
          subjectQuery: 'absolutePath=Parent.Child.*&tags=Primary',
          subjects: [{ absolutePath: 'NA1' }, { absolutePath: 'NA2' }],
          context: { baseTrustUrl: 'https://example.api', },
          collectors: [{ name: 'agent1' }],
          intervalSecs: 6,
          token: 'asd123asd',
        },
      ],
    };

    updatedConfig = listener(null, updatedRes);
    expect(updatedConfig.generators.bulktrueToBulkFalse_1)
      .to.deep.equal(updatedRes.generatorsUpdated[0]);
    expect(tracker.bulktrueToBulkFalse_1.NA1).not.equal(undefined);
    expect(tracker.bulktrueToBulkFalse_1.NA2).not.equal(undefined);
    done();
  });

  // FIXME once we have the bulk=false code updated and working
  it.skip('SGT update from bulk=false to bulk=true', (done) => {
    const res = {
      collectorConfig: {
        heartbeatIntervalMillis: 50,
        maxSamplesPerBulkRequest: 10,
        status: 'Running',
      },
      generatorsAdded: [
        {
          name: 'bulktrueToBulkFalse_2',
          generatorTemplateName: 'refocus-sample-collector',
          generatorTemplate: sgt,
          subjectQuery: 'absolutePath=Parent.Child.*&tags=Primary',
          subjects: [{ absolutePath: 'NA1' }, { absolutePath: 'NA2' }],
          context: { baseTrustUrl: 'https://example.api', },
          collectors: [{ name: 'agent1' }],
          intervalSecs: 6,
          token: 'asd123asd',
        },
      ],
    };
    let updatedConfig = listener(null, res);
    expect(updatedConfig.generators.bulktrueToBulkFalse_2)
      .to.deep.equal(res.generatorsAdded[0]);
    expect(tracker.bulktrueToBulkFalse_2.NA1).not.equal(undefined);
    expect(tracker.bulktrueToBulkFalse_2.NA2).not.equal(undefined);
    const updatedRes = {
      collectorConfig: {
        heartbeatIntervalMillis: 50,
        maxSamplesPerBulkRequest: 10,
        status: 'Running',
      },
      generatorsUpdated: [
        {
          name: 'bulktrueToBulkFalse_2',
          generatorTemplateName: 'refocus-sample-collector',
          generatorTemplate: sgt,
          subjectQuery: 'absolutePath=Parent.Child.*&tags=Primary',
          context: { baseTrustUrl: 'https://example.api', },
          subjects: [{ absolutePath: 'NA4' }, { absolutePath: 'NA2' }],
          collectors: [{ name: 'agent1' }],
          intervalSecs: 6,
          token: 'asd123asd',
        },
      ],
    };
    updatedConfig = listener(null, updatedRes);
    expect(updatedConfig.generators.bulktrueToBulkFalse_2)
      .to.deep.equal(updatedRes.generatorsUpdated[0]);
    expect(tracker.bulktrueToBulkFalse_2._bulk).not.equal(undefined);
    done();
  });

  it('deleted generators information should be deleted in the config',
  (done) => {
    const res = {
      collectorConfig: {
        heartbeatIntervalMillis: 50,
        maxSamplesPerBulkRequest: 10,
        status: 'Running',
      },
      generatorsAdded: [
        {
          name: 'ABC_DATA',
          aspects: [{ name: 'A' }],
          intervalSecs: 6,
          generatorTemplateName: 'refocus-trust1-collector',
          generatorTemplate: sgt,
          subjectQuery: 'absolutePath=Parent.Child.*&tags=Primary',
          context: { baseTrustUrl: 'http://www.abcdatasource.com', },
          token: 'asd123asd',
        },
        {
          name: 'Fghijkl_Mnopq',
          aspects: [{ name: 'A' }],
          intervalSecs: 1,
          context: { baseTrustUrl: 'https://fghijkl.data.mnopq.com', },
          generatorTemplate: sgt,
          subjectQuery: 'absolutePath=Parent.Child.*&tags=Primary',
          token: 'asd123asd',
        },
      ],
    };
    const updatedConfig = listener(null, res);
    expect(updatedConfig.generators.ABC_DATA).to.not.equal(undefined);
    const resDel = {
      collectorConfig: {
        heartbeatIntervalMillis: 50,
        maxSamplesPerBulkRequest: 10,
        status: 'Running',
      },
      generatorsDeleted: [
        { name: 'ABC_DATA', },
      ],
    };
    const updatedConfigAgain = listener(null, resDel);
    expect(Object.keys(tracker)).to.contain('Fghijkl_Mnopq');
    expect(updatedConfigAgain.generators.Fghijkl_Mnopq)
      .to.not.equal(undefined);
    expect(tracker.ABC_DATA).equal(undefined);
    expect(updatedConfigAgain.generators.ABC_DATA).to.equal(undefined);
    done();
  });

  it('should log error when the heartbeat response does not have ' +
    'generators(Added|Deleted|Updated) as an array', (done) => {
    const res = {
      collectorConfig: {
        heartbeatIntervalMillis: 50,
        maxSamplesPerBulkRequest: 10,
        status: 'Running',
      },
      generatorsAdded: {
        name: 'Fghijkl_Mnopq',
        aspects: [{ name: 'A' }],
        intervalSecs: 1,
        context: { baseTrustUrl: 'https://example.api', },
      },
      generatorsDeleted: {
        name: 'Fghijkl_Mnopq',
      },
      generatorsUpdated: {
        name: 'Fghijkl_Mnopq',
        aspects: [{ name: 'A' }],
        intervalSecs: 1,
        context: { baseTrustUrl: 'https://example.api', },
      },
    };
    const ret = listener(null, res);
    expect(ret.refocus.heartbeatIntervalMillis).to.equal(50);
    done();
  });

  describe('with encrypted context attributes >', () => {
    const password = 'reallylongsecretpassword';
    const token = 'alphanumerictoken';
    const secret = 'collectortoken' + hbResponse.timestamp;

    it('added generators with encrypted context attributed should be ' +
      'decrypted before the repeats are created', (done) => {
      const thisSgt = JSON.parse(JSON.stringify(sgt));
      thisSgt.contextDefinition.password = { encrypted: true };
      thisSgt.contextDefinition.token = { encrypted: true };
      thisSgt.contextDefinition.baseTrustUrl.encrypted = false;
      const res = {
        collectorConfig: {
          heartbeatIntervalMillis: 50,
          maxSamplesPerBulkRequest: 10,
          status: 'Running',
        },
        encryptionAlgorithm,
        generatorsAdded: [
          {
            name: 'Core_Trust2_With_Encryption',
            generatorTemplateName: 'refocus-trust1-collector',
            generatorTemplate: thisSgt,
            subjectQuery: 'absolutePath=Parent.Child.*&tags=Primary',
            context: {
              baseTrustUrl: 'https://example.api',
              password: encrypt(password, secret, encryptionAlgorithm),
              token: encrypt(token, secret, encryptionAlgorithm),
            },
            collectors: [{ name: 'agent1' }],
            intervalSecs: 6000,
            token: 'asd123asd',
          },
        ],
      };
      const updatedConfig = listener(null, res);
      const decryptedContext = updatedConfig.generators
        .Core_Trust2_With_Encryption.context;

      expect(decryptedContext)
        .to.have.property('baseTrustUrl', 'https://example.api');
      expect(decryptedContext).to.have.property('password', password);
      expect(decryptedContext).to.have.property('token', token);
      expect(updatedConfig.generators.Core_Trust2_With_Encryption)
        .to.deep.equal(res.generatorsAdded[0]);
      expect(tracker.Core_Trust2_With_Encryption).not.equal(undefined);
      done();
    });

    it('updated generator context with encryption should be decrypted',
    (done) => {
      const res = {
        collectorConfig: {
          heartbeatIntervalMillis: 50,
          maxSamplesPerBulkRequest: 10,
          status: 'Running',
        },
        encryptionAlgorithm,
        generatorsAdded: [
          {
            name: 'Core_Trust3_With_Encryption',
            generatorTemplateName: 'refocus-trust1-collector',
            generatorTemplate: {
              name: 'refocus-trust1-collector',
              connection: {
                url: 'http://www.google.com',
                bulk: true,
              },
              contextDefinition: {
                password: {
                  encrypted: true,
                },
                token: {
                  encrypted: true,
                },
                baseTrustUrl: {
                  encrypted: false,
                },
              },
            },
            subjectQuery: 'absolutePath=Parent.Child.*&tags=Primary',
            context: {
              baseTrustUrl: 'https://example.api',
              password: encrypt(password, secret, encryptionAlgorithm),
              token: encrypt(token, secret, encryptionAlgorithm),
            },
            collectors: [{ name: 'agent1' }],
            intervalSecs: 6000,
            token: 'asd123asd',
          },
        ],
      };
      listener(null, res);
      const newPassword = 'newPassword';
      const newToken = 'newToken';
      hbResponse.generatorsUpdated = [
        {
          name: 'Core_Trust3_With_Encryption',
          generatorTemplateName: 'refocus-trust1-collector',
          generatorTemplate: {
            name: 'refocus-trust1-collector',
            connection: {
              url: 'http://www.google.com',
              bulk: true,
            },
            contextDefinition: {
              password: {
                encrypted: true,
              },
              token: {
                encrypted: true,
              },
              baseTrustUrl: {
                encrypted: false,
              },
            },
          },
          subjectQuery: 'absolutePath=Parent.Child.*&tags=Primary',
          context: {
            baseTrustUrl: 'https://example.api.v2',
            password: encrypt(newPassword, secret, encryptionAlgorithm),
            token: encrypt(newToken, secret, encryptionAlgorithm),
          },
          collectors: [{ name: 'agent2' }],
          intervalSecs: 6,
          token: 'asd123asd',
        },
      ];
      hbResponse.generatorsAdded = [];
      const updatedConfig = listener(null, hbResponse);
      expect(updatedConfig.generators.Core_Trust3_With_Encryption.context)
        .to.deep.equal({ baseTrustUrl: 'https://example.api.v2',
          password: newPassword, token: newToken, });
      expect(tracker.Core_Trust3_With_Encryption).not.equal(null);
      done();
    });

    it('when context is updated from encryption = false to encryption = ' +
      'true, decryption should happen', (done) => {
      const res = {
        collectorConfig: {
          heartbeatIntervalMillis: 50,
          maxSamplesPerBulkRequest: 10,
          status: 'Running',
        },
        encryptionAlgorithm,
        generatorsAdded: [
          {
            name: 'Core_Trust4_With_Encryption',
            generatorTemplateName: 'refocus-trust1-collector',
            generatorTemplate: {
              name: 'refocus-trust1-collector',
              connection: {
                url: 'http://www.google.com',
                bulk: true,
              },
              contextDefinition: {
                password: {
                  encrypted: true,
                },
                token: {
                  encrypted: true,
                },
                baseTrustUrl: {
                  encrypted: false,
                },
              },
            },
            subjectQuery: 'absolutePath=Parent.Child.*&tags=Primary',
            context: {
              baseTrustUrl: 'https://example.api',
              password: encrypt(password, secret, encryptionAlgorithm),
              token: encrypt(token, secret, encryptionAlgorithm),
            },
            collectors: [{ name: 'agent1' }],
            intervalSecs: 6,
            token: 'asd123asd',
          },
        ],
      };
      listener(null, res);
      const newPassword = 'newPassword';
      const newToken = 'newToken';
      hbResponse.generatorsUpdated = [
        {
          name: 'Core_Trust4_With_Encryption',
          generatorTemplateName: 'refocus-trust1-collector',
          generatorTemplate: {
            name: 'refocus-trust1-collector',
            connection: {
              url: 'http://www.google.com',
              bulk: true,
            },
            contextDefinition: {
              password: {
                encrypted: false,
              },
              token: {
                encrypted: true,
              },
              baseTrustUrl: {
                encrypted: false,
              },
            },
          },
          subjectQuery: 'absolutePath=Parent.Child.*&tags=Primary',
          context: {
            baseTrustUrl: 'https://example.api.v2',
            password: newPassword,
            token: encrypt(newToken, secret, encryptionAlgorithm),
          },
          collectors: [{ name: 'agent2' }],
          intervalSecs: 6,
          token: 'asd123asd',
        },
      ];
      hbResponse.generatorsAdded = [];
      const updatedConfig = listener(null, hbResponse);
      expect(updatedConfig.generators.Core_Trust3_With_Encryption.context)
        .to.deep.equal({ baseTrustUrl: 'https://example.api.v2',
          password: newPassword, token: newToken, });
      expect(tracker.Core_Trust3_With_Encryption).not.equal(null);
      done();
    });
  });
});
