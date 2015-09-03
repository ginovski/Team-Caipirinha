/* */ 
'use strict';
var bytes = require("bytes");
var debug = require("debug")('body-parser:raw');
var read = require("../read");
var typeis = require("type-is");
module.exports = raw;
function raw(options) {
  var opts = options || {};
  var inflate = opts.inflate !== false;
  var limit = typeof opts.limit !== 'number' ? bytes.parse(opts.limit || '100kb') : opts.limit;
  var type = opts.type || 'application/octet-stream';
  var verify = opts.verify || false;
  if (verify !== false && typeof verify !== 'function') {
    throw new TypeError('option verify must be function');
  }
  var shouldParse = typeof type !== 'function' ? typeChecker(type) : type;
  function parse(buf) {
    return buf;
  }
  return function rawParser(req, res, next) {
    if (req._body) {
      return debug('body already parsed'), next();
    }
    req.body = req.body || {};
    if (!typeis.hasBody(req)) {
      return debug('skip empty body'), next();
    }
    debug('content-type %j', req.headers['content-type']);
    if (!shouldParse(req)) {
      return debug('skip parsing'), next();
    }
    read(req, res, next, parse, debug, {
      encoding: null,
      inflate: inflate,
      limit: limit,
      verify: verify
    });
  };
}
function typeChecker(type) {
  return function checkType(req) {
    return Boolean(typeis(req, type));
  };
}
