/* */ 
var deprecate = require("depd")('connect');
var utils = require("../utils"),
    parseurl = require("parseurl"),
    Cache = require("../cache"),
    fresh = require("fresh");
var merge = require("utils-merge");
module.exports = function staticCache(options) {
  var options = options || {},
      cache = new Cache(options.maxObjects || 128),
      maxlen = options.maxLength || 1024 * 256;
  return function staticCache(req, res, next) {
    var key = cacheKey(req),
        ranges = req.headers.range,
        hasCookies = req.headers.cookie,
        hit = cache.get(key);
    req.on('static', function(stream) {
      var headers = res._headers,
          cc = utils.parseCacheControl(headers['cache-control'] || ''),
          contentLength = headers['content-length'],
          hit;
      if (headers['set-cookie'])
        return hasCookies = true;
      if (hasCookies)
        return;
      if (!contentLength || contentLength > maxlen)
        return;
      if (headers['content-range'])
        return;
      if (cc['no-cache'] || cc['no-store'] || cc['private'] || cc['must-revalidate'])
        return;
      if (hit = cache.get(key)) {
        if (headers.etag == hit[0].etag) {
          hit[0].date = new Date;
          return;
        } else {
          cache.remove(key);
        }
      }
      if (null == stream)
        return;
      var arr = [];
      stream.on('data', function(chunk) {
        arr.push(chunk);
      });
      stream.on('end', function() {
        var cacheEntry = cache.add(key);
        delete headers['x-cache'];
        cacheEntry.push(200);
        cacheEntry.push(headers);
        cacheEntry.push.apply(cacheEntry, arr);
      });
    });
    if (req.method == 'GET' || req.method == 'HEAD') {
      if (ranges) {
        next();
      } else if (!hasCookies && hit && !mustRevalidate(req, hit)) {
        res.setHeader('X-Cache', 'HIT');
        respondFromCache(req, res, hit);
      } else {
        res.setHeader('X-Cache', 'MISS');
        next();
      }
    } else {
      next();
    }
  };
};
module.exports = deprecate.function(module.exports, 'staticCache: use varnish or similar reverse proxy caches');
function respondFromCache(req, res, cacheEntry) {
  var status = cacheEntry[0],
      headers = merge({}, cacheEntry[1]),
      content = cacheEntry.slice(2);
  headers.age = (new Date - new Date(headers.date)) / 1000 || 0;
  switch (req.method) {
    case 'HEAD':
      res.writeHead(status, headers);
      res.end();
      break;
    case 'GET':
      if (fresh(req.headers, headers)) {
        headers['content-length'] = 0;
        res.writeHead(304, headers);
        res.end();
      } else {
        res.writeHead(status, headers);
        function write() {
          while (content.length) {
            if (false === res.write(content.shift())) {
              res.once('drain', write);
              return;
            }
          }
          res.end();
        }
        write();
      }
      break;
    default:
      res.writeHead(500, '');
      res.end();
  }
}
function mustRevalidate(req, cacheEntry) {
  var cacheHeaders = cacheEntry[1],
      reqCC = utils.parseCacheControl(req.headers['cache-control'] || ''),
      cacheCC = utils.parseCacheControl(cacheHeaders['cache-control'] || ''),
      cacheAge = (new Date - new Date(cacheHeaders.date)) / 1000 || 0;
  if (cacheCC['no-cache'] || cacheCC['must-revalidate'] || cacheCC['proxy-revalidate'])
    return true;
  if (reqCC['no-cache'])
    return true;
  if (null != reqCC['max-age'])
    return reqCC['max-age'] < cacheAge;
  if (null != cacheCC['max-age'])
    return cacheCC['max-age'] < cacheAge;
  return false;
}
function cacheKey(req) {
  return parseurl(req).path;
}
