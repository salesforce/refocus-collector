/**
 * Copyright (c) 2017, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or
 * https://opensource.org/licenses/BSD-3-Clause
 */

/**
 * src/remoteCollection/errorSamples.js
 */
const debug = require('debug')
  ('refocus-collector:remoteCollection:errorSamples');

module.exports = (collectResponse, messageBody) => {
  debug('errorSamples', collectResponse.name, messageBody);
  const samples = [];
  collectResponse.aspects.forEach((a) => {
    collectResponse.subjects.forEach((s) => {
      const relatedLinks = [
        {
          name: 'Sample Generator',
          url: collectResponse.apiLinks.GET,
        },
      ];
      if (collectResponse.generatorTemplate.repository.url) {
        relatedLinks.push({
          name: 'Sample Generator Template',
          url: collectResponse.generatorTemplate.repository.url,
        });
      }

      samples.push({
        name: `${s.absolutePath}|${a.name}`,
        messageCode: 'ERROR',
        messageBody,
        value: 'ERROR',
        relatedLinks,
      });
    });
  });
  return samples;
};
