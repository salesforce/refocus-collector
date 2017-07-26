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

const sample = Joi.object().keys({
  name: Joi.string().regex(/^[0-9A-Za-z_\\-]{1,4096}\|[0-9A-Za-z_\\-]{1,60}$/)
    .required(),
  messageBody: Joi.string().max(4096),
  messageCode: Joi.string().max(5),
  relatedLinks: Joi.array().items(
    Joi.object().keys({
      name: Joi.string().regex(/^[0-9A-Za-z_\\ -]{1,25}$/).required(),
      url: Joi.string().min(1).max(4096).required(),
    })
  ),
  value: Joi.string().max(255),
});

module.exports = {
  sample,
};
