/**
 * Copyright (c) 2017, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or
 * https://opensource.org/licenses/BSD-3-Clause
 */

/**
 * src/remoteCollection/urlUtils.js
 */
'use strict';
const debug = require('debug')('refocus-collector:remoteCollection');
const errors = require('../config/errors');
const template = require('just-template');

/**
 * Returns a string after doing the variable expansion based on the context.
 *
 * @param {String} s - the string to be expanded
 * @param {Object} ctx - the context object with properties to be inserted
 * @returns {String} - the expanded string
 * @throws {TemplateVariableSubstitutionError} - invalid template string
 */
function expand(s, ctx) {
  debug(`expand(${s}, ${ctx})`);
  try {
    const x = template(s, ctx);
    debug(`expand returning ${x}`);
    return x;
  } catch (err) {
    throw new errors.TemplateVariableSubstitutionError(err.message);
  }
}

module.exports = {
  expand,
};
