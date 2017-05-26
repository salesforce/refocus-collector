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
const errors = require('../errors/errors');

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

  /**
   * Validates the subject/subjects args.
   *
   *  {Object} subject - If not bulk, this is the subject; if bulk, this is
   *    null or undefined.
   *  {Array} subjects - If bulk, this is an array of subjects; if not bulk,
   *    this is null or undefined.
   * @returns {Boolean} - true if ok
   * @throws {ArgsError} - If missing or incorrect type
   */
  subjects: (subject, subjects) => {
    debug('Entered evalValidation.subjects:', subject, subjects);
    if ((!subject && !subjects) || (subject && subjects)) {
      throw new errors.ArgsError('Must include EITHER a "subject" attribute ' +
        'OR a "subjects" attribute.');
    }

    if (subject) {
      isObject('subject', subject);
      if (subject.absolutePath === undefined ||
      subject.absolutePath === null ||
      typeof subject.absolutePath !== 'string') {
        throw new errors.ArgsError('"subject" attribute must be a valid ' +
          'subject.');
      }
    }

    if (subjects) {
      if (!Array.isArray(subjects)) {
        throw new errors.ArgsError('"subjects" attribute must be an array.');
      }

      subjects.forEach((subj, n) => {
        isObject(`subjects[${n}]`, subj);
        if (typeof subj.absolutePath !== 'string') {
          throw new errors.ArgsError('Every element in the "subjects" array ' +
            'must be a valid subject.');
        }
      });
    }

    return true;
  }, // subjects
};
