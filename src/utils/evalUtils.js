/**
 * Copyright (c) 2017, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or
 * https://opensource.org/licenses/BSD-3-Clause
 */

/**
 * src/utils/evalUtils.js
 */
'use strict';
const debug = require('debug')('refocus-collector:evalUtils');
const notevil = require('notevil');
const errors = require('../errors/errors');
const ERROR_MESSAGE = {
  TRANSFORM: {
    ELEMENT_NOT_OBJECT: 'The transform function must return an array of ' +
      'samples.',
    NO_ELEMENT_NAME: 'The transform function must return an array of ' +
      'samples, and each sample must have a "name" attribute of type string.',
    NOT_ARRAY: 'The transform function must return an array.',
  },
  TO_URL: {
    NOT_STRING: 'The toUrl function must return a string',
  }
};

/**
 * Safely execute the transform or toUrl code from the sample generator
 * template, blocking certain global functions and node functions, and
 * returning the result of the eval (in the case of transform, an array of
 * samples; in the case of toUrl, a url string). No access to globals.
 *
 * @param {String} functionBody - The body of the function to execute.
 * @param {Array} theArgs - Additional args
 * @returns TODO
 * @throws {FunctionBodyError} - if functionBody cannot be evaluated
 */
function safeEval(functionBody, args) {
  'use strict';
  try {
    /*
     * TODO generate the fn only once upon receiving the generator, store
     *  the generated func as part of the generator config in the config
     */
    const func = notevil.Function('ctx', functionBody);
    debug(`safeEval generated function: ${func}`);
    debug(`safeEval calling function with args: ${args}`);
    const retval = func(args);
    debug(`safeEval function returning: ${retval}`);
    return retval;
  } catch (err) {
    throw new errors.FunctionBodyError(`${err.name}: ${err.message}`);
  }
} // safeEval

function safeTransform(functionBody, args) {
  debug('Entered safeTransform');
  const retval = safeEval(functionBody, args);
  if (!Array.isArray(retval)) {
    throw new errors.TransformError(ERROR_MESSAGE.TRANSFORM.NOT_ARRAY);
  }

  retval.forEach((element) => {
    if (typeof element !== 'object') {
      throw new errors.TransformError(ERROR_MESSAGE.TRANSFORM
        .ELEMENT_NOT_OBJECT);
    }

    if (element.name === undefined || typeof element.name !== 'string') {
      throw new errors.TransformError(ERROR_MESSAGE.TRANSFORM.NO_ELEMENT_NAME);
    }
  });

  debug('safeTransform returning: ${retval}');
  return retval;
}

function safeToUrl(functionBody, args) {
  debug('Entered safeToUrl');
  const retval = safeEval(functionBody, args);
  if (typeof retval !== 'string') {
    throw new errors.ToUrlError(ERROR_MESSAGE.TO_URL.NOT_STRING);
  }

  debug('safeToUrl returning: ${retval}');
  return retval;
}

module.exports = {
  safeEval, // exporting this for testability
  safeToUrl,
  safeTransform,
};
