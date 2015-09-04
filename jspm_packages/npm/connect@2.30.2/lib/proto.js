/* */ 
(function(process) {
  var finalhandler = require("finalhandler");
  var http = require("http");
  var debug = require("debug")('connect:dispatcher');
  var parseUrl = require("parseurl");
  var app = module.exports = {};
  var env = process.env.NODE_ENV || 'development';
  var defer = typeof setImmediate === 'function' ? setImmediate : function(fn) {
    process.nextTick(fn.bind.apply(fn, arguments));
  };
  app.use = function(route, fn) {
    if ('string' != typeof route) {
      fn = route;
      route = '/';
    }
    if ('function' == typeof fn.handle) {
      var server = fn;
      fn.route = route;
      fn = function(req, res, next) {
        server.handle(req, res, next);
      };
    }
    if (fn instanceof http.Server) {
      fn = fn.listeners('request')[0];
    }
    if ('/' == route[route.length - 1]) {
      route = route.slice(0, -1);
    }
    debug('use %s %s', route || '/', fn.name || 'anonymous');
    this.stack.push({
      route: route,
      handle: fn
    });
    return this;
  };
  app.handle = function(req, res, out) {
    var stack = this.stack,
        searchIndex = req.url.indexOf('?'),
        pathlength = searchIndex !== -1 ? searchIndex : req.url.length,
        fqdn = req.url[0] !== '/' && 1 + req.url.substr(0, pathlength).indexOf('://'),
        protohost = fqdn ? req.url.substr(0, req.url.indexOf('/', 2 + fqdn)) : '',
        removed = '',
        slashAdded = false,
        index = 0;
    var done = out || finalhandler(req, res, {
      env: env,
      onerror: logerror
    });
    function next(err) {
      var layer,
          path,
          c;
      if (slashAdded) {
        req.url = req.url.substr(1);
        slashAdded = false;
      }
      req.url = protohost + removed + req.url.substr(protohost.length);
      req.originalUrl = req.originalUrl || req.url;
      removed = '';
      layer = stack[index++];
      if (!layer) {
        defer(done, err);
        return;
      }
      try {
        path = parseUrl(req).pathname;
        if (undefined == path)
          path = '/';
        if (0 != path.toLowerCase().indexOf(layer.route.toLowerCase()))
          return next(err);
        c = path[layer.route.length];
        if (c && '/' != c && '.' != c)
          return next(err);
        removed = layer.route;
        req.url = protohost + req.url.substr(protohost.length + removed.length);
        if (!fqdn && '/' != req.url[0]) {
          req.url = '/' + req.url;
          slashAdded = true;
        }
        debug('%s %s : %s', layer.handle.name || 'anonymous', layer.route, req.originalUrl);
        var arity = layer.handle.length;
        if (err) {
          if (arity === 4) {
            layer.handle(err, req, res, next);
          } else {
            next(err);
          }
        } else if (arity < 4) {
          layer.handle(req, res, next);
        } else {
          next();
        }
      } catch (e) {
        next(e);
      }
    }
    next();
  };
  app.listen = function() {
    var server = http.createServer(this);
    return server.listen.apply(server, arguments);
  };
  function logerror(err) {
    if (env !== 'test')
      console.error(err.stack || err.toString());
  }
})(require("process"));
