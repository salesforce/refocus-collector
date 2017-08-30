/**
 * Copyright (c) 2017, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or
 * https://opensource.org/licenses/BSD-3-Clause
 */

/**
 * src/utils/evalValidation.js
 */
const debug = require('debug')('refocus-collector:evalUtils');
const errors = require('../errors');

function isObject(name, val) {
  debug('Entered evalValidation.isObject:', name, val);
  if (val === undefined || val === null) {
    throw new errors.ArgsError(`Missing "${name}" attribute.`);
  }

  if (typeof val !== 'object' || Array.isArray(val)) {
    throw new errors.ArgsError(`"${name}" attribute must be an object.`);
  }

  return true;
} // isObject

module.exports = {
  isObject,

  aspects: (aspects) => {
    debug('Entered evalValidation.aspects:', aspects);
    if (!aspects) {
      throw new errors.ArgsError('Must include an "aspects" attribute.');
    }

    if (!Array.isArray(aspects) || aspects.length < 1) {
      throw new errors.ArgsError('"aspects" attribute must be an array of ' +
        'one or more aspects.');
    }

    aspects.forEach((a, n) => {
      isObject(`aspects[${n}]`, a);
      if (typeof a.name !== 'string' || !a.name.length ||
      typeof a.timeout !== 'string' || !a.timeout.length) {
        throw new errors.ArgsError('Every element in the "aspects" array ' +
          'must be a valid aspect.');
      }
    });

    return true;
  }, // aspects

  /**
   * Validates the subject/subjects args.
   *
   * @param {Array} subjects - An array of one or more subjects.
   * @returns {Boolean} - true if ok
   * @throws {ArgsError} - If missing or incorrect type
   */
  subjects: (subjects) => {
    debug('Entered evalValidation.subjects:', subjects);
    if (!subjects || !Array.isArray(subjects) || subjects.length < 1) {
      throw new errors.ArgsError('Must include a "subjects" attribute with ' +
        'an array of one or more subjects.');
    }

    subjects.forEach((subj, n) => {
      isObject(`subjects[${n}]`, subj);
      if (typeof subj.absolutePath !== 'string') {
        throw new errors.ArgsError('Every element in the "subjects" array ' +
          'must be a valid subject.');
      }
    });

    return true;
  }, // subjects
};
