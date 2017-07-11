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

/**
 * Returns a string after doing the variable expansion based on the context.
 *
 * @param {String} s - the string to be expanded
 * @param {Object} ctx - the context object with properties to be inserted
 * @returns {String} - the expanded string
 * @throws {ValidationError} - if the string template is invalid or ctx is
 *  missing a property referenced by the string template
 */
function expand(s, ctx) {
  debug(`expand(${s}, ${ctx})`);
  const matches = s.match(/{{[^\s{}]+?}}/g); // match {{...}}
  let expanded = s;
  if (!Array.isArray(matches)) {
    return expanded;
  }

  matches.forEach((match) => {
    const key = match.match(/{{(.+)}}/)[1]; // extract "..." from "{{...}}"
    const value = ctx[key];
    if (value === null || value === undefined) {
      throw new errors.ValidationError(
        `Can't expand string: No property '${key}' in context`);
    }

    expanded = expanded.replace(match, value);
  });

  if (expanded.match(/[{}]/)) { // there are braces that were not replaced
    throw new errors.ValidationError(
      `Can't expand string: Invalid string template: ${s}`);
  }

  debug(`expand returning ${expanded}`);
  return expanded;
}

module.exports = {
  expand,
};
