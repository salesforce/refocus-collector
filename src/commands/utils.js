const conf = require('../config/config');
const constants = require('../constants');

function setRegistryAndParseCommand(program, collectorObject) {
  try {
     conf.setRegistry(collectorObject || constants.registryLocation);
     program.parse(process.argv);
   } catch (err) {
     logger.error(err.message);
     logger.error(err);
   }
}

module.exports = {
  setRegistryAndParseCommand,
}