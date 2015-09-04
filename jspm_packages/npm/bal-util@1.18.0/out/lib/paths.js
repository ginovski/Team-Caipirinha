/* */ 
(function(Buffer, process) {
  var TaskGroup,
      balUtilFlow,
      balUtilPaths,
      extendr,
      pathUtil,
      safefs,
      typeChecker,
      _ref,
      _ref1,
      __indexOf = [].indexOf || function(item) {
        for (var i = 0,
            l = this.length; i < l; i++) {
          if (i in this && this[i] === item)
            return i;
        }
        return -1;
      },
      __slice = [].slice,
      __hasProp = {}.hasOwnProperty;
  pathUtil = require("path");
  typeChecker = require("typechecker");
  extendr = require("extendr");
  safefs = require("safefs");
  TaskGroup = require("taskgroup");
  balUtilFlow = require("./flow");
  balUtilPaths = extendr.extend({}, safefs, {
    ignoreCommonPatterns: (_ref = process.env.NODE_IGNORE_COMMON_PATTERNS) != null ? _ref : /^((~|\.\#).*|.*(\.swp)|\.(svn|git|hg|DS_Store)|node_modules|CVS|thumbs\.db|desktop\.ini)$/i,
    ignoreCustomPatterns: (_ref1 = process.env.NODE_IGNORE_CUSTOM_PATTERNS) != null ? _ref1 : null,
    textExtensions: ['c', 'coffee', 'coffeekup', 'cson', 'css', 'eco', 'haml', 'hbs', 'htaccess', 'htm', 'html', 'jade', 'js', 'json', 'less', 'md', 'php', 'phtml', 'py', 'rb', 'rtf', 'sass', 'scss', 'styl', 'stylus', 'text', 'txt', 'xml', 'yaml'].concat((process.env.TEXT_EXTENSIONS || '').split(/[\s,]+/)),
    binaryExtensions: ['dds', 'eot', 'gif', 'ico', 'jar', 'jpeg', 'jpg', 'pdf', 'png', 'swf', 'tga', 'ttf', 'zip'].concat((process.env.BINARY_EXTENSIONS || '').split(/[\s,]+/)),
    isTextSync: function(filename, buffer) {
      var extension,
          isText,
          _i,
          _len;
      isText = null;
      if (filename) {
        filename = pathUtil.basename(filename).split('.');
        for (_i = 0, _len = filename.length; _i < _len; _i++) {
          extension = filename[_i];
          if (__indexOf.call(balUtilPaths.textExtensions, extension) >= 0) {
            isText = true;
            break;
          }
          if (__indexOf.call(balUtilPaths.binaryExtensions, extension) >= 0) {
            isText = false;
            break;
          }
        }
      }
      if (buffer && isText === null) {
        isText = balUtilPaths.getEncodingSync(buffer) === 'utf8';
      }
      return isText;
    },
    isText: function(filename, buffer, next) {
      var result;
      result = this.isTextSync(filename, buffer);
      if (result instanceof Error) {
        next(err);
      } else {
        next(null, result);
      }
      return this;
    },
    getEncodingSync: function(buffer, opts) {
      var binaryEncoding,
          charCode,
          chunkBegin,
          chunkEnd,
          chunkLength,
          contentChunkUTF8,
          encoding,
          i,
          textEncoding,
          _i,
          _ref2;
      textEncoding = 'utf8';
      binaryEncoding = 'binary';
      if (opts == null) {
        chunkLength = 24;
        encoding = balUtilPaths.getEncodingSync(buffer, {
          chunkLength: chunkLength,
          chunkBegin: chunkBegin
        });
        if (encoding === textEncoding) {
          chunkBegin = Math.max(0, Math.floor(buffer.length / 2) - chunkLength);
          encoding = balUtilPaths.getEncodingSync(buffer, {
            chunkLength: chunkLength,
            chunkBegin: chunkBegin
          });
          if (encoding === textEncoding) {
            chunkBegin = Math.max(0, buffer.length - chunkLength);
            encoding = balUtilPaths.getEncodingSync(buffer, {
              chunkLength: chunkLength,
              chunkBegin: chunkBegin
            });
          }
        }
      } else {
        chunkLength = opts.chunkLength, chunkBegin = opts.chunkBegin;
        if (chunkLength == null) {
          chunkLength = 24;
        }
        if (chunkBegin == null) {
          chunkBegin = 0;
        }
        chunkEnd = Math.min(buffer.length, chunkBegin + chunkLength);
        contentChunkUTF8 = buffer.toString(textEncoding, chunkBegin, chunkEnd);
        encoding = textEncoding;
        for (i = _i = 0, _ref2 = contentChunkUTF8.length; 0 <= _ref2 ? _i < _ref2 : _i > _ref2; i = 0 <= _ref2 ? ++_i : --_i) {
          charCode = contentChunkUTF8.charCodeAt(i);
          if (charCode === 65533 || charCode <= 8) {
            encoding = binaryEncoding;
            break;
          }
        }
      }
      return encoding;
    },
    getEncoding: function(buffer, opts, next) {
      var result;
      result = this.getEncodingSync(buffer, opts);
      if (result instanceof Error) {
        next(err);
      } else {
        next(null, result);
      }
      return this;
    },
    cp: function(src, dst, next) {
      safefs.readFile(src, 'binary', function(err, data) {
        if (err) {
          return next(err);
        }
        return safefs.writeFile(dst, data, 'binary', function(err) {
          return next(err);
        });
      });
      return this;
    },
    prefixPathSync: function(path, parentPath) {
      path = path.replace(/[\/\\]$/, '');
      if (/^([a-zA-Z]\:|\/)/.test(path) === false) {
        path = pathUtil.join(parentPath, path);
      }
      return path;
    },
    isDirectory: function(path, next) {
      if ((path != null ? path.isDirectory : void 0) != null) {
        return next(null, path.isDirectory(), path);
      } else {
        safefs.stat(path, function(err, stat) {
          if (err) {
            return next(err);
          }
          return next(null, stat.isDirectory(), stat);
        });
      }
      return this;
    },
    generateSlugSync: function(path) {
      var result;
      result = path.replace(/[^a-zA-Z0-9]/g, '-').replace(/^-/, '').replace(/-+/, '-');
      return result;
    },
    scanlist: function(path, next) {
      balUtilPaths.scandir({
        path: path,
        readFiles: true,
        ignoreHiddenFiles: true,
        next: function(err, list) {
          return next(err, list);
        }
      });
      return this;
    },
    scantree: function(path, next) {
      balUtilPaths.scandir({
        path: path,
        readFiles: true,
        ignoreHiddenFiles: true,
        next: function(err, list, tree) {
          return next(err, tree);
        }
      });
      return this;
    },
    testIgnorePatterns: function() {
      var args;
      args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      return this.isIgnoredPath.apply(this, args);
    },
    isIgnoredPath: function(path, opts) {
      var basename,
          ignorePath,
          result,
          _i,
          _len,
          _ref2,
          _ref3,
          _ref4,
          _ref5,
          _ref6;
      if (opts == null) {
        opts = {};
      }
      result = false;
      basename = pathUtil.basename(path);
      if ((_ref2 = opts.ignorePaths) == null) {
        opts.ignorePaths = false;
      }
      if ((_ref3 = opts.ignoreHiddenFiles) == null) {
        opts.ignoreHiddenFiles = false;
      }
      if ((_ref4 = opts.ignoreCommonPatterns) == null) {
        opts.ignoreCommonPatterns = true;
      }
      if ((_ref5 = opts.ignoreCustomPatterns) == null) {
        opts.ignoreCustomPatterns = false;
      }
      if (opts.ignoreCommonPatterns === true) {
        opts.ignoreCommonPatterns = balUtilPaths.ignoreCommonPatterns;
      }
      if (opts.ignorePaths) {
        _ref6 = opts.ignorePaths;
        for (_i = 0, _len = _ref6.length; _i < _len; _i++) {
          ignorePath = _ref6[_i];
          if (path.indexOf(ignorePath) === 0) {
            result = true;
            break;
          }
        }
      }
      result = result || (opts.ignoreHiddenFiles && /^\./.test(basename)) || (opts.ignoreCommonPatterns && opts.ignoreCommonPatterns.test(basename)) || (opts.ignoreCustomPatterns && opts.ignoreCustomPatterns.test(basename)) || false;
      return result;
    },
    scandir: function() {
      var args,
          err,
          list,
          opts,
          tasks,
          tree,
          _ref2,
          _ref3,
          _ref4,
          _ref5,
          _ref6,
          _ref7,
          _ref8;
      args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      list = {};
      tree = {};
      if (args.length === 1) {
        opts = args[0];
      } else if (args.length >= 4) {
        opts = {
          path: args[0],
          fileAction: args[1] || null,
          dirAction: args[2] || null,
          next: args[3] || null
        };
      } else {
        err = new Error('balUtilPaths.scandir: unsupported arguments');
        if (next) {
          return next(err);
        } else {
          throw err;
        }
      }
      if ((_ref2 = opts.recurse) == null) {
        opts.recurse = true;
      }
      if ((_ref3 = opts.readFiles) == null) {
        opts.readFiles = false;
      }
      if ((_ref4 = opts.ignorePaths) == null) {
        opts.ignorePaths = false;
      }
      if ((_ref5 = opts.ignoreHiddenFiles) == null) {
        opts.ignoreHiddenFiles = false;
      }
      if ((_ref6 = opts.ignoreCommonPatterns) == null) {
        opts.ignoreCommonPatterns = false;
      }
      if (opts.action != null) {
        if ((_ref7 = opts.fileAction) == null) {
          opts.fileAction = opts.action;
        }
        if ((_ref8 = opts.dirAction) == null) {
          opts.dirAction = opts.action;
        }
      }
      if (opts.parentPath && !opts.path) {
        opts.path = opts.parentPath;
      }
      if (!opts.path) {
        err = new Error('balUtilPaths.scandir: path is needed');
        if (next) {
          return next(err);
        } else {
          throw err;
        }
      }
      tasks = new TaskGroup(function(err) {
        return opts.next(err, list, tree);
      });
      safefs.readdir(opts.path, function(err, files) {
        if (tasks.exited) {
          return;
        } else if (err) {
          return tasks.exit(err);
        }
        tasks.total += files.length;
        if (!files.length) {
          return tasks.exit();
        } else {
          return files.forEach(function(file) {
            var fileFullPath,
                fileRelativePath,
                isIgnoredFile;
            fileFullPath = pathUtil.join(opts.path, file);
            fileRelativePath = opts.relativePath ? pathUtil.join(opts.relativePath, file) : file;
            isIgnoredFile = balUtilPaths.isIgnoredPath(fileFullPath, {
              ignorePaths: opts.ignorePaths,
              ignoreHiddenFiles: opts.ignoreHiddenFiles,
              ignoreCommonPatterns: opts.ignoreCommonPatterns,
              ignoreCustomPatterns: opts.ignoreCustomPatterns
            });
            if (isIgnoredFile) {
              return tasks.complete();
            }
            return balUtilPaths.isDirectory(fileFullPath, function(err, isDirectory, fileStat) {
              var complete;
              if (tasks.exited) {} else if (err) {
                return tasks.exit(err);
              } else if (isDirectory) {
                complete = function(err, skip, subtreeCallback) {
                  if (err) {
                    return tasks.exit(err);
                  }
                  if (tasks.exited) {
                    return tasks.exit();
                  }
                  if (skip !== true) {
                    list[fileRelativePath] = 'dir';
                    tree[file] = {};
                    if (!opts.recurse) {
                      return tasks.complete();
                    } else {
                      return balUtilPaths.scandir({
                        path: fileFullPath,
                        relativePath: fileRelativePath,
                        fileAction: opts.fileAction,
                        dirAction: opts.dirAction,
                        readFiles: opts.readFiles,
                        ignorePaths: opts.ignorePaths,
                        ignoreHiddenFiles: opts.ignoreHiddenFiles,
                        ignoreCommonPatterns: opts.ignoreCommonPatterns,
                        ignoreCustomPatterns: opts.ignoreCustomPatterns,
                        recurse: opts.recurse,
                        stat: opts.fileStat,
                        next: function(err, _list, _tree) {
                          var filePath,
                              fileType;
                          tree[file] = _tree;
                          for (filePath in _list) {
                            if (!__hasProp.call(_list, filePath))
                              continue;
                            fileType = _list[filePath];
                            list[filePath] = fileType;
                          }
                          if (tasks.exited) {
                            return tasks.exit();
                          } else if (err) {
                            return tasks.exit(err);
                          } else if (subtreeCallback) {
                            return subtreeCallback(tasks.completer());
                          } else {
                            return tasks.complete();
                          }
                        }
                      });
                    }
                  } else {
                    return tasks.complete();
                  }
                };
                if (opts.dirAction) {
                  return opts.dirAction(fileFullPath, fileRelativePath, complete, fileStat);
                } else if (opts.dirAction === false) {
                  return complete(err, true);
                } else {
                  return complete(err, false);
                }
              } else {
                complete = function(err, skip) {
                  if (err) {
                    return tasks.exit(err);
                  }
                  if (tasks.exited) {
                    return tasks.exit();
                  }
                  if (skip) {
                    return tasks.complete();
                  } else {
                    if (opts.readFiles) {
                      return safefs.readFile(fileFullPath, function(err, data) {
                        var dataString;
                        if (err) {
                          return tasks.exit(err);
                        }
                        dataString = data.toString();
                        list[fileRelativePath] = dataString;
                        tree[file] = dataString;
                        return tasks.complete();
                      });
                    } else {
                      list[fileRelativePath] = 'file';
                      tree[file] = true;
                      return tasks.complete();
                    }
                  }
                };
                if (opts.fileAction) {
                  return opts.fileAction(fileFullPath, fileRelativePath, complete, fileStat);
                } else if (opts.fileAction === false) {
                  return complete(err, true);
                } else {
                  return complete(err, false);
                }
              }
            });
          });
        }
      });
      return this;
    },
    cpdir: function() {
      var args,
          err,
          next,
          opt,
          opts,
          outPath,
          scandirOpts,
          srcPath,
          _i,
          _len,
          _ref2;
      args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      opts = {};
      if (args.length === 1) {
        opts = args[0];
      } else if (args.length >= 3) {
        srcPath = args[0], outPath = args[1], next = args[2];
        opts = {
          srcPath: srcPath,
          outPath: outPath,
          next: next
        };
      } else {
        err = new Error('balUtilPaths.cpdir: unknown arguments');
        if (next) {
          return next(err);
        } else {
          throw err;
        }
      }
      scandirOpts = {
        path: opts.srcPath,
        fileAction: function(fileSrcPath, fileRelativePath, next) {
          var fileOutPath;
          fileOutPath = pathUtil.join(opts.outPath, fileRelativePath);
          return safefs.ensurePath(pathUtil.dirname(fileOutPath), function(err) {
            if (err) {
              return next(err);
            }
            return balUtilPaths.cp(fileSrcPath, fileOutPath, function(err) {
              return next(err);
            });
          });
        },
        next: opts.next
      };
      _ref2 = ['ignorePaths', 'ignoreHiddenFiles', 'ignoreCommonPatterns', 'ignoreCustomPatterns'];
      for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
        opt = _ref2[_i];
        scandirOpts[opt] = opts[opt];
      }
      balUtilPaths.scandir(scandirOpts);
      return this;
    },
    rpdir: function() {
      var args,
          err,
          next,
          opt,
          opts,
          outPath,
          scandirOpts,
          srcPath,
          _i,
          _len,
          _ref2;
      args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      opts = {};
      if (args.length === 1) {
        opts = args[0];
      } else if (args.length >= 3) {
        srcPath = args[0], outPath = args[1], next = args[2];
        opts = {
          srcPath: srcPath,
          outPath: outPath,
          next: next
        };
      } else {
        err = new Error('balUtilPaths.cpdir: unknown arguments');
        if (next) {
          return next(err);
        } else {
          throw err;
        }
      }
      scandirOpts = {
        path: opts.srcPath,
        fileAction: function(fileSrcPath, fileRelativePath, next) {
          var fileOutPath;
          fileOutPath = pathUtil.join(opts.outPath, fileRelativePath);
          return safefs.ensurePath(pathUtil.dirname(fileOutPath), function(err) {
            if (err) {
              return next(err);
            }
            return balUtilPaths.isPathOlderThan(fileOutPath, fileSrcPath, function(err, older) {
              if (older === true || older === null) {
                return balUtilPaths.cp(fileSrcPath, fileOutPath, function(err) {
                  return next(err);
                });
              } else {
                return next();
              }
            });
          });
        },
        next: opts.next
      };
      _ref2 = ['ignorePaths', 'ignoreHiddenFiles', 'ignoreCommonPatterns', 'ignoreCustomPatterns'];
      for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
        opt = _ref2[_i];
        scandirOpts[opt] = opts[opt];
      }
      balUtilPaths.scandir(scandirOpts);
      return this;
    },
    rmdirDeep: function(parentPath, next) {
      safefs.exists(parentPath, function(exists) {
        if (!exists) {
          return next();
        }
        return balUtilPaths.scandir(parentPath, function(fileFullPath, fileRelativePath, next) {
          return safefs.unlink(fileFullPath, function(err) {
            return next(err);
          });
        }, function(fileFullPath, fileRelativePath, next) {
          return next(null, false, function(next) {
            return balUtilPaths.rmdirDeep(fileFullPath, function(err) {
              return next(err);
            });
          });
        }, function(err, list, tree) {
          if (err) {
            return next(err, list, tree);
          }
          return safefs.rmdir(parentPath, function(err) {
            return next(err, list, tree);
          });
        });
      });
      return this;
    },
    writetree: function(dstPath, tree, next) {
      var tasks;
      tasks = new TaskGroup(function(err) {
        return next(err);
      });
      safefs.ensurePath(dstPath, function(err) {
        var fileFullPath,
            fileRelativePath,
            value;
        if (err) {
          return tasks.exit(err);
        }
        for (fileRelativePath in tree) {
          if (!__hasProp.call(tree, fileRelativePath))
            continue;
          value = tree[fileRelativePath];
          ++tasks.total;
          fileFullPath = pathUtil.join(dstPath, fileRelativePath.replace(/^\/+/, ''));
          if (typeChecker.isObject(value)) {
            balUtilPaths.writetree(fileFullPath, value, tasks.completer());
          } else {
            safefs.writeFile(fileFullPath, value, function(err) {
              return tasks.complete(err);
            });
          }
        }
        if (tasks.total === 0) {
          tasks.exit();
        }
      });
      return this;
    },
    readPath: function(filePath, opts, next) {
      var data,
          err,
          http,
          req,
          requestOpts,
          tasks,
          zlib,
          _ref2,
          _ref3,
          _ref4,
          _ref5,
          _ref6,
          _ref7;
      _ref2 = balUtilFlow.extractOptsAndCallback(opts, next), opts = _ref2[0], next = _ref2[1];
      if (/^http/.test(filePath)) {
        data = '';
        tasks = new TaskGroup(function(err) {
          if (err) {
            return next(err);
          }
          return next(null, data);
        });
        requestOpts = require("url").parse(filePath);
        if ((_ref3 = requestOpts.path) == null) {
          requestOpts.path = requestOpts.pathname;
        }
        if ((_ref4 = requestOpts.method) == null) {
          requestOpts.method = 'GET';
        }
        if ((_ref5 = requestOpts.headers) == null) {
          requestOpts.headers = {};
        }
        http = requestOpts.protocol === 'https:' ? require("https") : require("http");
        zlib = null;
        try {
          zlib = require("zlib");
        } catch (_error) {
          err = _error;
        }
        req = http.request(requestOpts, function(res) {
          res.on('data', function(chunk) {
            return tasks.push(function(complete) {
              if (res.headers['content-encoding'] === 'gzip' && Buffer.isBuffer(chunk)) {
                if (zlib === null) {
                  err = new Error('Gzip encoding not supported on this environment');
                  return complete(err);
                }
                return zlib.unzip(chunk, function(err, chunk) {
                  if (err) {
                    return complete(err);
                  }
                  data += chunk;
                  return complete();
                });
              } else {
                data += chunk;
                return complete();
              }
            });
          });
          return res.on('end', function() {
            var locationHeader,
                _ref6;
            locationHeader = ((_ref6 = res.headers) != null ? _ref6.location : void 0) || null;
            if (locationHeader && locationHeader !== requestOpts.href) {
              return balUtilPaths.readPath(locationHeader, function(err, _data) {
                if (err) {
                  return tasks.exit(err);
                }
                data = _data;
                return tasks.exit();
              });
            } else {
              return tasks.run('serial');
            }
          });
        });
        if ((_ref6 = req.setTimeout) == null) {
          req.setTimeout = function(delay) {
            return setTimeout((function() {
              req.abort();
              return tasks.exit(new Error('Request timed out'));
            }), delay);
          };
        }
        req.setTimeout((_ref7 = opts.timeout) != null ? _ref7 : 10 * 1000);
        req.on('error', function(err) {
          return tasks.exit(err);
        }).on('timeout', function() {
          return req.abort();
        });
        req.end();
      } else {
        safefs.readFile(filePath, function(err, data) {
          if (err) {
            return next(err);
          }
          return next(null, data);
        });
      }
      return this;
    },
    empty: function(filePath, next) {
      safefs.exists(filePath, function(exists) {
        if (!exists) {
          return next(null, true);
        }
        return safefs.stat(filePath, function(err, stat) {
          if (err) {
            return next(err);
          }
          return next(null, stat.size === 0);
        });
      });
      return this;
    },
    isPathOlderThan: function(aPath, bInput, next) {
      var bMtime,
          bPath,
          mode;
      bMtime = null;
      if (typeChecker.isNumber(bInput)) {
        mode = 'time';
        bMtime = new Date(new Date() - bInput);
      } else {
        mode = 'path';
        bPath = bInput;
      }
      balUtilPaths.empty(aPath, function(err, empty) {
        if (empty || err) {
          return next(err, null);
        }
        return safefs.stat(aPath, function(err, aStat) {
          var compare;
          if (err) {
            return next(err);
          }
          compare = function() {
            var older;
            if (aStat.mtime < bMtime) {
              older = true;
            } else {
              older = false;
            }
            return next(null, older);
          };
          if (mode === 'path') {
            return balUtilPaths.empty(bPath, function(err, empty) {
              if (empty || err) {
                return next(err, null);
              }
              return safefs.stat(bPath, function(err, bStat) {
                if (err) {
                  return next(err);
                }
                bMtime = bStat.mtime;
                return compare();
              });
            });
          } else {
            return compare();
          }
        });
      });
      return this;
    }
  });
  module.exports = balUtilPaths;
})(require("buffer").Buffer, require("process"));
