/**
 * Copyright (c) 2017, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or
 * https://opensource.org/licenses/BSD-3-Clause
 */

/**
 * src/utils/schema.js
 */
const Joi = require('joi');

const repeater = Joi.object().keys({
  name: Joi.string().required(),
  interval: Joi.number().integer().positive(), // TODO define min/max!
  func: Joi.func().required(),
  onSuccess: Joi.func(),
  onFailure: Joi.func(),
  onProgress: Joi.func(),
  bulk: Joi.boolean(),
  subjects: Joi.array().min(1).items(Joi.object()),
  handle: Joi.any(),
  funcName: Joi.string(),
});

const sample = Joi.object().keys({
  name: Joi.string().regex(/^[0-9A-Za-z_.\\-]{1,4096}\|[0-9A-Za-z_\\-]{1,60}$/)
    .required(),
  messageBody: Joi.string().max(4096).allow(''),
  messageCode: Joi.string().max(5).allow(''),
  relatedLinks: Joi.array().items(
    Joi.object().keys({
      name: Joi.string().regex(/^[0-9A-Za-z_\\ -]{1,25}$/).required(),
      url: Joi.string().min(1).max(4096).required(),
    })
  ),
  value: Joi.string().max(255),
});

const registry = Joi.object().keys({
  name: Joi.string().max(60).required(),
  host: Joi.string().max(4096),
  ipAddress: Joi.string().max(60),
  description: Joi.string().max(4096),
  refocusInstances: Joi.object(),
});

const refocusInstance = Joi.object().keys({
  name: Joi.string().max(60),
  url: Joi.string().regex(/((([A-Za-z]{3,9}:(?:\/\/)?)(?:[\-;:&=\+\$,\w]+@)?[A-Za-z0-9\.\-]+|(?:www\.|[\-;:&=\+\$,\w]+@)[A-Za-z0-9\.\-]+)((?:\/[\+~%\/\.\w\-]*)?\??(?:[\-\+=&;%@\.\w]*)#?(?:[\.\!\/\\\w]*))?)/g).required(),  // jscs:ignore maximumLineLength
  token: Joi.string().required(),
});

module.exports = {
  repeater,
  sample,
  refocusInstance,
  registry,
};
