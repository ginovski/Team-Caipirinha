/* */ 
'use strict';
var bytes = require("bytes");
var contentType = require("content-type");
var debug = require("debug")('body-parser:text');
var read = require("../read");
var typeis = require("type-is");
module.exports = text;
function text(options) {
  var opts = options || {};
  var defaultCharset = opts.defaultCharset || 'utf-8';
  var inflate = opts.inflate !== false;
  var limit = typeof opts.limit !== 'number' ? bytes.parse(opts.limit || '100kb') : opts.limit;
  var type = opts.type || 'text/plain';
  var verify = opts.verify || false;
  if (verify !== false && typeof verify !== 'function') {
    throw new TypeError('option verify must be function');
  }
  var shouldParse = typeof type !== 'function' ? typeChecker(type) : type;
  function parse(buf) {
    return buf;
  }
  return function textParser(req, res, next) {
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
    var charset = getCharset(req) || defaultCharset;
    read(req, res, next, parse, debug, {
      encoding: charset,
      inflate: inflate,
      limit: limit,
      verify: verify
    });
  };
}
function getCharset(req) {
  try {
    return contentType.parse(req).parameters.charset.toLowerCase();
  } catch (e) {
    return undefined;
  }
}
function typeChecker(type) {
  return function checkType(req) {
    return Boolean(typeis(req, type));
  };
}
