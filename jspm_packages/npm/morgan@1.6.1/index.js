/* */ 
(function(process) {
  'use strict';
  module.exports = morgan;
  module.exports.compile = compile;
  module.exports.format = format;
  module.exports.token = token;
  var auth = require("basic-auth");
  var debug = require("debug")('morgan');
  var deprecate = require("depd")('morgan');
  var onFinished = require("on-finished");
  var onHeaders = require("on-headers");
  var clfmonth = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  var defaultBufferDuration = 1000;
  function morgan(format, options) {
    var fmt = format;
    var opts = options || {};
    if (format && typeof format === 'object') {
      opts = format;
      fmt = opts.format || 'default';
      deprecate('morgan(options): use morgan(' + (typeof fmt === 'string' ? JSON.stringify(fmt) : 'format') + ', options) instead');
    }
    if (fmt === undefined) {
      deprecate('undefined format: specify a format');
    }
    var immediate = opts.immediate;
    var skip = opts.skip || false;
    var formatLine = typeof fmt !== 'function' ? getFormatFunction(fmt) : fmt;
    var buffer = opts.buffer;
    var stream = opts.stream || process.stdout;
    if (buffer) {
      deprecate('buffer option');
      var interval = typeof buffer !== 'number' ? defaultBufferDuration : buffer;
      stream = createBufferStream(stream, interval);
    }
    return function logger(req, res, next) {
      req._startAt = undefined;
      req._startTime = undefined;
      req._remoteAddress = getip(req);
      res._startAt = undefined;
      res._startTime = undefined;
      recordStartTime.call(req);
      function logRequest() {
        if (skip !== false && skip(req, res)) {
          debug('skip request');
          return;
        }
        var line = formatLine(morgan, req, res);
        if (null == line) {
          debug('skip line');
          return;
        }
        debug('log request');
        stream.write(line + '\n');
      }
      ;
      if (immediate) {
        logRequest();
      } else {
        onHeaders(res, recordStartTime);
        onFinished(res, logRequest);
      }
      next();
    };
  }
  morgan.format('combined', ':remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent"');
  morgan.format('common', ':remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length]');
  morgan.format('default', ':remote-addr - :remote-user [:date] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent"');
  deprecate.property(morgan, 'default', 'default format: use combined format');
  morgan.format('short', ':remote-addr :remote-user :method :url HTTP/:http-version :status :res[content-length] - :response-time ms');
  morgan.format('tiny', ':method :url :status :res[content-length] - :response-time ms');
  morgan.format('dev', function developmentFormatLine(tokens, req, res) {
    var status = res._header ? res.statusCode : undefined;
    var color = status >= 500 ? 31 : status >= 400 ? 33 : status >= 300 ? 36 : status >= 200 ? 32 : 0;
    var fn = developmentFormatLine[color];
    if (!fn) {
      fn = developmentFormatLine[color] = compile('\x1b[0m:method :url \x1b[' + color + 'm:status \x1b[0m:response-time ms - :res[content-length]\x1b[0m');
    }
    return fn(tokens, req, res);
  });
  morgan.token('url', function getUrlToken(req) {
    return req.originalUrl || req.url;
  });
  morgan.token('method', function getMethodToken(req) {
    return req.method;
  });
  morgan.token('response-time', function getResponseTimeToken(req, res) {
    if (!req._startAt || !res._startAt) {
      return;
    }
    var ms = (res._startAt[0] - req._startAt[0]) * 1e3 + (res._startAt[1] - req._startAt[1]) * 1e-6;
    return ms.toFixed(3);
  });
  morgan.token('date', function getDateToken(req, res, format) {
    var date = new Date();
    switch (format || 'web') {
      case 'clf':
        return clfdate(date);
      case 'iso':
        return date.toISOString();
      case 'web':
        return date.toUTCString();
    }
  });
  morgan.token('status', function getStatusToken(req, res) {
    return res._header ? String(res.statusCode) : undefined;
  });
  morgan.token('referrer', function getReferrerToken(req) {
    return req.headers['referer'] || req.headers['referrer'];
  });
  morgan.token('remote-addr', getip);
  morgan.token('remote-user', function getRemoteUserToken(req) {
    var credentials = auth(req);
    return credentials ? credentials.name : undefined;
  });
  morgan.token('http-version', function getHttpVersionToken(req) {
    return req.httpVersionMajor + '.' + req.httpVersionMinor;
  });
  morgan.token('user-agent', function getUserAgentToken(req) {
    return req.headers['user-agent'];
  });
  morgan.token('req', function getRequestToken(req, res, field) {
    var header = req.headers[field.toLowerCase()];
    return Array.isArray(header) ? header.join(', ') : header;
  });
  morgan.token('res', function getResponseTime(req, res, field) {
    if (!res._header) {
      return undefined;
    }
    var header = res.getHeader(field);
    return Array.isArray(header) ? header.join(', ') : header;
  });
  function clfdate(dateTime) {
    var date = dateTime.getUTCDate();
    var hour = dateTime.getUTCHours();
    var mins = dateTime.getUTCMinutes();
    var secs = dateTime.getUTCSeconds();
    var year = dateTime.getUTCFullYear();
    var month = clfmonth[dateTime.getUTCMonth()];
    return pad2(date) + '/' + month + '/' + year + ':' + pad2(hour) + ':' + pad2(mins) + ':' + pad2(secs) + ' +0000';
  }
  function compile(format) {
    if (typeof format !== 'string') {
      throw new TypeError('argument format must be a string');
    }
    var fmt = format.replace(/"/g, '\\"');
    var js = '  return "' + fmt.replace(/:([-\w]{2,})(?:\[([^\]]+)\])?/g, function(_, name, arg) {
      return '"\n    + (tokens["' + name + '"](req, res, ' + String(JSON.stringify(arg)) + ') || "-") + "';
    }) + '";';
    return new Function('tokens, req, res', js);
  }
  function createBufferStream(stream, interval) {
    var buf = [];
    var timer = null;
    function flush() {
      timer = null;
      stream.write(buf.join(''));
      buf.length = 0;
    }
    function write(str) {
      if (timer === null) {
        timer = setTimeout(flush, interval);
      }
      buf.push(str);
    }
    return {write: write};
  }
  function format(name, fmt) {
    morgan[name] = fmt;
    return this;
  }
  function getFormatFunction(name) {
    var fmt = morgan[name] || name || morgan.default;
    return typeof fmt !== 'function' ? compile(fmt) : fmt;
  }
  function getip(req) {
    return req.ip || req._remoteAddress || (req.connection && req.connection.remoteAddress) || undefined;
  }
  function pad2(num) {
    var str = String(num);
    return (str.length === 1 ? '0' : '') + str;
  }
  function recordStartTime() {
    this._startAt = process.hrtime();
    this._startTime = new Date();
  }
  function token(name, fn) {
    morgan[name] = fn;
    return this;
  }
})(require("process"));
