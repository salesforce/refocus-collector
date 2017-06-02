/**
 * Copyright (c) 2017, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or
 * https://opensource.org/licenses/BSD-3-Clause
 */

/**
 * ./src/constants.js
 *
 * Constants
 */

module.exports = {
  // registry json file location
  localRegistryLocation: './registry.json',

  // bulk upsert path, use with refocus url
  bulkUpsertPath: '/v1/samples/upsert/bulk',

  // exported for the purpose of testing
  mockRegistryLocation: './test/config/testRegistry.json',
};
