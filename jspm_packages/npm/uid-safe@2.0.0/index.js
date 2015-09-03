/* */ 
(function(Buffer) {
  'use strict';
  var crypto = require("crypto");
  var escape = require("base64-url").escape;
  module.exports = uid;
  module.exports.sync = uidSync;
  function uid(length, callback) {
    if (callback !== undefined && typeof callback !== 'function') {
      throw new TypeError('argument callback must be a function');
    }
    if (!callback && !global.Promise) {
      throw new TypeError('argument callback is required');
    }
    if (callback) {
      return generateUid(length, callback);
    }
    return new Promise(function executor(resolve, reject) {
      generateUid(length, function onUid(err, str) {
        if (err)
          return reject(err);
        resolve(str);
      });
    });
  }
  function uidSync(length) {
    try {
      return toString(crypto.randomBytes(length));
    } catch (e) {
      return toString(crypto.pseudoRandomBytes(length));
    }
  }
  function generateUid(length, callback) {
    randomBytes(length, function(err, buf) {
      if (err)
        return callback(err);
      callback(null, toString(buf));
    });
  }
  function randomBytes(length, callback) {
    crypto.randomBytes(length, function(err, buf) {
      if (!err)
        return callback(null, buf);
      crypto.pseudoRandomBytes(length, function(err, buf) {
        if (err)
          return callback(err);
        callback(null, buf);
      });
    });
  }
  function toString(buf) {
    return escape(buf.toString('base64'));
  }
})(require("buffer").Buffer);
