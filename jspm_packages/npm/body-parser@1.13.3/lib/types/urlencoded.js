/* */ 
'use strict';
var bytes = require("bytes");
var contentType = require("content-type");
var createError = require("http-errors");
var debug = require("debug")('body-parser:urlencoded');
var deprecate = require("depd")('body-parser');
var read = require("../read");
var typeis = require("type-is");
module.exports = urlencoded;
var parsers = Object.create(null);
function urlencoded(options) {
  var opts = options || {};
  if (opts.extended === undefined) {
    deprecate('undefined extended: provide extended option');
  }
  var extended = opts.extended !== false;
  var inflate = opts.inflate !== false;
  var limit = typeof opts.limit !== 'number' ? bytes.parse(opts.limit || '100kb') : opts.limit;
  var type = opts.type || 'application/x-www-form-urlencoded';
  var verify = opts.verify || false;
  if (verify !== false && typeof verify !== 'function') {
    throw new TypeError('option verify must be function');
  }
  var queryparse = extended ? extendedparser(opts) : simpleparser(opts);
  var shouldParse = typeof type !== 'function' ? typeChecker(type) : type;
  function parse(body) {
    return body.length ? queryparse(body) : {};
  }
  return function urlencodedParser(req, res, next) {
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
    if (charset !== 'utf-8') {
      debug('invalid charset');
      next(createError(415, 'unsupported charset "' + charset.toUpperCase() + '"', {charset: charset}));
      return;
    }
    read(req, res, next, parse, debug, {
      debug: debug,
      encoding: charset,
      inflate: inflate,
      limit: limit,
      verify: verify
    });
  };
}
function extendedparser(options) {
  var parameterLimit = options.parameterLimit !== undefined ? options.parameterLimit : 1000;
  var parse = parser('qs');
  if (isNaN(parameterLimit) || parameterLimit < 1) {
    throw new TypeError('option parameterLimit must be a positive number');
  }
  if (isFinite(parameterLimit)) {
    parameterLimit = parameterLimit | 0;
  }
  return function queryparse(body) {
    var paramCount = parameterCount(body, parameterLimit);
    if (paramCount === undefined) {
      debug('too many parameters');
      throw createError(413, 'too many parameters');
    }
    var arrayLimit = Math.max(100, paramCount);
    debug('parse extended urlencoding');
    return parse(body, {
      allowDots: false,
      allowPrototypes: true,
      arrayLimit: arrayLimit,
      depth: Infinity,
      parameterLimit: parameterLimit
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
function parameterCount(body, limit) {
  var count = 0;
  var index = 0;
  while ((index = body.indexOf('&', index)) !== -1) {
    count++;
    index++;
    if (count === limit) {
      return undefined;
    }
  }
  return count;
}
function parser(name) {
  var mod = parsers[name];
  if (mod) {
    return mod.parse;
  }
  mod = parsers[name] = require(name);
  return mod.parse;
}
function simpleparser(options) {
  var parameterLimit = options.parameterLimit !== undefined ? options.parameterLimit : 1000;
  var parse = parser('querystring');
  if (isNaN(parameterLimit) || parameterLimit < 1) {
    throw new TypeError('option parameterLimit must be a positive number');
  }
  if (isFinite(parameterLimit)) {
    parameterLimit = parameterLimit | 0;
  }
  return function queryparse(body) {
    var paramCount = parameterCount(body, parameterLimit);
    if (paramCount === undefined) {
      debug('too many parameters');
      throw createError(413, 'too many parameters');
    }
    debug('parse urlencoding');
    return parse(body, undefined, undefined, {maxKeys: parameterLimit});
  };
}
function typeChecker(type) {
  return function checkType(req) {
    return Boolean(typeis(req, type));
  };
}
