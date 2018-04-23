/**
 * Copyright (c) 2017, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or
 * https://opensource.org/licenses/BSD-3-Clause
 */

/**
 * /test/mockedResponse.js
 */

const bulkUpsertPostOk = {
  status: 'OK',
  jobId: 12345,
};

const bulkUpsertPostError = {
  errors: [
    {
      message: 'Missing required property: name',
      source: '0',
      value: '',
      type: 'SCHEMA_VALIDATION_FAILED',
      description: 'An observation of a particular aspect for a ' +
        'particular subject at a particular point in time.\n',
    },
  ],
};

const foundSubjects = [
  {
    absolutePath: 'NorthAmerica.Canada.Ontario',
    name: 'Ontario',
    isPublished: true,
    tags: ['Province', 'English'],
  },
  {
    absolutePath: 'NorthAmerica.Canada.Quebec',
    name: 'Quebec',
    isPublished: true,
    tags: ['Province', 'French'],
  },
];

module.exports = {
  bulkUpsertPostError,
  bulkUpsertPostOk,
  foundSubjects,
};
