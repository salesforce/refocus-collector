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
const evalValidation = require('./evalValidation');
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
  },
};
const SAMPLE_BODY_MAX_LEN = 4096;

/*
 * This makes it possible for the transform function to refer to ctx and res
 * and subject and subjects and JSON directly, without having to refer to them
 * as attribtues of args.
 */
const transformFnPrefix = 'const JSON = args._JSON; ' +
  'const ctx = args.ctx; ' +
  'const res = args.res; ' +
  'const subject = args.subject; ' +
  'const subjects = args.subjects; ' +
  'const SAMPLE_BODY_MAX_LEN = args._SAMPLE_BODY_MAX_LEN; ' +
  'const Math = args._Math;';

/*
 * This makes it possible for the toUrl function to refer to ctx and subject
 * and subjects and JSON directly, without having to refer to them as
 * attribtues of args.
 */
const toUrlFnPrefix = 'const JSON = args._JSON; ' +
  'const ctx = args.ctx; ' +
  'const subject = args.subject; ' +
  'const subjects = args.subjects; ';

/**
 * Modifies the "args" object. Gives the function body access to JSON.parse
 * and JSON.stringify by adding them to the args. The defn of these functions
 * comes from https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON#Polyfill.
 *
 * @param {Object} args - The arguments to pass to the function
 */
function addJson(args) {
  args._JSON = {
    parse: (s) => eval(`(${s})`),
    stringify: (function () {
      var toString = Object.prototype.toString;
      var isArray = Array.isArray || function (a) {
        return toString.call(a) === '[object Array]';
      };

      var escMap = {
        '"': '\\"',
        '\\': '\\\\',
        '\b': '\\b',
        '\f': '\\f',
        '\n': '\\n',
        '\r': '\\r',
        '\t': '\\t',
      };
      var escFunc = (m) => escMap[m] || '\\u' +
        (m.charCodeAt(0) + 0x10000).toString(16).substr(1);
      var escRE = /[\\"\u0000-\u001F\u2028\u2029]/g;
      return function stringify(value) {
        if (value == null) {
          return 'null';
        } else if (typeof value === 'number') {
          return isFinite(value) ? value.toString() : 'null';
        } else if (typeof value === 'boolean') {
          return value.toString();
        } else if (typeof value === 'object') {
          if (typeof value.toJSON === 'function') {
            return stringify(value.toJSON());
          } else if (isArray(value)) {
            var res = '[';
            for (let i = 0; i < value.length; i++)
              res += (i ? ', ' : '') + stringify(value[i]);
            return res + ']';
          } else if (toString.call(value) === '[object Object]') {
            var tmp = [];
            for (const k in value) {
              if (value.hasOwnProperty(k)) {
                tmp.push(stringify(k) + ': ' + stringify(value[k]));
              }
            }

            return `{${tmp.join(', ')}}`;
          }
        }

        return `"${value.toString().replace(escRE, escFunc)}"`;
      };
    })(),
  };
} // addMoreArgs

/**
 * Safely execute the transform or toUrl code from the sample generator
 * template, blocking certain global functions and node functions, and
 * returning the result of the eval (in the case of transform, an array of
 * samples; in the case of toUrl, a url string). No access to globals.
 *
 * @param {String} functionBody - The body of the function to execute.
 * @param {Object} args - Args to pass through to the function.
 * @returns {AnyType}
 * @throws {FunctionBodyError} - if functionBody cannot be evaluated
 */
function safeEval(functionBody, args) {
  'use strict';
  try {
    /*
     * TODO generate the fn only once upon receiving the generator, store
     *  the generated func as part of the generator config in the config
     */
    const func = notevil.Function('args', functionBody);
    debug(`evalUtils.safeEval generated function: ${func}`);
    debug(`evalUtils.safeEval calling function with args: ${args}`);
    const retval = func(args);
    debug(`evalUtils.safeEval returning: ${retval}`);
    return retval;
  } catch (err) {
    throw new errors.FunctionBodyError(`${err.name}: ${err.message}`);
  }
} // safeEval

/**
 * Makes sure that the args contain all the expected attributes.
 *
 * @param {Object} args - An object containing the required args
 * @returns {Boolean} - true if args ok
 * @throws {ArgsError} - If args missing or incorrect type
 */
function validateTransformArgs(args) {
  debug('Entered evalUtils.validateTransformArgs:', args);
  if (!args) {
    throw new errors.ArgsError('Missing args.');
  }

  if (typeof args !== 'object' || Array.isArray(args)) {
    throw new errors.ArgsError('args must be an object.');
  }

  return evalValidation.isObject('ctx', args.ctx) &&
    evalValidation.isObject('res', args.res) &&
    evalValidation.subjects(args.subject, args.subjects);
} // validateTransformArgs

/**
 * Makes sure that the args contain all the expected attributes.
 *
 * @param {Object} args - An object containing the required args
 * @returns {Boolean} - true if args ok
 * @throws {ArgsError} - If args missing or incorrect type
 */
function validateToUrlArgs(args) {
  debug('Entered evalUtils.validateToUrlArgs:', args);
  if (!args) {
    throw new errors.ArgsError('Missing args.');
  }

  if (typeof args !== 'object' || Array.isArray(args)) {
    throw new errors.ArgsError('args must be an object.');
  }

  return evalValidation.isObject('ctx', args.ctx) &&
    evalValidation.subjects(args.subject, args.subjects);
} // validateToUrlArgs

/**
 * Safely executes the transform function with the arguments provided.
 *
 * @param {String} functionBody - The transform function body as provided by
 *  the sample generator template. The function body may refer to the args ctx,
 *  res, subject and subjects directly.
 * @param {Object} args - An object containing the following attributes:
 *  {Object} ctx - The sample generator context.
 *  {Object} res - The response object returned by calling the remote data
 *    source.
 *  {Object} subject - If not bulk, this is the subject; if bulk, this is null
 *    or undefined.
 *  {Array} subjects - If bulk, this is an array of subject; if not bulk, this
 *    is null or undefined.
 * @returns {Array} - Array of zero or more samples.
 * @throws {TransformError} - if transform function does not return an array
 *  of zero or more samples
 * @throws {ArgsError} - if thrown by validateTransformArgs function
 * @throws {FunctionBodyError} - if thrown by safeEval function
 */
function safeTransform(functionBody, args) {
  debug('Entered evalUtils.safeTransform');
  validateTransformArgs(args);
  addJson(args);
  args._SAMPLE_BODY_MAX_LEN = SAMPLE_BODY_MAX_LEN;
  args._Math = Math;
  const retval = safeEval(transformFnPrefix + functionBody, args);
  if (!Array.isArray(retval)) {
    throw new errors.TransformError(ERROR_MESSAGE.TRANSFORM.NOT_ARRAY);
  }

  retval.forEach((element) => {
    if (typeof element !== 'object' || Array.isArray(element)) {
      throw new errors.TransformError(ERROR_MESSAGE.TRANSFORM
        .ELEMENT_NOT_OBJECT);
    }

    if (typeof element.name !== 'string') {
      throw new errors.TransformError(ERROR_MESSAGE.TRANSFORM.NO_ELEMENT_NAME);
    }
  });

  debug('evalUtils.safeTransform returning: ${retval}');
  return retval;
}

/**
 * Safely executes the toUrl function with the arguments provided.
 *
 * @param {String} functionBody - The toUrl function body as provided by the
 *  sample generator template.
 * @param {Object} args - An object containing the following attributes:
 *  {Object} ctx - The sample generator context.
 *  {Object} subject - If not bulk, this is the subject; if bulk, this is null
 *    or undefined.
 *  {Array} subjects - If bulk, this is an array of subject; if not bulk, this
 *    is null or undefined.
 * @returns {String} - The generated url as a string
 * @throws {ToUrlError} - if transform function does not return an array
 *  of zero or more samples
 * @throws {ArgsError} - if thrown by validateToUrlArgs function
 * @throws {FunctionBodyError} - if thrown by safeEval function
 */
function safeToUrl(functionBody, args) {
  debug('Entered evalUtils.safeToUrl');
  validateToUrlArgs(args);
  addJson(args);
  const retval = safeEval(toUrlFnPrefix + functionBody, args);
  if (typeof retval !== 'string') {
    throw new errors.ToUrlError(ERROR_MESSAGE.TO_URL.NOT_STRING);
  }

  debug('evalUtils.safeToUrl returning: ${retval}');
  return retval;
}

module.exports = {
  safeEval, // exporting for testability
  safeToUrl,
  safeTransform,
  validateTransformArgs, // exporting for testability
  validateToUrlArgs, // exporting for testability
};
