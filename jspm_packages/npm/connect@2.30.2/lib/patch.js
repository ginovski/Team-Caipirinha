/* */ 
var cookie = require("cookie");
var deprecate = require("depd")('connect');
var http = require("http");
var merge = require("utils-merge");
var onHeaders = require("on-headers");
var utils = require("./utils"),
    res = http.ServerResponse.prototype,
    addListener = res.addListener,
    setHeader = res.setHeader;
if (!res._hasConnectPatch) {
  Object.defineProperty(res, 'headerSent', {
    configurable: true,
    enumerable: true,
    get: headersSent
  });
  deprecate.property(res, 'headerSent', 'res.headerSent: use standard res.headersSent');
  if (!('headersSent' in res)) {
    Object.defineProperty(res, 'headersSent', {
      configurable: true,
      enumerable: true,
      get: headersSent
    });
  }
  res.cookie = function(name, val, options) {
    options = merge({}, options);
    if ('maxAge' in options) {
      options.expires = new Date(Date.now() + options.maxAge);
      options.maxAge /= 1000;
    }
    if (null == options.path)
      options.path = '/';
    this.setHeader('Set-Cookie', cookie.serialize(name, String(val), options));
  };
  res.appendHeader = function appendHeader(field, val) {
    var prev = this.getHeader(field);
    if (!prev)
      return setHeader.call(this, field, val);
    val = Array.isArray(prev) ? prev.concat(val) : Array.isArray(val) ? [prev].concat(val) : [prev, val];
    return setHeader.call(this, field, val);
  };
  res.setHeader = function(field, val) {
    var key = field.toLowerCase(),
        prev;
    if (key === 'set-cookie') {
      if (Array.isArray(val) && val.length > 1) {
        prev = [].concat(this.getHeader(field) || []);
        val = unique(prev, val);
      }
      return this.appendHeader(field, val);
    }
    if ('content-type' == key && this.charset) {
      val = utils.setCharset(val, this.charset, true);
    }
    return setHeader.call(this, field, val);
  };
  res.on = function(type, listener) {
    if (type === 'header') {
      deprecate('res.on("header"): use on-headers npm module instead');
      onHeaders(this, listener);
      return this;
    }
    return addListener.apply(this, arguments);
  };
  res._hasConnectPatch = true;
}
function headersSent() {
  return Boolean(this._header);
}
function unique(reference, arr) {
  var array = [];
  for (var i = 0; i < arr.length; i++) {
    if (reference.indexOf(arr[i]) === -1) {
      array.push(arr[i]);
    }
  }
  return array;
}
