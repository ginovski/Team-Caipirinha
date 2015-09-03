/* */ 
(function(Buffer) {
  var path = require("path");
  var serveFavicon = require("serve-favicon");
  var defaultPath = path.join(__dirname, '..', 'public', 'favicon.ico');
  module.exports = function favicon(path, options) {
    path = path || defaultPath;
    return serveFavicon(path, options);
  };
})(require("buffer").Buffer);
