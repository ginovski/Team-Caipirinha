/* */ 
(function(Buffer, process) {
  'use strict';
  var debug = require("debug")('finalhandler');
  var escapeHtml = require("escape-html");
  var http = require("http");
  var onFinished = require("on-finished");
  var unpipe = require("unpipe");
  var defer = typeof setImmediate === 'function' ? setImmediate : function(fn) {
    process.nextTick(fn.bind.apply(fn, arguments));
  };
  var isFinished = onFinished.isFinished;
  module.exports = finalhandler;
  function finalhandler(req, res, options) {
    var opts = options || {};
    var env = opts.env || process.env.NODE_ENV || 'development';
    var onerror = opts.onerror;
    return function(err) {
      var status = res.statusCode;
      if (!err && res._header) {
        debug('cannot 404 after headers sent');
        return;
      }
      if (err) {
        if (err.statusCode) {
          status = err.statusCode;
        }
        if (err.status) {
          status = err.status;
        }
        if (!status || status < 400) {
          status = 500;
        }
        var msg = env === 'production' ? http.STATUS_CODES[status] : err.stack || err.toString();
        msg = escapeHtml(msg).replace(/\n/g, '<br>').replace(/  /g, ' &nbsp;') + '\n';
      } else {
        status = 404;
        msg = 'Cannot ' + escapeHtml(req.method) + ' ' + escapeHtml(req.originalUrl || req.url) + '\n';
      }
      debug('default %s', status);
      if (err && onerror) {
        defer(onerror, err, req, res);
      }
      if (res._header) {
        return req.socket.destroy();
      }
      send(req, res, status, msg);
    };
  }
  function send(req, res, status, body) {
    function write() {
      res.statusCode = status;
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader('Content-Length', Buffer.byteLength(body, 'utf8'));
      if (req.method === 'HEAD') {
        res.end();
        return;
      }
      res.end(body, 'utf8');
    }
    if (isFinished(req)) {
      write();
      return;
    }
    unpipe(req);
    onFinished(req, write);
    req.resume();
  }
})(require("buffer").Buffer, require("process"));
