module.exports = function(jsonFilePath) {
  var data = require(jsonFilePath);
  return data.registryLocation;
};