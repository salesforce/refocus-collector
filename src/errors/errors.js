/**
 * Copyright (c) 2017, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or
 * https://opensource.org/licenses/BSD-3-Clause
 */

/**
 * api/v1/errors.js
 *
 * Error Definitions
 */
'use strict';

const errors = require('errors');
errors.create({
  name: 'CollectorError',
});

// ----------------------------------------------------------------------------
// Validation Errors
// ----------------------------------------------------------------------------

errors.create({
  name: 'ValidationError',
  status: 400,
  parent: errors.CollectorError,
});

// ----------------------------------------------------------------------------
// Not Found
// ----------------------------------------------------------------------------
//

errors.create({
  name: 'ResourceNotFoundError',
  status: 404,
  parent: errors.CollectorError,
});

// ----------------------------------------------------------------------------

module.exports = errors;
