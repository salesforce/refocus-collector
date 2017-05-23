/**
 * Copyright (c) 2017, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or
 * https://opensource.org/licenses/BSD-3-Clause
 */

/**
 * api/v1/coreErrors.js
 *
 * Core Error Definitions
 */
'use strict';

const coreErrors = require('errors');
coreErrors.create({
  name: 'CollectorCoreError',
});

// ----------------------------------------------------------------------------
// Validation Errors
// ----------------------------------------------------------------------------

coreErrors.create({
  name: 'ValidationError',
  status: 400,
  parent: coreErrors.CollectorCoreError,
});

// ----------------------------------------------------------------------------
// Not Found
// ----------------------------------------------------------------------------
//

coreErrors.create({
  name: 'ResourceNotFoundError',
  status: 404,
  parent: coreErrors.CollectorCoreError,
});

// ----------------------------------------------------------------------------

module.exports = coreErrors;
