/* */ 
'use strict';
var bytes = require("bytes");
var contentType = require("content-type");
var createError = require("http-errors");
var debug = require("debug")('body-parser:json');
var read = require("../read");
var typeis = require("type-is");
module.exports = json;
var firstcharRegExp = /^[\x20\x09\x0a\x0d]*(.)/;
function json(options) {
  var opts = options || {};
  var limit = typeof opts.limit !== 'number' ? bytes.parse(opts.limit || '100kb') : opts.limit;
  var inflate = opts.inflate !== false;
  var reviver = opts.reviver;
  var strict = opts.strict !== false;
  var type = opts.type || 'application/json';
  var verify = opts.verify || false;
  if (verify !== false && typeof verify !== 'function') {
    throw new TypeError('option verify must be function');
  }
  var shouldParse = typeof type !== 'function' ? typeChecker(type) : type;
  function parse(body) {
    if (body.length === 0) {
      return {};
    }
    if (strict) {
      var first = firstchar(body);
      if (first !== '{' && first !== '[') {
        debug('strict violation');
        throw new Error('invalid json');
      }
    }
    debug('parse json');
    return JSON.parse(body, reviver);
  }
  return function jsonParser(req, res, next) {
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
    var charset = getCharset(req) || 'utf-8';
    if (charset.substr(0, 4) !== 'utf-') {
      debug('invalid charset');
      next(createError(415, 'unsupported charset "' + charset.toUpperCase() + '"', {charset: charset}));
      return;
    }
    read(req, res, next, parse, debug, {
      encoding: charset,
      inflate: inflate,
      limit: limit,
      verify: verify
    });
  };
}
function firstchar(str) {
  var match = firstcharRegExp.exec(str);
  return match ? match[1] : '';
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
