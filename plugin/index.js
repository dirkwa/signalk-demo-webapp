const path = require('path')

module.exports = function (app) {
  // SK server discovers and serves dist/ automatically
  // via the signalk-webapp keyword in package.json.
}

module.exports.metadata = {
  name: 'demo-webapp',
  description: 'SignalK server API demonstration webapp',
  version: require('../package.json').version,
}
