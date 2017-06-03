/**
 * Copyright (c) 2017, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or
 * https://opensource.org/licenses/BSD-3-Clause
 */

/**
 * src/utils/urlUtils.js
 */
'use strict';
const debug = require('debug')('refocus-collector:urlUtils');
const errors = require('../errors/errors');

/**
 * Returns a string after doing the variable expansion based on the context
 * @param {String} url - the url template to be expanded
 * @param {Object} ctx - the context object with properties to be inserted
 * @returns {String} - the expanded url
 * @throws {ValidationError} - if the url template is invalid or ctx is missing a
 * property referenced by the url
 */
function expand(url, ctx) {
  debug(`expand(${url}, ${ctx})`);
  const matches = url.match(/{{[^\s{}]+?}}/g); // match {{...}}
  let expandedUrl = url;
  matches.forEach((match) => {
    const key = match.match(/{{(.+)}}/)[1]; // extract "..." from "{{...}}"
    const value = ctx[key];
    if (value == null) {
      throw new errors.ValidationError(
        `Can't expand url: No property '${key}' in context`);
    }

    expandedUrl = expandedUrl.replace(match, value);
  });

  if (expandedUrl.match(/[{}]/)) { // there are braces that were not replaced
    throw new errors.ValidationError(
      `Can't expand url: Invalid url template: ${url}`);
  }

  debug(`expand returning ${expandedUrl}`);
  return expandedUrl;
}

module.exports = {
  expand,
};
