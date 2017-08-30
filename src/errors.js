/**
 * Copyright (c) 2017, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or
 * https://opensource.org/licenses/BSD-3-Clause
 */

/**
 * /src/errors.js
 *
 * Error Definitions
 */
'use strict';
const errors = require('errors');

errors.create({ name: 'CollectorError' });
errors.create({ name: 'SampleGeneratorError' });
errors.create({ name: 'SampleGeneratorTemplateError' });

errors.create({
  name: 'ValidationError',
  status: 400,
  parent: errors.CollectorError,
});

errors.create({
  name: 'ResourceNotFoundError',
  status: 404,
  parent: errors.CollectorError,
});

errors.create({
  name: 'FunctionBodyError',
  defaultExplanation: 'The sample generator template provided a function ' +
    'body which attempts to access restricted modules or data.',
  defaultResponse: 'Fix the sample generator template. The function may not ' +
    'access node.js modules, global variables, "process", "console", ' +
    '"eval", etc.',
  status: 400,
  parent: errors.CollectorError,
});

errors.create({
  name: 'TransformError',
  defaultExplanation: 'The sample generator template provided a "transform" ' +
   'body which does not return an array of samples.',
  defaultResponse: 'Fix the sample generator template. The "transform" ' +
    'function must return an array of zero or more samples.',
  status: 400,
  parent: errors.FunctionBodyError,
});

errors.create({
  name: 'ToUrlError',
  defaultExplanation: 'The sample generator template provided a "toUrl" ' +
   'body which does not return a string.',
  defaultResponse: 'Fix the sample generator template. The "toUrl" ' +
    'function must return a string.',
  status: 400,
  parent: errors.FunctionBodyError,
});

errors.create({
  name: 'ArgsError',
  defaultExplanation: 'Invalid args supplied to the "transform" or "toUrl" ' +
    'function.',
  defaultResponse: 'Transform args must contain a "ctx" attribute of type ' +
    'object, a "res" attribute of type object, and either a "subject" ' +
    'attribute (object) or a "subjects" attribute (array). ToUrl args must ' +
    'contain a "ctx" attribute of type object, and either a "subject" ' +
    'attribute (object) or a "subjects" attribute (array).',
  status: 400,
  parent: errors.FunctionBodyError,
});

errors.create({
  name: 'TemplateVariableSubstitutionError',
  defaultExplanation: 'Invalid template for variable substitution.',
  defaultResponse: 'Invalid template for variable substitution.',
  status: 400,
  parent: errors.SampleGeneratorTemplateError,
});

module.exports = errors;
