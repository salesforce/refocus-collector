const program = require('./index').program;
const args = program.args;

const debug = require('debug')('refocus-collector');
const logger = require('winston');
const constants = require('../constants');
const cmdStart = require('./start');
const conf = require('../config/config');

console.log('Start =>', args[0]);
try {
  conf.setRegistry(constants.registryLocation);
  cmdStart.execute();
} catch (err) {
  logger.error(err.message);
  logger.error(err);
}

