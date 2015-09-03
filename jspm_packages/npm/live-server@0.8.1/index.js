/* */ 
(function(process) {
  var fs = require("fs"),
      connect = require("connect"),
      colors = require("colors"),
      WebSocket = require("faye-websocket"),
      path = require("path"),
      url = require("url"),
      http = require("http"),
      send = require("send"),
      open = require("open"),
      es = require("event-stream"),
      watchr = require("watchr");
  var INJECTED_CODE = fs.readFileSync(__dirname + "/injected.html", "utf8");
  var LiveServer = {};
  function escape(html) {
    return String(html).replace(/&(?!\w+;)/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function staticServer(root) {
    return function(req, res, next) {
      if ('GET' != req.method && 'HEAD' != req.method)
        return next();
      var reqpath = url.parse(req.url).pathname;
      var hasNoOrigin = !req.headers.origin;
      var doInject = false;
      function directory() {
        var pathname = url.parse(req.originalUrl).pathname;
        res.statusCode = 301;
        res.setHeader('Location', pathname + '/');
        res.end('Redirecting to ' + escape(pathname) + '/');
      }
      function file(filepath, stat) {
        var x = path.extname(filepath);
        if (hasNoOrigin && (x === "" || x == ".html" || x == ".htm" || x == ".xhtml" || x == ".php")) {
          var contents = fs.readFileSync(filepath, "utf8");
          doInject = contents.indexOf("</body>") > -1;
        }
      }
      function error(err) {
        if (404 == err.status)
          return next();
        next(err);
      }
      function inject(stream) {
        if (doInject) {
          var len = INJECTED_CODE.length + res.getHeader('Content-Length');
          res.setHeader('Content-Length', len);
          var originalPipe = stream.pipe;
          stream.pipe = function(res) {
            originalPipe.call(stream, es.replace(new RegExp("</body>", "i"), INJECTED_CODE + "</body>")).pipe(res);
          };
        }
      }
      send(req, reqpath, {root: root}).on('error', error).on('directory', directory).on('file', file).on('stream', inject).pipe(res);
    };
  }
  function entryPoint(staticHandler, file) {
    if (!file)
      return function(req, res, next) {
        next();
      };
    return function(req, res, next) {
      req.url = "/" + file;
      staticHandler(req, res, next);
    };
  }
  LiveServer.start = function(options) {
    options = options || {};
    var host = options.host || '0.0.0.0';
    var port = options.port || 8080;
    var root = options.root || process.cwd();
    var logLevel = options.logLevel === undefined ? 2 : options.logLevel;
    var openPath = (options.open === undefined || options.open === true) ? "" : ((options.open === null || options.open === false) ? null : options.open);
    if (options.noBrowser)
      openPath = null;
    var file = options.file;
    var staticServerHandler = staticServer(root);
    var wait = options.wait || 0;
    var app = connect().use(staticServerHandler).use(entryPoint(staticServerHandler, file)).use(connect.directory(root, {icons: true}));
    if (logLevel >= 2)
      app.use(connect.logger('dev'));
    var server = http.createServer(app);
    server.addListener('error', function(e) {
      if (e.code == 'EADDRINUSE') {
        var serveURL = 'http://' + host + ':' + port;
        console.log('%s is already in use. Trying another port.'.red, serveURL);
        setTimeout(function() {
          server.listen(0, host);
        }, 1000);
      }
    });
    server.addListener('listening', function(e) {
      var address = server.address();
      var serveHost = address.address == "0.0.0.0" ? "127.0.0.1" : address.address;
      var serveURL = 'http://' + serveHost + ':' + address.port;
      if (logLevel >= 1) {
        console.log(("Serving \"%s\" at %s").green, root, serveURL);
      }
      if (openPath !== null)
        open(serveURL + openPath);
    });
    server.listen(port, host);
    var clients = [];
    server.addListener('upgrade', function(request, socket, head) {
      var ws = new WebSocket(request, socket, head);
      ws.onopen = function() {
        ws.send('connected');
      };
      if (wait > 0) {
        (function(ws) {
          var wssend = ws.send;
          var waitTimeout;
          ws.send = function() {
            var args = arguments;
            if (waitTimeout)
              clearTimeout(waitTimeout);
            waitTimeout = setTimeout(function() {
              wssend.apply(ws, args);
            }, wait);
          };
        })(ws);
      }
      ws.onclose = function() {
        clients = clients.filter(function(x) {
          return x !== ws;
        });
      };
      clients.push(ws);
    });
    watchr.watch({
      path: root,
      ignorePaths: options.ignore || false,
      ignoreCommonPatterns: true,
      ignoreHiddenFiles: true,
      preferredMethods: ['watchFile', 'watch'],
      interval: 1407,
      listeners: {
        error: function(err) {
          console.log("ERROR:".red, err);
        },
        change: function(eventName, filePath, fileCurrentStat, filePreviousStat) {
          clients.forEach(function(ws) {
            if (!ws)
              return;
            if (path.extname(filePath) == ".css") {
              ws.send('refreshcss');
              if (logLevel >= 1)
                console.log("CSS change detected".magenta);
            } else {
              ws.send('reload');
              if (logLevel >= 1)
                console.log("File change detected".cyan);
            }
          });
        }
      }
    });
  };
  module.exports = LiveServer;
})(require("process"));
