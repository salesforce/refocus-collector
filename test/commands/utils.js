/**
 * Copyright (c) 2018, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or
 * https://opensource.org/licenses/BSD-3-Clause
 */

/**
 * test/command/utils.js
 */
'use strict'; // eslint-disable-line strict
const expect = require('chai').expect;
const configModule = require('../../src/config/config');
const cmdUtils = require('../../src/commands/utils');

describe('test/commands/utils >', () => {
  describe('validateArgs >', () => {
    it('ok, valid args', (done) => {
      const args = {
        collectorName: 'myCollector1',
        refocusUrl: 'https://refocusUrl-cmdUtils.test',
        accessToken: 't06k3n',
      };

      expect(cmdUtils.validateArgs(args)).to.equal(true);
      done();
    });

    it('ok, valid with other optional arguments', () => {
      const args = {
        collectorName: 'myCollector1',
        refocusUrl: 'https://refocusUrl-cmdUtils.test',
        accessToken: 't06k3n',
        refocusProxy: 'http://refocusproxy.pxy',
        dataSourceProxy: 'http://datasourceproxy.pxy',
      };

      expect(cmdUtils.validateArgs(args)).to.equal(true);
    });

    it('invalid, empty args', () => {
      const args = { };
      expect(cmdUtils.validateArgs(args)).to.equal(false);
    });

    it('invalid, no name', () => {
      const args = {
        refocusUrl: 'https://refocusUrl-cmdUtils.test',
        accessToken: 't06k3n',
      };

      expect(cmdUtils.validateArgs(args)).to.equal(false);
    });

    it('invalid, no refocusUrl', () => {
      const args = {
        collectorName: 'myCollector1',
        accessToken: 't06k3n',
      };

      expect(cmdUtils.validateArgs(args)).to.equal(false);
    });

    it('invalid, no accessToken', () => {
      const args = {
        collectorName: 'myCollector1',
        refocusUrl: 'https://refocusUrl-cmdUtils.test',
      };

      expect(cmdUtils.validateArgs(args)).to.equal(false);
    });
  });

  describe('setupConfig >', () => {
    it('without proxy', () => {
      const args = {
        collectorName: 'myCollector1',
        refocusUrl: 'https://refocusUrl-cmdUtils.test',
        accessToken: 't06k3n',
      };

      cmdUtils.setupConfig(args);
      const config = configModule.getConfig();
      expect(config.name).equal(args.collectorName);
      expect(config.refocus.url).equal(args.refocusUrl);
      expect(config.refocus.accessToken).equal(args.accessToken);
      expect(config.refocus.proxy).equal(undefined);
      expect(config.dataSourceProxy).equal(undefined);
    });

    it('with proxy', () => {
      const args = {
        collectorName: 'myCollector1',
        refocusUrl: 'https://refocusUrl-cmdUtils.test',
        accessToken: 't06k3n',
        refocusProxy: 'http://refocusproxy.pxy',
        dataSourceProxy: 'http://datasourceproxy.pxy',
      };

      cmdUtils.setupConfig(args);
      const config = configModule.getConfig();
      expect(config.name).equal(args.collectorName);
      expect(config.refocus.url).equal(args.refocusUrl);
      expect(config.refocus.accessToken).equal(args.accessToken);
      expect(config.refocus.proxy).equal(args.refocusProxy);
      expect(config.dataSourceProxy).equal(args.dataSourceProxy);

      /*
       * make sure setupConfig also initializes the config with the collector
       * metadata
       */
      expect(Object.keys(config.metadata))
        .to.include.members(['osInfo', 'processInfo', 'version']);
    });
  });
});
