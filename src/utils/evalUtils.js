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
const logger = require('winston');
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
 * and subject and subjects directly, without having to refer to them as
 * attribtues of args.
 */
const transformFnPrefix = 'const ctx = args.context; ' +
  'const res = args.res; ' +
  'const aspects = args.apsects; ' +
  'const subject = args.subject; ' +
  'const subjects = args.subjects; ' +
  'const SAMPLE_BODY_MAX_LEN = args._SAMPLE_BODY_MAX_LEN; ';

/*
 * This makes it possible for the toUrl function to refer to ctx and subject
 * and subjects directly, without having to refer to them as attribtues of
 * args.
 */
const toUrlFnPrefix = 'const ctx = args.context; ' +
  'const aspects = args.apsects; ' +
  'const subject = args.subject; ' +
  'const subjects = args.subjects; ';

/**
 * Safely execute the transform or toUrl code from the sample generator
 * template, blocking certain global functions and node functions, and
 * returning the result of the eval. No access to globals.
 *
 * @param {String} functionBody - The body of the function to execute.
 * @param {Object} args - Args to pass through to the function.
 * @returns {AnyType}
 * @throws {FunctionBodyError} - if functionBody cannot be evaluated
 */
function safeEval(functionBody, args) {
  'use strict';
  if (!args) {
    args = {};
  }

  /*
   * Make sure user-provided function can't mess with console, process or eval
   * but *can* use JSON object.
   */
  args._JSON = JSON;
  functionBody = 'const console = undefined; ' +
    'const process = undefined; ' +
    'const eval = undefined; ' +
    'const JSON = args._JSON; ' +
    functionBody;
  debug('safeEval functionBody', functionBody);
  try {
    /*
     * TODO generate the fn only once upon receiving the generator, store
     *  the generated func as part of the generator config in the config
     */
    const func = new Function(`return function(args) { ${functionBody} }`)();
    debug(`evalUtils.newSafeEval generated function: ${func}`);
    debug(`evalUtils.newSafeEval calling function with args: ${args}`);
    const retval = func(args);
    debug(`evalUtils.safeEval returning: ${retval}`);
    return retval;
  } catch (err) {
    logger.error('safeEval error', err);
    throw new errors.FunctionBodyError(`${err.name}: ${err.message}`);
  }
}

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

  return evalValidation.isObject('ctx', args.context) &&
    evalValidation.isObject('res', args.res) &&
    evalValidation.aspects(args.aspects) &&
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

  return evalValidation.isObject('ctx', args.context) &&
    evalValidation.aspects(args.aspects) &&
    evalValidation.subjects(args.subject, args.subjects);
} // validateToUrlArgs

/**
 * Validate the sample for these conditions:
 * 1) Number of samples > no. of subjects * no. of aspects.
 * 2) Sample aspect is in aspect array given in generator.
 * 3) Sample subject is in subjects provided in generator.
 * 4) No duplicates samples.
 * @param  {Array} sampleArr - Sample array
 * @param  {Object} generator - Generator object
 */
function validateSamples(sampleArr, generator) {
  const subjectArr = []; // array of subject absolute paths
  const aspectArr = []; // array of aspect names

  // create subject array
  if (generator.subjects) {
    generator.subjects.forEach((s) => {
      subjectArr.push(s.absolutePath.toLowerCase());
    });
  } else if (generator.subject) {
    subjectArr.push(generator.subject.absolutePath.toLowerCase());
  } else {
    throw new errors.ValidationError(
      'Generator should have subject/subjects attribute.'
    );
  }

  // create aspect array, generator will have aspects attribute always
  generator.aspects.forEach((a) => {
    aspectArr.push(a.name.toLowerCase());
  });

  // no of samples should not exceed the (no. of subjects * the no. of aspects)
  if (sampleArr.length > subjectArr.length * aspectArr.length) {
    throw new errors.ValidationError('Number of samples more than expected. ' +
      `Samples count: ${sampleArr.length}, Subjects count: ` +
      `${subjectArr.length}, Aspects count: ${aspectArr.length}`);
  }

  const uniqueSamples = new Set();
  sampleArr.forEach((samp) => {
    const sampName = samp.name;
    const sampNameLowerCase = sampName.toLowerCase();

    // check for duplicate samples
    if (uniqueSamples.has(sampNameLowerCase)) {
      throw new errors.ValidationError(
        `Duplicate sample found: ${sampNameLowerCase}`
      );
    }

    uniqueSamples.add(sampNameLowerCase);

    // Check that samples corresponds to only the subjects and aspects passed in
    const subAspArr = sampNameLowerCase.split('|');
    if (subAspArr.length === 2) {
      const subjName = subAspArr[0];
      const aspName = subAspArr[1];
      if ((!subjectArr.includes(subjName)) || (!aspectArr.includes(aspName))) {
        throw new errors.ValidationError(
          `Unknown subject or aspect for sample: ${sampName}`
        );
      }
    } else {
      throw new errors.ValidationError(`Invalid sample name: ${sampName}`);
    }
  });
} // validateSamples

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
 *  {Array} aspects - Array of one or more aspects.
 *  {Array} subjects - If bulk, this is an array of subject; if not bulk, this
 *    is null or undefined.
 *  {Object} subject - If not bulk, this is the subject; if bulk, this is null
 *    or undefined.
 *  {Array} subjects - If bulk, this is an array of subject; if not bulk, this
 *    is null or undefined.
 *  {Array} aspects - An array of aspects.
 * @returns {Array} - Array of zero or more samples.
 * @throws {TransformError} - if transform function does not return an array
 *  of zero or more samples
 * @throws {ArgsError} - if thrown by validateTransformArgs function
 * @throws {FunctionBodyError} - if thrown by safeEval function
 */
function safeTransform(functionBody, args) {
  debug('Entered evalUtils.safeTransform');
  validateTransformArgs(args);
  args._SAMPLE_BODY_MAX_LEN = SAMPLE_BODY_MAX_LEN;
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

  validateSamples(retval, args);
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
 *  {Array} aspects - Array of one or more aspects.
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
  validateSamples, // exporting for testability
};
