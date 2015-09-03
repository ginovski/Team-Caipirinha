/* */ 
var multipart = require("./multipart"),
    urlencoded = require("./urlencoded"),
    json = require("./json");
exports = module.exports = function bodyParser(options) {
  var _urlencoded = urlencoded(options),
      _multipart = multipart(options),
      _json = json(options);
  return function bodyParser(req, res, next) {
    _json(req, res, function(err) {
      if (err)
        return next(err);
      _urlencoded(req, res, function(err) {
        if (err)
          return next(err);
        _multipart(req, res, next);
      });
    });
  };
};
