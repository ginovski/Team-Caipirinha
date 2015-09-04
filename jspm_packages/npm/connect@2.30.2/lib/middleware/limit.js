/* */ 
(function(Buffer, process) {
  var createError = require("http-errors");
  var deprecate = require("depd")('connect');
  var parseBytes = require("bytes");
  var utils = require("../utils");
  var brokenPause = utils.brokenPause;
  module.exports = function limit(bytes) {
    if ('string' == typeof bytes)
      bytes = parseBytes(bytes);
    if ('number' != typeof bytes)
      throw new Error('limit() bytes required');
    return function limit(req, res, next) {
      var received = 0,
          len = req.headers['content-length'] ? parseInt(req.headers['content-length'], 10) : null;
      if (req._limit)
        return next();
      req._limit = true;
      if (len && len > bytes)
        return next(createError(413));
      if (brokenPause) {
        listen();
      } else {
        req.on('newListener', function handler(event) {
          if (event !== 'data')
            return;
          req.removeListener('newListener', handler);
          process.nextTick(listen);
        });
      }
      ;
      next();
      function listen() {
        req.on('data', function(chunk) {
          received += Buffer.isBuffer(chunk) ? chunk.length : Buffer.byteLength(chunk);
          if (received > bytes)
            req.destroy();
        });
      }
      ;
    };
  };
  module.exports = deprecate.function(module.exports, 'limit: Restrict request size at location of read');
})(require("buffer").Buffer, require("process"));
