/* */ 
'use strict';
var debug = require("debug")('method-override');
var methods = require("methods");
var parseurl = require("parseurl");
var querystring = require("querystring");
var vary = require("vary");
module.exports = function methodOverride(getter, options) {
  options = options || {};
  var get = typeof getter === 'function' ? getter : createGetter(getter || 'X-HTTP-Method-Override');
  var methods = options.methods === undefined ? ['POST'] : options.methods;
  return function methodOverride(req, res, next) {
    var method;
    var val;
    req.originalMethod = req.originalMethod || req.method;
    if (methods && methods.indexOf(req.originalMethod) === -1) {
      return next();
    }
    val = get(req, res);
    method = Array.isArray(val) ? val[0] : val;
    if (method !== undefined && supports(method)) {
      req.method = method.toUpperCase();
      debug('override %s as %s', req.originalMethod, req.method);
    }
    next();
  };
};
function createGetter(str) {
  if (str.substr(0, 2).toUpperCase() === 'X-') {
    return createHeaderGetter(str);
  }
  return createQueryGetter(str);
}
function createQueryGetter(key) {
  return function(req, res) {
    var url = parseurl(req);
    var query = querystring.parse(url.query || '');
    return query[key];
  };
}
function createHeaderGetter(str) {
  var header = str.toLowerCase();
  return function(req, res) {
    vary(res, str);
    return (req.headers[header] || '').split(/ *, */);
  };
}
function supports(method) {
  return method && typeof method === 'string' && methods.indexOf(method.toLowerCase()) !== -1;
}
