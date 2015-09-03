/* */ 
(function(Buffer) {
  'use strict';
  var createError = require("http-errors");
  var debug = require("debug")('send');
  var deprecate = require("depd")('send');
  var destroy = require("destroy");
  var escapeHtml = require("escape-html"),
      parseRange = require("range-parser"),
      Stream = require("stream"),
      mime = require("mime"),
      fresh = require("fresh"),
      path = require("path"),
      fs = require("fs"),
      normalize = path.normalize,
      join = path.join;
  var etag = require("etag");
  var EventEmitter = require("events").EventEmitter;
  var ms = require("ms");
  var onFinished = require("on-finished");
  var statuses = require("statuses");
  var extname = path.extname;
  var maxMaxAge = 60 * 60 * 24 * 365 * 1000;
  var resolve = path.resolve;
  var sep = path.sep;
  var toString = Object.prototype.toString;
  var upPathRegexp = /(?:^|[\\\/])\.\.(?:[\\\/]|$)/;
  module.exports = send;
  module.exports.mime = mime;
  var listenerCount = EventEmitter.listenerCount || function(emitter, type) {
    return emitter.listeners(type).length;
  };
  function send(req, path, options) {
    return new SendStream(req, path, options);
  }
  function SendStream(req, path, options) {
    var opts = options || {};
    this.options = opts;
    this.path = path;
    this.req = req;
    this._etag = opts.etag !== undefined ? Boolean(opts.etag) : true;
    this._dotfiles = opts.dotfiles !== undefined ? opts.dotfiles : 'ignore';
    if (this._dotfiles !== 'ignore' && this._dotfiles !== 'allow' && this._dotfiles !== 'deny') {
      throw new TypeError('dotfiles option must be "allow", "deny", or "ignore"');
    }
    this._hidden = Boolean(opts.hidden);
    if (opts.hidden !== undefined) {
      deprecate('hidden: use dotfiles: \'' + (this._hidden ? 'allow' : 'ignore') + '\' instead');
    }
    if (opts.dotfiles === undefined) {
      this._dotfiles = undefined;
    }
    this._extensions = opts.extensions !== undefined ? normalizeList(opts.extensions, 'extensions option') : [];
    this._index = opts.index !== undefined ? normalizeList(opts.index, 'index option') : ['index.html'];
    this._lastModified = opts.lastModified !== undefined ? Boolean(opts.lastModified) : true;
    this._maxage = opts.maxAge || opts.maxage;
    this._maxage = typeof this._maxage === 'string' ? ms(this._maxage) : Number(this._maxage);
    this._maxage = !isNaN(this._maxage) ? Math.min(Math.max(0, this._maxage), maxMaxAge) : 0;
    this._root = opts.root ? resolve(opts.root) : null;
    if (!this._root && opts.from) {
      this.from(opts.from);
    }
  }
  SendStream.prototype.__proto__ = Stream.prototype;
  SendStream.prototype.etag = deprecate.function(function etag(val) {
    val = Boolean(val);
    debug('etag %s', val);
    this._etag = val;
    return this;
  }, 'send.etag: pass etag as option');
  SendStream.prototype.hidden = deprecate.function(function hidden(val) {
    val = Boolean(val);
    debug('hidden %s', val);
    this._hidden = val;
    this._dotfiles = undefined;
    return this;
  }, 'send.hidden: use dotfiles option');
  SendStream.prototype.index = deprecate.function(function index(paths) {
    var index = !paths ? [] : normalizeList(paths, 'paths argument');
    debug('index %o', paths);
    this._index = index;
    return this;
  }, 'send.index: pass index as option');
  SendStream.prototype.root = function(path) {
    path = String(path);
    this._root = resolve(path);
    return this;
  };
  SendStream.prototype.from = deprecate.function(SendStream.prototype.root, 'send.from: pass root as option');
  SendStream.prototype.root = deprecate.function(SendStream.prototype.root, 'send.root: pass root as option');
  SendStream.prototype.maxage = deprecate.function(function maxage(maxAge) {
    maxAge = typeof maxAge === 'string' ? ms(maxAge) : Number(maxAge);
    if (isNaN(maxAge))
      maxAge = 0;
    if (Infinity == maxAge)
      maxAge = 60 * 60 * 24 * 365 * 1000;
    debug('max-age %d', maxAge);
    this._maxage = maxAge;
    return this;
  }, 'send.maxage: pass maxAge as option');
  SendStream.prototype.error = function error(status, error) {
    if (listenerCount(this, 'error') !== 0) {
      return this.emit('error', createError(error, status, {expose: false}));
    }
    var res = this.res;
    var msg = statuses[status];
    res._headers = null;
    res.statusCode = status;
    res.setHeader('Content-Type', 'text/plain; charset=UTF-8');
    res.setHeader('Content-Length', Buffer.byteLength(msg));
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.end(msg);
  };
  SendStream.prototype.hasTrailingSlash = function() {
    return '/' == this.path[this.path.length - 1];
  };
  SendStream.prototype.isConditionalGET = function() {
    return this.req.headers['if-none-match'] || this.req.headers['if-modified-since'];
  };
  SendStream.prototype.removeContentHeaderFields = function removeContentHeaderFields() {
    var res = this.res;
    var headers = Object.keys(res._headers || {});
    for (var i = 0; i < headers.length; i++) {
      var header = headers[i];
      if (header.substr(0, 8) === 'content-' && header !== 'content-location') {
        res.removeHeader(header);
      }
    }
  };
  SendStream.prototype.notModified = function() {
    var res = this.res;
    debug('not modified');
    this.removeContentHeaderFields();
    res.statusCode = 304;
    res.end();
  };
  SendStream.prototype.headersAlreadySent = function headersAlreadySent() {
    var err = new Error('Can\'t set headers after they are sent.');
    debug('headers already sent');
    this.error(500, err);
  };
  SendStream.prototype.isCachable = function() {
    var res = this.res;
    return (res.statusCode >= 200 && res.statusCode < 300) || 304 == res.statusCode;
  };
  SendStream.prototype.onStatError = function onStatError(error) {
    switch (error.code) {
      case 'ENAMETOOLONG':
      case 'ENOENT':
      case 'ENOTDIR':
        this.error(404, error);
        break;
      default:
        this.error(500, error);
        break;
    }
  };
  SendStream.prototype.isFresh = function() {
    return fresh(this.req.headers, this.res._headers);
  };
  SendStream.prototype.isRangeFresh = function isRangeFresh() {
    var ifRange = this.req.headers['if-range'];
    if (!ifRange)
      return true;
    return ~ifRange.indexOf('"') ? ~ifRange.indexOf(this.res._headers['etag']) : Date.parse(this.res._headers['last-modified']) <= Date.parse(ifRange);
  };
  SendStream.prototype.redirect = function redirect(path) {
    if (listenerCount(this, 'directory') !== 0) {
      this.emit('directory');
      return;
    }
    if (this.hasTrailingSlash()) {
      this.error(403);
      return;
    }
    var loc = path + '/';
    var msg = 'Redirecting to <a href="' + escapeHtml(loc) + '">' + escapeHtml(loc) + '</a>\n';
    var res = this.res;
    res.statusCode = 301;
    res.setHeader('Content-Type', 'text/html; charset=UTF-8');
    res.setHeader('Content-Length', Buffer.byteLength(msg));
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Location', loc);
    res.end(msg);
  };
  SendStream.prototype.pipe = function(res) {
    var self = this,
        args = arguments,
        root = this._root;
    this.res = res;
    var path = decode(this.path);
    if (path === -1)
      return this.error(400);
    if (~path.indexOf('\0'))
      return this.error(400);
    var parts;
    if (root !== null) {
      if (upPathRegexp.test(normalize('.' + sep + path))) {
        debug('malicious path "%s"', path);
        return this.error(403);
      }
      path = normalize(join(root, path));
      root = normalize(root + sep);
      parts = path.substr(root.length).split(sep);
    } else {
      if (upPathRegexp.test(path)) {
        debug('malicious path "%s"', path);
        return this.error(403);
      }
      parts = normalize(path).split(sep);
      path = resolve(path);
    }
    if (containsDotFile(parts)) {
      var access = this._dotfiles;
      if (access === undefined) {
        access = parts[parts.length - 1][0] === '.' ? (this._hidden ? 'allow' : 'ignore') : 'allow';
      }
      debug('%s dotfile "%s"', access, path);
      switch (access) {
        case 'allow':
          break;
        case 'deny':
          return this.error(403);
        case 'ignore':
        default:
          return this.error(404);
      }
    }
    if (this._index.length && this.path[this.path.length - 1] === '/') {
      this.sendIndex(path);
      return res;
    }
    this.sendFile(path);
    return res;
  };
  SendStream.prototype.send = function(path, stat) {
    var len = stat.size;
    var options = this.options;
    var opts = {};
    var res = this.res;
    var req = this.req;
    var ranges = req.headers.range;
    var offset = options.start || 0;
    if (res._header) {
      return this.headersAlreadySent();
    }
    debug('pipe "%s"', path);
    this.setHeader(path, stat);
    this.type(path);
    if (this.isConditionalGET() && this.isCachable() && this.isFresh()) {
      return this.notModified();
    }
    len = Math.max(0, len - offset);
    if (options.end !== undefined) {
      var bytes = options.end - offset + 1;
      if (len > bytes)
        len = bytes;
    }
    if (ranges) {
      ranges = parseRange(len, ranges);
      if (!this.isRangeFresh()) {
        debug('range stale');
        ranges = -2;
      }
      if (-1 == ranges) {
        debug('range unsatisfiable');
        res.setHeader('Content-Range', 'bytes */' + stat.size);
        return this.error(416);
      }
      if (-2 != ranges && ranges.length === 1) {
        debug('range %j', ranges);
        res.statusCode = 206;
        res.setHeader('Content-Range', 'bytes ' + ranges[0].start + '-' + ranges[0].end + '/' + len);
        offset += ranges[0].start;
        len = ranges[0].end - ranges[0].start + 1;
      }
    }
    for (var prop in options) {
      opts[prop] = options[prop];
    }
    opts.start = offset;
    opts.end = Math.max(offset, offset + len - 1);
    res.setHeader('Content-Length', len);
    if ('HEAD' == req.method)
      return res.end();
    this.stream(path, opts);
  };
  SendStream.prototype.sendFile = function sendFile(path) {
    var i = 0;
    var self = this;
    debug('stat "%s"', path);
    fs.stat(path, function onstat(err, stat) {
      if (err && err.code === 'ENOENT' && !extname(path) && path[path.length - 1] !== sep) {
        return next(err);
      }
      if (err)
        return self.onStatError(err);
      if (stat.isDirectory())
        return self.redirect(self.path);
      self.emit('file', path, stat);
      self.send(path, stat);
    });
    function next(err) {
      if (self._extensions.length <= i) {
        return err ? self.onStatError(err) : self.error(404);
      }
      var p = path + '.' + self._extensions[i++];
      debug('stat "%s"', p);
      fs.stat(p, function(err, stat) {
        if (err)
          return next(err);
        if (stat.isDirectory())
          return next();
        self.emit('file', p, stat);
        self.send(p, stat);
      });
    }
  };
  SendStream.prototype.sendIndex = function sendIndex(path) {
    var i = -1;
    var self = this;
    function next(err) {
      if (++i >= self._index.length) {
        if (err)
          return self.onStatError(err);
        return self.error(404);
      }
      var p = join(path, self._index[i]);
      debug('stat "%s"', p);
      fs.stat(p, function(err, stat) {
        if (err)
          return next(err);
        if (stat.isDirectory())
          return next();
        self.emit('file', p, stat);
        self.send(p, stat);
      });
    }
    next();
  };
  SendStream.prototype.stream = function(path, options) {
    var finished = false;
    var self = this;
    var res = this.res;
    var req = this.req;
    var stream = fs.createReadStream(path, options);
    this.emit('stream', stream);
    stream.pipe(res);
    onFinished(res, function onfinished() {
      finished = true;
      destroy(stream);
    });
    stream.on('error', function onerror(err) {
      if (finished)
        return;
      finished = true;
      destroy(stream);
      self.onStatError(err);
    });
    stream.on('end', function onend() {
      self.emit('end');
    });
  };
  SendStream.prototype.type = function(path) {
    var res = this.res;
    if (res.getHeader('Content-Type'))
      return;
    var type = mime.lookup(path);
    var charset = mime.charsets.lookup(type);
    debug('content-type %s', type);
    res.setHeader('Content-Type', type + (charset ? '; charset=' + charset : ''));
  };
  SendStream.prototype.setHeader = function setHeader(path, stat) {
    var res = this.res;
    this.emit('headers', res, path, stat);
    if (!res.getHeader('Accept-Ranges'))
      res.setHeader('Accept-Ranges', 'bytes');
    if (!res.getHeader('Cache-Control'))
      res.setHeader('Cache-Control', 'public, max-age=' + Math.floor(this._maxage / 1000));
    if (this._lastModified && !res.getHeader('Last-Modified')) {
      var modified = stat.mtime.toUTCString();
      debug('modified %s', modified);
      res.setHeader('Last-Modified', modified);
    }
    if (this._etag && !res.getHeader('ETag')) {
      var val = etag(stat);
      debug('etag %s', val);
      res.setHeader('ETag', val);
    }
  };
  function containsDotFile(parts) {
    for (var i = 0; i < parts.length; i++) {
      if (parts[i][0] === '.') {
        return true;
      }
    }
    return false;
  }
  function decode(path) {
    try {
      return decodeURIComponent(path);
    } catch (err) {
      return -1;
    }
  }
  function normalizeList(val, name) {
    var list = [].concat(val || []);
    for (var i = 0; i < list.length; i++) {
      if (typeof list[i] !== 'string') {
        throw new TypeError(name + ' must be array of strings or false');
      }
    }
    return list;
  }
})(require("buffer").Buffer);
