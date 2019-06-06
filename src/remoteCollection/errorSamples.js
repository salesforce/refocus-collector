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
const debug =
  require('debug')('refocus-collector:remoteCollection:errorSamples');
const { maxMessageBodyLength } = require('../constants');

module.exports = (name, aspects, subjects, messageBody) => {
  debug('errorSamples', name, messageBody);
  if (messageBody.length > maxMessageBodyLength) {
    messageBody = messageBody.slice(0, maxMessageBodyLength - 3) + '...';
  }

  const samples = [];
  aspects.forEach((a) => {
    subjects.forEach((s) => {
      samples.push({
        name: `${s.absolutePath}|${a.name}`,
        messageCode: 'ERROR',
        messageBody,
        value: 'ERROR',
      });
    });
  });
  return samples;
};
