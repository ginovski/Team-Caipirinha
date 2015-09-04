// Generated by CoffeeScript 1.6.2
var getsetdeep, typeChecker;

typeChecker = require('typechecker');

getsetdeep = {
  getDeep: function(location, keys) {
    var key, result, _ref;

    if (!typeChecker.isArray(keys)) {
      keys = keys.split('.');
    }
    if (keys.length === 0 || typeof location === 'undefined') {
      result = void 0;
    } else if (location === null) {
      result = null;
    } else {
      key = keys[0];
      location = (_ref = location.attributes) != null ? _ref : location;
      location = typeof location[key] === 'undefined' ? void 0 : location[key];
      if (keys.length === 1) {
        result = location;
      } else {
        result = this.getDeep(location, keys.slice(1));
      }
    }
    return result;
  },
  setDeep: function(location, keys, value, onlyIfEmpty) {
    var key, result, _ref, _ref1, _ref2;

    if (onlyIfEmpty == null) {
      onlyIfEmpty = false;
    }
    if (!typeChecker.isArray(keys)) {
      keys = keys.split('.');
    }
    if (keys.length === 0) {
      return void 0;
    }
    if (keys.length === 0 || typeof location === 'undefined') {
      result = void 0;
    } else if (location === null) {
      result = null;
    } else {
      key = keys[0];
      location = (_ref = location.attributes) != null ? _ref : location;
      if (keys.length === 1) {
        if (onlyIfEmpty) {
          if ((_ref1 = location[key]) == null) {
            location[key] = value;
          }
        } else {
          if (typeof value === 'undefined') {
            if (typeof location[key] !== 'undefined') {
              delete location[key];
            }
          } else {
            location[key] = value;
          }
        }
        result = location[key];
      } else {
        location = (_ref2 = location[key]) != null ? _ref2 : location[key] = {};
        result = this.setDeep(location, keys.slice(1), value, onlyIfEmpty);
      }
    }
    return result;
  }
};

module.exports = getsetdeep;