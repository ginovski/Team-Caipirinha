/* */ 
(function(Buffer) {
  'use strict';
  var etag = require("etag");
  var fresh = require("fresh");
  var fs = require("fs");
  var ms = require("ms");
  var parseUrl = require("parseurl");
  var path = require("path");
  var resolve = path.resolve;
  module.exports = favicon;
  var maxMaxAge = 60 * 60 * 24 * 365 * 1000;
  function favicon(path, options) {
    var opts = options || {};
    var buf;
    var icon;
    var maxAge = calcMaxAge(opts.maxAge);
    var stat;
    if (!path)
      throw new TypeError('path to favicon.ico is required');
    if (Buffer.isBuffer(path)) {
      buf = new Buffer(path.length);
      path.copy(buf);
      icon = createIcon(buf, maxAge);
    } else if (typeof path === 'string') {
      path = resolve(path);
      stat = fs.statSync(path);
      if (stat.isDirectory())
        throw createIsDirError(path);
    } else {
      throw new TypeError('path to favicon.ico must be string or buffer');
    }
    return function favicon(req, res, next) {
      if (parseUrl(req).pathname !== '/favicon.ico') {
        next();
        return;
      }
      if (req.method !== 'GET' && req.method !== 'HEAD') {
        res.statusCode = req.method === 'OPTIONS' ? 200 : 405;
        res.setHeader('Allow', 'GET, HEAD, OPTIONS');
        res.setHeader('Content-Length', '0');
        res.end();
        return;
      }
      if (icon)
        return send(req, res, icon);
      fs.readFile(path, function(err, buf) {
        if (err)
          return next(err);
        icon = createIcon(buf, maxAge);
        send(req, res, icon);
      });
    };
  }
  ;
  function calcMaxAge(val) {
    var num = typeof val === 'string' ? ms(val) : val;
    return num != null ? Math.min(Math.max(0, num), maxMaxAge) : maxMaxAge;
  }
  function createIcon(buf, maxAge) {
    return {
      body: buf,
      headers: {
        'Cache-Control': 'public, max-age=' + Math.floor(maxAge / 1000),
        'ETag': etag(buf)
      }
    };
  }
  function createIsDirError(path) {
    var error = new Error('EISDIR, illegal operation on directory \'' + path + '\'');
    error.code = 'EISDIR';
    error.errno = 28;
    error.path = path;
    error.syscall = 'open';
    return error;
  }
  function send(req, res, icon) {
    var headers = icon.headers;
    var keys = Object.keys(headers);
    for (var i = 0; i < keys.length; i++) {
      var key = keys[i];
      res.setHeader(key, headers[key]);
    }
    if (fresh(req.headers, res._headers)) {
      res.statusCode = 304;
      res.end();
      return;
    }
    res.statusCode = 200;
    res.setHeader('Content-Length', icon.body.length);
    res.setHeader('Content-Type', 'image/x-icon');
    res.end(icon.body);
  }
})(require("buffer").Buffer);
