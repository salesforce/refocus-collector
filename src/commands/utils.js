const conf = require('../config/config');
const logger = require('winston');

/**
 *
 */
function setRegistryAndParseCommand(program, collectorObject) {
  try {
     conf.setRegistry(collectorObject);
     program.parse(process.argv);
   } catch (err) {
     logger.error(err.message);
     logger.error(err);
   }
}

module.exports = {
  setRegistryAndParseCommand,
}