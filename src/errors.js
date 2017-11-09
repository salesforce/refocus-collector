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
  name: 'TemplateVariableSubstitutionError',
  defaultExplanation: 'Invalid template for variable substitution.',
  defaultResponse: 'Invalid template for variable substitution.',
  status: 400,
  parent: errors.SampleGeneratorTemplateError,
});

module.exports = errors;
