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
const EVAL_TIMEOUT_MILLIS = 750;
const debug = require('debug')('refocus-collector:evalUtils');
const { VM } = require('vm2');
const logger = require('winston');
const errors = require('../errors');
const evalValidation = require('./evalValidation');
const sampleSchema = require('./schema').sample;
const u = require('./commonUtils');
const ERROR_MESSAGE = {
  TRANSFORM: {
    NOT_ARRAY: 'The transform function must return an array.',
    NOT_OBJECT: 'The transform function must return an object.',
  },
  TO_URL: {
    NOT_STRING: 'The toUrl function must return a string',
  },
};
const SAMPLE_BODY_MAX_LEN = 4096;

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
  debug('safeEval functionBody', functionBody);
  'use strict';
  if (!args) {
    args = {};
  }

  args.eval = undefined; // disable "eval"
  try {
    const vm = new VM({
      timeout: EVAL_TIMEOUT_MILLIS,
      sandbox: args,
    });
    const retval = vm.run(`(() => { ${functionBody} })()`);
    return retval;
  } catch (err) {
    logger.error('%s running safeEval: %s', err.name, err.message);
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

  return evalValidation.isObject('ctx', args.ctx) &&
    evalValidation.isObject('res', args.res) &&
    evalValidation.aspects(args.aspects) &&
    evalValidation.validateSubjectArgs(args);
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

  return evalValidation.isObject('ctx', args.ctx || {}) &&
    evalValidation.aspects(args.aspects) &&
    evalValidation.subjects(args.subjects);
} // validateToUrlArgs

/**
 * Validate the sample for these conditions:
 * 1) Number of samples < no. of subjects * no. of aspects.
 * 2) Sample aspect is in aspect array given in generator.
 * 3) Sample subject is in subjects provided in generator.
 * 4) No duplicates samples.
 * @param  {Array} sampleArr - Sample array
 * @param  {Object} generator - Generator object
 * @throws {TransformError} - if transform function does not return an array
 *  of zero or more samples
 * @throws {ValidationError} - if any of the above mentioned check fails
 */
function validateSamples(sampleArr, generator) {
  debug('Entered evalUtils.validateSamples');
  if (!Array.isArray(sampleArr)) {
    throw new errors.TransformError(ERROR_MESSAGE.TRANSFORM.NOT_ARRAY);
  }

  let subjectArr; // array of subject absolute paths
  let aspectArr; // array of aspect names

  if (generator.subjects) {
    subjectArr = generator.subjects.map(s => s.absolutePath.toLowerCase());
  } else if (generator.subject ) {
    subjectArr = [generator.subject.absolutePath.toLowerCase()];
  } else {
    throw new errors.ValidationError(
      'Generator passed to validateSamples should have "subjects" or "subject"'
    );
  }

  // create aspect array, generator will have aspects attribute always
  aspectArr = generator.aspects.map(a => a.name.toLowerCase());

  // no of samples should not exceed the (no. of subjects * the no. of aspects)
  if (sampleArr.length > subjectArr.length * aspectArr.length) {
    throw new errors.ValidationError('Number of samples more than expected. ' +
      `Samples count: ${sampleArr.length}, Subjects count: ` +
      `${subjectArr.length}, Aspects count: ${aspectArr.length}`);
  }

  const uniqueSamples = new Set();
  sampleArr.forEach((samp) => {
    const val = sampleSchema.validate(samp);
    if (val.error) {
      throw new errors.TransformError(val.error.message);
    }

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
  debug('Sample validation passed; Exiting evalUtils.validateSamples');
} // validateSamples

/**
 * Safely executes the transform function with the arguments provided.
 *
 * @param {String} functionBody - The transform function body as provided by
 *  the sample generator template. The function body may refer to the args ctx,
 *  res and subjects directly.
 * @param {Object} args - An object containing the following attributes:
 *  {Object} ctx - The sample generator context.
 *  {Object} res - The response object returned by calling the remote data
 *    source.
 *  {Array} aspects - Array of one or more aspects.
 *  {Array} subjects - An array of one or more subjects.
 * @returns {Array} - Array of zero or more samples.
 * @throws {ArgsError} - if thrown by validateTransformArgs function
 * @throws {FunctionBodyError} - if thrown by safeEval function or if function
 *  body is not a string
 * @throws {TransformError} - if transform does not return valid array of
 *  samples
 */
function safeTransform(functionBody, args) {
  debug('Entered evalUtils.safeTransform');
  if (typeof functionBody !== 'string') {
    const msg = 'Transform function body must be a string';
    throw new errors.FunctionBodyError(msg);
  }

  validateTransformArgs(args);
  args.SAMPLE_BODY_MAX_LEN = SAMPLE_BODY_MAX_LEN;
  const retval = safeEval(functionBody, args);
  validateSamples(retval, args);
  debug('evalUtils.safeTransform returning %d samples: %j', retval.length,
    retval);
  return retval;
}

/**
 * Prepare arguments to be passed to the transform function
 * @param  {Object} generator - Generator object
 * @throws {TransformError} - if transform function does not return an array
 *  of zero or more samples
 * @throws {ValidationError} - if any of the above mentioned check fails
 */
function prepareTransformArgs(generator) {
  const args = {};

  args.ctx = generator.ctx;
  args.res = generator.res;
  args.aspects = generator.aspects;

  if (u.isBulk(generator)) {
    args.subjects = generator.subjects;
  } else {
    args.subject = generator.subjects[0];
  }

  return args;
}

/**
 * Safely executes the toUrl function with the arguments provided.
 *
 * @param {String} functionBody - The toUrl function body as provided by the
 *  sample generator template.
 * @param {Object} args - An object containing the following attributes:
 *  {Object} ctx - The sample generator context.
 *  {Array} aspects - Array of one or more aspects.
 *  {Array} subjects - Array of one or more subjects.
 * @returns {String} - The generated url as a string
 * @throws {ToUrlError} - if transform function does not return an array
 *  of zero or more samples
 * @throws {ArgsError} - if thrown by validateToUrlArgs function
 * @throws {FunctionBodyError} - if thrown by safeEval function or if function
 *  body is not a string
 */
function safeToUrl(functionBody, args) {
  debug('Entered evalUtils.safeToUrl', args);
  if (typeof functionBody !== 'string') {
    const msg = 'toUrl function body must be a string';
    throw new errors.FunctionBodyError(msg);
  }

  validateToUrlArgs(args);
  const retval = safeEval(functionBody, args);
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
  prepareTransformArgs,
  validateTransformArgs, // exporting for testability
  validateToUrlArgs, // exporting for testability
  validateSamples, // exporting for testability
};
