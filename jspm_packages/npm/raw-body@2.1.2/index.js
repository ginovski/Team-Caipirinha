/* */ 
(function(Buffer, process) {
  'use strict';
  var bytes = require("bytes");
  var iconv = require("iconv-lite");
  var unpipe = require("unpipe");
  module.exports = getRawBody;
  function getDecoder(encoding) {
    if (!encoding)
      return null;
    try {
      return iconv.getDecoder(encoding);
    } catch (e) {
      throw makeError('specified encoding unsupported', 'encoding.unsupported', {
        encoding: encoding,
        status: 415,
        statusCode: 415
      });
    }
  }
  function getRawBody(stream, options, callback) {
    var done = callback;
    var opts = options || {};
    if (options === true || typeof options === 'string') {
      opts = {encoding: options};
    }
    if (typeof options === 'function') {
      done = options;
      opts = {};
    }
    if (done !== undefined && typeof done !== 'function') {
      throw new TypeError('argument callback must be a function');
    }
    if (!done && !global.Promise) {
      throw new TypeError('argument callback is required');
    }
    var encoding = opts.encoding !== true ? opts.encoding : 'utf-8';
    var limit = bytes.parse(opts.limit);
    var length = opts.length != null && !isNaN(opts.length) ? parseInt(opts.length, 10) : null;
    if (done) {
      return readStream(stream, encoding, length, limit, done);
    }
    return new Promise(function executor(resolve, reject) {
      readStream(stream, encoding, length, limit, function onRead(err, buf) {
        if (err)
          return reject(err);
        resolve(buf);
      });
    });
  }
  function halt(stream) {
    unpipe(stream);
    if (typeof stream.pause === 'function') {
      stream.pause();
    }
  }
  function makeError(message, type, props) {
    var error = new Error();
    Error.captureStackTrace(error, makeError);
    for (var prop in props) {
      error[prop] = props[prop];
    }
    error.message = message;
    Object.defineProperty(error, 'type', {
      value: type,
      enumerable: true,
      writable: true,
      configurable: true
    });
    return error;
  }
  function readStream(stream, encoding, length, limit, callback) {
    if (limit !== null && length !== null && length > limit) {
      var err = makeError('request entity too large', 'entity.too.large', {
        expected: length,
        length: length,
        limit: limit,
        status: 413,
        statusCode: 413
      });
      return process.nextTick(function() {
        done(err);
      });
    }
    var state = stream._readableState;
    if (stream._decoder || (state && (state.encoding || state.decoder))) {
      var err = makeError('stream encoding should not be set', 'stream.encoding.set', {
        status: 500,
        statusCode: 500
      });
      return process.nextTick(function() {
        done(err);
      });
    }
    var received = 0;
    var decoder;
    try {
      decoder = getDecoder(encoding);
    } catch (err) {
      return process.nextTick(function() {
        done(err);
      });
    }
    var buffer = decoder ? '' : [];
    stream.on('aborted', onAborted);
    stream.on('data', onData);
    stream.once('end', onEnd);
    stream.once('error', onEnd);
    stream.once('close', cleanup);
    function done(err) {
      cleanup();
      if (err) {
        halt(stream);
      }
      callback.apply(this, arguments);
    }
    function onAborted() {
      done(makeError('request aborted', 'request.aborted', {
        code: 'ECONNABORTED',
        expected: length,
        length: length,
        received: received,
        status: 400,
        statusCode: 400
      }));
    }
    function onData(chunk) {
      received += chunk.length;
      decoder ? buffer += decoder.write(chunk) : buffer.push(chunk);
      if (limit !== null && received > limit) {
        done(makeError('request entity too large', 'entity.too.large', {
          limit: limit,
          received: received,
          status: 413,
          statusCode: 413
        }));
      }
    }
    function onEnd(err) {
      if (err)
        return done(err);
      if (length !== null && received !== length) {
        done(makeError('request size did not match content length', 'request.size.invalid', {
          expected: length,
          length: length,
          received: received,
          status: 400,
          statusCode: 400
        }));
      } else {
        var string = decoder ? buffer + (decoder.end() || '') : Buffer.concat(buffer);
        cleanup();
        done(null, string);
      }
    }
    function cleanup() {
      received = buffer = null;
      stream.removeListener('aborted', onAborted);
      stream.removeListener('data', onData);
      stream.removeListener('end', onEnd);
      stream.removeListener('error', onEnd);
      stream.removeListener('close', cleanup);
    }
  }
})(require("buffer").Buffer, require("process"));
