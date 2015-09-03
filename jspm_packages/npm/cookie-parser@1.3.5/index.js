/* */ 
var cookie = require("cookie");
var parse = require("./lib/parse");
exports = module.exports = function cookieParser(secret, options) {
  return function cookieParser(req, res, next) {
    if (req.cookies)
      return next();
    var cookies = req.headers.cookie;
    req.secret = secret;
    req.cookies = Object.create(null);
    req.signedCookies = Object.create(null);
    if (!cookies) {
      return next();
    }
    req.cookies = cookie.parse(cookies, options);
    if (secret) {
      req.signedCookies = parse.signedCookies(req.cookies, secret);
      req.signedCookies = parse.JSONCookies(req.signedCookies);
    }
    req.cookies = parse.JSONCookies(req.cookies);
    next();
  };
};
exports.JSONCookie = parse.JSONCookie;
exports.JSONCookies = parse.JSONCookies;
exports.signedCookie = parse.signedCookie;
exports.signedCookies = parse.signedCookies;
