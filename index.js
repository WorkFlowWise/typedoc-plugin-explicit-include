var plugin = require('./plugin');
module.exports = function(PluginHost) {
  var app = PluginHost.owner;

  app.converter.addComponent('explicit-include', plugin.ExplicitIncludePlugin);
};
