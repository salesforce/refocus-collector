
const conf = require('../src/config/config');
conf.clearConfig();
conf.setRegistry('./test/config/testRegistry.json');

const config = conf.getConfig();

module.exports = {
  config,
};
