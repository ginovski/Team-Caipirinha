/* */ 
var EventEmitter = require("events").EventEmitter,
    Session = require("./session"),
    Cookie = require("./cookie");
var Store = module.exports = function Store(options) {};
Store.prototype.__proto__ = EventEmitter.prototype;
Store.prototype.regenerate = function(req, fn) {
  var self = this;
  this.destroy(req.sessionID, function(err) {
    self.generate(req);
    fn(err);
  });
};
Store.prototype.load = function(sid, fn) {
  var self = this;
  this.get(sid, function(err, sess) {
    if (err)
      return fn(err);
    if (!sess)
      return fn();
    var req = {
      sessionID: sid,
      sessionStore: self
    };
    sess = self.createSession(req, sess);
    fn(null, sess);
  });
};
Store.prototype.createSession = function(req, sess) {
  var expires = sess.cookie.expires,
      orig = sess.cookie.originalMaxAge;
  sess.cookie = new Cookie(sess.cookie);
  if ('string' == typeof expires)
    sess.cookie.expires = new Date(expires);
  sess.cookie.originalMaxAge = orig;
  req.session = new Session(req, sess);
  return req.session;
};
