/* */ 
(function(process) {
  var deprecate = require("depd")('response-time');
  var onHeaders = require("on-headers");
  module.exports = responseTime;
  function responseTime(options) {
    var opts = options || {};
    if (typeof options === 'number') {
      deprecate('number argument: use {digits: ' + JSON.stringify(options) + '} instead');
      opts = {digits: options};
    }
    var fn = typeof opts !== 'function' ? createSetHeader(opts) : opts;
    return function responseTime(req, res, next) {
      var startAt = process.hrtime();
      onHeaders(res, function onHeaders() {
        var diff = process.hrtime(startAt);
        var time = diff[0] * 1e3 + diff[1] * 1e-6;
        fn(req, res, time);
      });
      next();
    };
  }
  function createSetHeader(options) {
    var digits = options.digits !== undefined ? options.digits : 3;
    var header = options.header || 'X-Response-Time';
    var suffix = options.suffix !== undefined ? Boolean(options.suffix) : true;
    return function setResponseHeader(req, res, time) {
      if (res.getHeader(header)) {
        return;
      }
      var val = time.toFixed(digits);
      if (suffix) {
        val += 'ms';
      }
      res.setHeader(header, val);
    };
  }
})(require("process"));
