/* */ 
var deprecate = require("depd")('connect');
var EventEmitter = require("events").EventEmitter,
    proto = require("./proto"),
    utils = require("./utils"),
    path = require("path"),
    basename = path.basename,
    fs = require("fs");
var merge = require("utils-merge");
require("./patch");
exports = module.exports = createServer;
exports.version = require("../package.json!systemjs-json").version;
exports.mime = require("./middleware/static").mime;
exports.proto = proto;
exports.middleware = {};
exports.utils = utils;
function createServer() {
  function app(req, res, next) {
    app.handle(req, res, next);
  }
  merge(app, proto);
  merge(app, EventEmitter.prototype);
  app.route = '/';
  app.stack = [];
  if (arguments.length !== 0) {
    deprecate('connect(middleware): use app.use(middleware) instead');
  }
  for (var i = 0; i < arguments.length; ++i) {
    app.use(arguments[i]);
  }
  return app;
}
;
createServer.createServer = deprecate.function(createServer, 'createServer(): use connect() instead');
fs.readdirSync(__dirname + '/middleware').forEach(function(filename) {
  if (!/\.js$/.test(filename))
    return;
  var name = basename(filename, '.js');
  function load() {
    return require('./middleware/' + name);
  }
  exports.middleware.__defineGetter__(name, load);
  exports.__defineGetter__(name, load);
});
