/* */ 
(function(process) {
  var bytes = require("bytes");
  var contentType = require("content-type");
  var cookieParser = require("cookie-parser");
  var createError = require("http-errors");
  var deprecate = require("depd")('connect');
  var http = require("http"),
      crypto = require("crypto"),
      parseurl = require("parseurl"),
      sep = require("path").sep,
      signature = require("cookie-signature"),
      typeis = require("type-is"),
      nodeVersion = process.versions.node.split('.');
  var merge = require("utils-merge");
  exports.brokenPause = parseInt(nodeVersion[0], 10) === 0 && parseInt(nodeVersion[1], 10) < 10;
  exports.hasBody = deprecate.function(typeis.hasBody, 'utils.hasBody: use type-is npm module instead');
  exports.mime = function(req) {
    var str = req.headers['content-type'] || '',
        i = str.indexOf(';');
    return ~i ? str.slice(0, i) : str;
  };
  exports.mime = deprecate.function(exports.mime, 'utils.mime: use type-is npm module instead for mime comparisons');
  exports.error = function(code, msg) {
    var err = new Error(msg || http.STATUS_CODES[code]);
    err.status = code;
    return err;
  };
  exports.error = deprecate.function(exports.error, 'utils.error: use http-errors npm module instead');
  exports.md5 = function(str, encoding) {
    return crypto.createHash('md5').update(str, 'utf8').digest(encoding || 'hex');
  };
  exports.md5 = deprecate.function(exports.md5, 'utils.md5: use crypto npm module instead for hashing');
  exports.merge = deprecate.function(merge, 'utils.merge: use utils-merge npm module instead');
  exports.escape = function(html) {
    return String(html).replace(/&(?!\w+;)/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  };
  exports.escape = deprecate.function(exports.escape, 'utils.escape: use escape-html npm module instead');
  exports.sign = deprecate.function(signature.sign, 'utils.sign: use cookie-signature npm module instead');
  exports.unsign = deprecate.function(signature.unsign, 'utils.unsign: use cookie-signature npm module instead');
  exports.parseSignedCookies = deprecate.function(cookieParser.signedCookies, 'utils.parseSignedCookies: use cookie-parser npm module instead');
  exports.parseSignedCookie = deprecate.function(cookieParser.signedCookie, 'utils.parseSignedCookie: use cookie-parser npm module instead');
  exports.parseJSONCookies = deprecate.function(cookieParser.JSONCookies, 'utils.parseJSONCookies: use cookie-parser npm module instead');
  exports.parseJSONCookie = deprecate.function(cookieParser.JSONCookie, 'utils.parseJSONCookie: use cookie-parser npm module instead');
  exports.pause = exports.brokenPause ? require("pause") : function() {
    return {
      end: noop,
      resume: noop
    };
  };
  exports.removeContentHeaders = function(res) {
    if (!res._headers)
      return;
    Object.keys(res._headers).forEach(function(field) {
      if (0 == field.indexOf('content')) {
        res.removeHeader(field);
      }
    });
  };
  exports.removeContentHeaders = deprecate.function(exports.removeContentHeaders, 'utils.removeContentHeaders: this private api moved with serve-static');
  exports.conditionalGET = function(req) {
    return req.headers['if-modified-since'] || req.headers['if-none-match'];
  };
  exports.conditionalGET = deprecate.function(exports.conditionalGET, 'utils.conditionalGET: use fresh npm module instead');
  exports.unauthorized = function(res, realm) {
    res.statusCode = 401;
    res.setHeader('WWW-Authenticate', 'Basic realm="' + realm + '"');
    res.end('Unauthorized');
  };
  exports.unauthorized = deprecate.function(exports.unauthorized, 'utils.unauthorized: this private api moved with basic-auth-connect');
  exports.notModified = function(res) {
    exports.removeContentHeaders(res);
    res.statusCode = 304;
    res.end();
  };
  exports.notModified = deprecate.function(exports.notModified, 'utils.notModified: this private api moved with serve-static');
  exports.etag = function(stat) {
    return '"' + stat.size + '-' + Number(stat.mtime) + '"';
  };
  exports.etag = deprecate.function(exports.etag, 'utils.etag: this private api moved with serve-static');
  exports.parseCacheControl = function(str) {
    var directives = str.split(','),
        obj = {};
    for (var i = 0,
        len = directives.length; i < len; i++) {
      var parts = directives[i].split('='),
          key = parts.shift().trim(),
          val = parseInt(parts.shift(), 10);
      obj[key] = isNaN(val) ? true : val;
    }
    return obj;
  };
  exports.parseUrl = deprecate.function(parseurl, 'utils.parseUrl: use parseurl npm module instead');
  exports.parseBytes = deprecate.function(bytes, 'utils.parseBytes: use bytes npm module instead');
  exports.normalizeSlashes = function normalizeSlashes(path) {
    return path.split(sep).join('/');
  };
  exports.normalizeSlashes = deprecate.function(exports.normalizeSlashes, 'utils.normalizeSlashes: this private api moved with serve-index');
  exports.setCharset = function setCharset(type, charset) {
    if (!type || !charset)
      return type;
    var parsed = contentType.parse(type);
    var exists = parsed.parameters.charset;
    if (exists) {
      return type;
    }
    parsed.parameters.charset = charset;
    return contentType.format(parsed);
  };
  function noop() {}
})(require("process"));
