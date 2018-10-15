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
const urlRegex = /((([A-Za-z]{3,9}:(?:\/\/)?)(?:[\-;:&=\+\$,\w]+@)?[A-Za-z0-9\.\-]+|(?:www\.|[\-;:&=\+\$,\w]+@)[A-Za-z0-9\.\-]+)((?:\/[\+~%\/\.\w\-]*)?\??(?:[\-\+=&;%@\.\w]*)#?(?:[\.\!\/\\\w]*))?)/g; // jscs:ignore maximumLineLength

const repeater = Joi.object().keys({
  name: Joi.string().required(),
  interval: Joi.number().integer().positive(), // TODO define min/max!
  func: Joi.func().required(),
  onFailure: Joi.func(),
  onProgress: Joi.func(),
  bulk: Joi.boolean(),
});

const refocusInstance = Joi.object().keys({
  name: Joi.string().max(60),
  url: Joi.string().regex(urlRegex).required(),
  token: Joi.string().required(),
});

module.exports = {
  repeater,
  refocusInstance,
};
