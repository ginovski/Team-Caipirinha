/* */ 
(function(Buffer, process) {
  var cookie = require("cookie");
  var crc = require("crc").crc32;
  var debug = require("debug")('express-session');
  var deprecate = require("depd")('express-session');
  var parseUrl = require("parseurl");
  var uid = require("uid-safe").sync,
      onHeaders = require("on-headers"),
      signature = require("cookie-signature");
  var Session = require("./session/session"),
      MemoryStore = require("./session/memory"),
      Cookie = require("./session/cookie"),
      Store = require("./session/store");
  var env = process.env.NODE_ENV;
  exports = module.exports = session;
  exports.Store = Store;
  exports.Cookie = Cookie;
  exports.Session = Session;
  exports.MemoryStore = MemoryStore;
  var warning = 'Warning: connect.session() MemoryStore is not\n' + 'designed for a production environment, as it will leak\n' + 'memory, and will not scale past a single process.';
  var defer = typeof setImmediate === 'function' ? setImmediate : function(fn) {
    process.nextTick(fn.bind.apply(fn, arguments));
  };
  function session(options) {
    var options = options || {},
        name = options.name || options.key || 'connect.sid',
        store = options.store || new MemoryStore,
        cookie = options.cookie || {},
        trustProxy = options.proxy,
        storeReady = true,
        rollingSessions = options.rolling || false;
    var resaveSession = options.resave;
    var saveUninitializedSession = options.saveUninitialized;
    var secret = options.secret;
    var generateId = options.genid || generateSessionId;
    if (typeof generateId !== 'function') {
      throw new TypeError('genid option must be a function');
    }
    if (resaveSession === undefined) {
      deprecate('undefined resave option; provide resave option');
      resaveSession = true;
    }
    if (saveUninitializedSession === undefined) {
      deprecate('undefined saveUninitialized option; provide saveUninitialized option');
      saveUninitializedSession = true;
    }
    if (options.unset && options.unset !== 'destroy' && options.unset !== 'keep') {
      throw new TypeError('unset option must be "destroy" or "keep"');
    }
    var unsetDestroy = options.unset === 'destroy';
    if (Array.isArray(secret) && secret.length === 0) {
      throw new TypeError('secret option array must contain one or more strings');
    }
    if (secret && !Array.isArray(secret)) {
      secret = [secret];
    }
    if (!secret) {
      deprecate('req.secret; provide secret option');
    }
    if ('production' == env && store instanceof MemoryStore) {
      console.warn(warning);
    }
    store.generate = function(req) {
      req.sessionID = generateId(req);
      req.session = new Session(req);
      req.session.cookie = new Cookie(cookie);
    };
    var storeImplementsTouch = typeof store.touch === 'function';
    store.on('disconnect', function() {
      storeReady = false;
    });
    store.on('connect', function() {
      storeReady = true;
    });
    return function session(req, res, next) {
      if (req.session)
        return next();
      if (!storeReady)
        return debug('store is disconnected'), next();
      var originalPath = parseUrl.original(req).pathname;
      if (0 != originalPath.indexOf(cookie.path || '/'))
        return next();
      if (!secret && !req.secret) {
        next(new Error('secret option required for sessions'));
        return;
      }
      var secrets = secret || [req.secret];
      var originalHash;
      var originalId;
      var savedHash;
      req.sessionStore = store;
      var cookieId = req.sessionID = getcookie(req, name, secrets);
      onHeaders(res, function() {
        if (!req.session) {
          debug('no session');
          return;
        }
        var cookie = req.session.cookie;
        if (cookie.secure && !issecure(req, trustProxy)) {
          debug('not secured');
          return;
        }
        if (!shouldSetCookie(req)) {
          return;
        }
        setcookie(res, name, req.sessionID, secrets[0], cookie.data);
      });
      var _end = res.end;
      var _write = res.write;
      var ended = false;
      res.end = function end(chunk, encoding) {
        if (ended) {
          return false;
        }
        ended = true;
        var ret;
        var sync = true;
        function writeend() {
          if (sync) {
            ret = _end.call(res, chunk, encoding);
            sync = false;
            return;
          }
          _end.call(res);
        }
        function writetop() {
          if (!sync) {
            return ret;
          }
          if (chunk == null) {
            ret = true;
            return ret;
          }
          var contentLength = Number(res.getHeader('Content-Length'));
          if (!isNaN(contentLength) && contentLength > 0) {
            chunk = !Buffer.isBuffer(chunk) ? new Buffer(chunk, encoding) : chunk;
            encoding = undefined;
            if (chunk.length !== 0) {
              debug('split response');
              ret = _write.call(res, chunk.slice(0, chunk.length - 1));
              chunk = chunk.slice(chunk.length - 1, chunk.length);
              return ret;
            }
          }
          ret = _write.call(res, chunk, encoding);
          sync = false;
          return ret;
        }
        if (shouldDestroy(req)) {
          debug('destroying');
          store.destroy(req.sessionID, function ondestroy(err) {
            if (err) {
              defer(next, err);
            }
            debug('destroyed');
            writeend();
          });
          return writetop();
        }
        if (!req.session) {
          debug('no session');
          return _end.call(res, chunk, encoding);
        }
        req.session.touch();
        if (shouldSave(req)) {
          req.session.save(function onsave(err) {
            if (err) {
              defer(next, err);
            }
            writeend();
          });
          return writetop();
        } else if (storeImplementsTouch && shouldTouch(req)) {
          debug('touching');
          store.touch(req.sessionID, req.session, function ontouch(err) {
            if (err) {
              defer(next, err);
            }
            debug('touched');
            writeend();
          });
          return writetop();
        }
        return _end.call(res, chunk, encoding);
      };
      function generate() {
        store.generate(req);
        originalId = req.sessionID;
        originalHash = hash(req.session);
        wrapmethods(req.session);
      }
      function wrapmethods(sess) {
        var _save = sess.save;
        function save() {
          debug('saving %s', this.id);
          savedHash = hash(this);
          _save.apply(this, arguments);
        }
        Object.defineProperty(sess, 'save', {
          configurable: true,
          enumerable: false,
          value: save,
          writable: true
        });
      }
      function isModified(sess) {
        return originalId !== sess.id || originalHash !== hash(sess);
      }
      function isSaved(sess) {
        return originalId === sess.id && savedHash === hash(sess);
      }
      function shouldDestroy(req) {
        return req.sessionID && unsetDestroy && req.session == null;
      }
      function shouldSave(req) {
        if (typeof req.sessionID !== 'string') {
          debug('session ignored because of bogus req.sessionID %o', req.sessionID);
          return false;
        }
        return !saveUninitializedSession && cookieId !== req.sessionID ? isModified(req.session) : !isSaved(req.session);
      }
      function shouldTouch(req) {
        if (typeof req.sessionID !== 'string') {
          debug('session ignored because of bogus req.sessionID %o', req.sessionID);
          return false;
        }
        return cookieId === req.sessionID && !shouldSave(req);
      }
      function shouldSetCookie(req) {
        if (typeof req.sessionID !== 'string') {
          return false;
        }
        if (rollingSessions) {
          return true;
        }
        return cookieId != req.sessionID ? saveUninitializedSession || isModified(req.session) : req.session.cookie.expires != null && isModified(req.session);
      }
      if (!req.sessionID) {
        debug('no SID sent, generating session');
        generate();
        next();
        return;
      }
      debug('fetching %s', req.sessionID);
      store.get(req.sessionID, function(err, sess) {
        if (err) {
          debug('error %j', err);
          if (err.code !== 'ENOENT') {
            next(err);
            return;
          }
          generate();
        } else if (!sess) {
          debug('no session found');
          generate();
        } else {
          debug('session found');
          store.createSession(req, sess);
          originalId = req.sessionID;
          originalHash = hash(sess);
          if (!resaveSession) {
            savedHash = originalHash;
          }
          wrapmethods(req.session);
        }
        next();
      });
    };
  }
  ;
  function generateSessionId(sess) {
    return uid(24);
  }
  function getcookie(req, name, secrets) {
    var header = req.headers.cookie;
    var raw;
    var val;
    if (header) {
      var cookies = cookie.parse(header);
      raw = cookies[name];
      if (raw) {
        if (raw.substr(0, 2) === 's:') {
          val = unsigncookie(raw.slice(2), secrets);
          if (val === false) {
            debug('cookie signature invalid');
            val = undefined;
          }
        } else {
          debug('cookie unsigned');
        }
      }
    }
    if (!val && req.signedCookies) {
      val = req.signedCookies[name];
      if (val) {
        deprecate('cookie should be available in req.headers.cookie');
      }
    }
    if (!val && req.cookies) {
      raw = req.cookies[name];
      if (raw) {
        if (raw.substr(0, 2) === 's:') {
          val = unsigncookie(raw.slice(2), secrets);
          if (val) {
            deprecate('cookie should be available in req.headers.cookie');
          }
          if (val === false) {
            debug('cookie signature invalid');
            val = undefined;
          }
        } else {
          debug('cookie unsigned');
        }
      }
    }
    return val;
  }
  function hash(sess) {
    return crc(JSON.stringify(sess, function(key, val) {
      if (key !== 'cookie') {
        return val;
      }
    }));
  }
  function issecure(req, trustProxy) {
    if (req.connection && req.connection.encrypted) {
      return true;
    }
    if (trustProxy === false) {
      return false;
    }
    if (trustProxy !== true) {
      var secure = req.secure;
      return typeof secure === 'boolean' ? secure : false;
    }
    var header = req.headers['x-forwarded-proto'] || '';
    var index = header.indexOf(',');
    var proto = index !== -1 ? header.substr(0, index).toLowerCase().trim() : header.toLowerCase().trim();
    return proto === 'https';
  }
  function setcookie(res, name, val, secret, options) {
    var signed = 's:' + signature.sign(val, secret);
    var data = cookie.serialize(name, signed, options);
    debug('set-cookie %s', data);
    var prev = res.getHeader('set-cookie') || [];
    var header = Array.isArray(prev) ? prev.concat(data) : Array.isArray(data) ? [prev].concat(data) : [prev, data];
    res.setHeader('set-cookie', header);
  }
  function unsigncookie(val, secrets) {
    for (var i = 0; i < secrets.length; i++) {
      var result = signature.unsign(val, secrets[i]);
      if (result !== false) {
        return result;
      }
    }
    return false;
  }
})(require("buffer").Buffer, require("process"));
