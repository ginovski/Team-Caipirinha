/* */ 
var cookieParser = require("cookie-parser");
var parseUrl = require("parseurl");
var Cookie = require("express-session").Cookie,
    debug = require("debug")('connect:cookieSession'),
    signature = require("cookie-signature"),
    onHeaders = require("on-headers"),
    url = require("url");
module.exports = function cookieSession(options) {
  options = options || {};
  var key = options.key || 'connect.sess',
      trustProxy = options.proxy;
  return function cookieSession(req, res, next) {
    var secret = options.secret || req.secret;
    if (!secret)
      throw new Error('`secret` option required for cookie sessions');
    req.session = {};
    var cookie = req.session.cookie = new Cookie(options.cookie);
    var originalPath = parseUrl.original(req).pathname;
    if (0 != originalPath.indexOf(cookie.path))
      return next();
    if (!options.secret && req.secret) {
      req.session = req.signedCookies[key] || {};
      req.session.cookie = cookie;
    } else {
      var rawCookie = req.cookies[key];
      if (rawCookie) {
        var unsigned = cookieParser.signedCookie(rawCookie, secret);
        if (unsigned) {
          var original = unsigned;
          req.session = cookieParser.JSONCookie(unsigned) || {};
          req.session.cookie = cookie;
        }
      }
    }
    onHeaders(res, function() {
      if (!req.session) {
        debug('clear session');
        cookie.expires = new Date(0);
        res.setHeader('Set-Cookie', cookie.serialize(key, ''));
        return;
      }
      delete req.session.cookie;
      var proto = (req.headers['x-forwarded-proto'] || '').toLowerCase(),
          tls = req.connection.encrypted || (trustProxy && 'https' == proto.split(/\s*,\s*/)[0]);
      if (cookie.secure && !tls)
        return debug('not secured');
      debug('serializing %j', req.session);
      var val = 'j:' + JSON.stringify(req.session);
      if (original == val)
        return debug('unmodified session');
      val = 's:' + signature.sign(val, secret);
      val = cookie.serialize(key, val);
      debug('set-cookie %j', cookie);
      res.setHeader('Set-Cookie', val);
    });
    next();
  };
};
