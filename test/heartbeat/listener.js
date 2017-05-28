/**
 * Copyright (c) 2017, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or
 * https://opensource.org/licenses/BSD-3-Clause
 */

/**
 * test/heartbeat/listner.js
 */
const listener = require('../../src/heartbeat/listener');
const config = require('../../src/config/config');
const repeatTracker = require('../../src/repeater/repeater').repeatTracker;
const expect = require('chai').expect;

describe('test/heartbeat/listner.js >', () => {
  const hbResponse = {
    collectorConfig: {
      refocusHeartBeatTimeout: 50,
    },
    generatorsAdded: [
      {
        name: 'SFDC_Core_Trust1',
        generatorTemplateName: 'refocus-trust1-collector',
        subjectQuery: 'absolutePath=Salesforce.SFDC_Core.*&tags=Pod,Primary',
        context: { baseUrl: 'https://argus-ui.data.sfdc.net', },
        agents: [{ name: 'agent1' }],
        generatorTemplate: {
          name: 'refocus-trust1-collector',
        },
        interval: 6000,
      },
    ],
    generatorsUpdated: [

    ],
    generatorsDeleted: [

    ],
  };

  it('should handle errors passed to the function', (done) => {
    const err = { status: 404,
      description: 'heartbeat not received', };
    const ret = listener.handleHeartbeatResponse(err, hbResponse);

    expect(ret).to.deep.equal(err);
    done();
  });

  it('collector config should be updated', (done) => {
    listener.handleHeartbeatResponse(null, hbResponse);
    expect(config.refocusHeartBeatTimeout)
      .to.equal(hbResponse.collectorConfig.refocusHeartBeatTimeout);
    done();
  });

  it('added generators should be added to the config and the repeat tracker ' +
    'should be setup', (done) => {
    const res = {
      refocusHeartBeatTimeout: 50,
      generatorsAdded: [
        {
          name: 'SFDC_Core_Trust2',
          generatorTemplateName: 'refocus-trust1-collector',
          subjectQuery: 'absolutePath=Salesforce.SFDC_Core.*&tags=Pod,Primary',
          context: { baseUrl: 'https://argus-ui.data.sfdc.net', },
          agents: [{ name: 'agent1' }],
          interval: 6000,
        },
      ],
    };

    listener.handleHeartbeatResponse(null, res);

    expect(config.generators.SFDC_Core_Trust1)
      .to.deep.equal(hbResponse.generatorsAdded[0]);

    expect(repeatTracker.SFDC_Core_Trust1)
      .not.equal(null);

    done();
  });

  it('updated generators should be updated in the config', (done) => {
    const res = {
      refocusHeartBeatTimeout: 50,
      generatorsAdded: [
        {
          name: 'SFDC_Core_Trust3',
          generatorTemplateName: 'refocus-trust1-collector',
          subjectQuery: 'absolutePath=Salesforce.SFDC_Core.*&tags=Pod,Primary',
          context: { baseUrl: 'https://argus-ui.data.sfdc.net', },
          agents: [{ name: 'agent1' }],
          interval: 6000,
        },
      ],
    };
    listener.handleHeartbeatResponse(null, res);
    hbResponse.generatorsUpdated = [
      {
        name: 'SFDC_Core_Trust3',
        interval: 1000,
        context: { baseUrl: 'https://argus-api.data.sfdc.net', },
      },
    ];
    hbResponse.generatorsAdded = [];
    listener.handleHeartbeatResponse(null, hbResponse);
    expect(config.generators.SFDC_Core_Trust3.context)
      .to.deep.equal({ baseUrl: 'https://argus-api.data.sfdc.net', });

    expect(repeatTracker.SFDC_Core_Trust3).not.equal(null);
    done();
  });

  it('deleted generators information should be deleted in the ' +
    ' config', (done) => {
    const res = {
      refocusHeartBeatTimeout: 50,
      generatorsAdded: [
        {
          name: 'SFDC_LIVE_AGENT',
          interval: 6000,
          generatorTemplateName: 'refocus-trust1-collector',
          subjectQuery: 'absolutePath=Salesforce.SFDC_Core.*&tags=Pod,Primary',
          context: { baseUrl: 'https://argus-ui.data.sfdc.net', },
        },
        {
          name: 'SFDC_Core_Trust4',
          interval: 1000,
          context: { baseUrl: 'https://argus-api.data.sfdc.net', },
        },
      ],
    };

    listener.handleHeartbeatResponse(null, res);
    expect(config.generators.SFDC_LIVE_AGENT).to.not.equal(undefined);
    expect(config.generators.SFDC_Core_Trust1).to.not.equal(undefined);
    const resDel = {
      generatorsDeleted: [{ name: 'SFDC_LIVE_AGENT', },
      ],
    };

    listener.handleHeartbeatResponse(null, resDel);
    expect(Object.keys(repeatTracker)).to.contain('SFDC_Core_Trust4');
    expect(config.generators.SFDC_Core_Trust4).to.not.equal(undefined);
    expect(repeatTracker.SFDC_LIVE_AGENT).equal(undefined);
    expect(config.generators.SFDC_LIVE_AGENT).to.equal(undefined);
    done();
  });
});
