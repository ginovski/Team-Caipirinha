/* */ 
(function(process) {
  var Store = require("./store");
  var util = require("util");
  var defer = typeof setImmediate === 'function' ? setImmediate : function(fn) {
    process.nextTick(fn.bind.apply(fn, arguments));
  };
  module.exports = MemoryStore;
  function MemoryStore() {
    Store.call(this);
    this.sessions = Object.create(null);
  }
  util.inherits(MemoryStore, Store);
  MemoryStore.prototype.all = function all(callback) {
    var sessionIds = Object.keys(this.sessions);
    var sessions = Object.create(null);
    for (var i = 0; i < sessionIds.length; i++) {
      var sessionId = sessionIds[i];
      var session = getSession.call(this, sessionId);
      if (session) {
        sessions[sessionId] = session;
      }
    }
    callback && defer(callback, null, sessions);
  };
  MemoryStore.prototype.clear = function clear(callback) {
    this.sessions = Object.create(null);
    callback && defer(callback);
  };
  MemoryStore.prototype.destroy = function destroy(sessionId, callback) {
    delete this.sessions[sessionId];
    callback && defer(callback);
  };
  MemoryStore.prototype.get = function get(sessionId, callback) {
    defer(callback, null, getSession.call(this, sessionId));
  };
  MemoryStore.prototype.length = function length(callback) {
    this.all(function(err, sessions) {
      if (err)
        return callback(err);
      callback(null, Object.keys(sessions).length);
    });
  };
  MemoryStore.prototype.set = function set(sessionId, session, callback) {
    this.sessions[sessionId] = JSON.stringify(session);
    callback && defer(callback);
  };
  MemoryStore.prototype.touch = function touch(sessionId, session, callback) {
    var currentSession = getSession.call(this, sessionId);
    if (currentSession) {
      currentSession.cookie = session.cookie;
      this.sessions[sessionId] = JSON.stringify(currentSession);
    }
    callback && defer(callback);
  };
  function getSession(sessionId) {
    var sess = this.sessions[sessionId];
    if (!sess) {
      return;
    }
    sess = JSON.parse(sess);
    var expires = typeof sess.cookie.expires === 'string' ? new Date(sess.cookie.expires) : sess.cookie.expires;
    if (expires && expires <= Date.now()) {
      delete this.sessions[sessionId];
      return;
    }
    return sess;
  }
})(require("process"));
