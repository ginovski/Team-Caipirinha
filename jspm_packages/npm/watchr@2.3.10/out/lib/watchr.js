/* */ 
(function() {
  var EventEmitter,
      Watcher,
      balUtil,
      createWatcher,
      fsUtil,
      pathUtil,
      watch,
      watchers,
      watchersTotal,
      __bind = function(fn, me) {
        return function() {
          return fn.apply(me, arguments);
        };
      },
      __hasProp = {}.hasOwnProperty,
      __extends = function(child, parent) {
        for (var key in parent) {
          if (__hasProp.call(parent, key))
            child[key] = parent[key];
        }
        function ctor() {
          this.constructor = child;
        }
        ctor.prototype = parent.prototype;
        child.prototype = new ctor();
        child.__super__ = parent.prototype;
        return child;
      },
      __slice = [].slice,
      __indexOf = [].indexOf || function(item) {
        for (var i = 0,
            l = this.length; i < l; i++) {
          if (i in this && this[i] === item)
            return i;
        }
        return -1;
      };
  pathUtil = require("path");
  fsUtil = require("fs");
  balUtil = require("bal-util");
  EventEmitter = require("events").EventEmitter;
  watchersTotal = 0;
  watchers = {};
  Watcher = (function(_super) {
    __extends(_Class, _super);
    _Class.prototype.path = null;
    _Class.prototype.isDirectory = null;
    _Class.prototype.stat = null;
    _Class.prototype.fswatcher = null;
    _Class.prototype.children = null;
    _Class.prototype.state = 'pending';
    _Class.prototype.method = null;
    _Class.prototype.config = {
      path: null,
      listener: null,
      listeners: null,
      stat: null,
      outputLog: false,
      interval: 5007,
      persistent: true,
      duplicateDelay: 1 * 1000,
      preferredMethods: null,
      ignorePaths: false,
      ignoreHiddenFiles: false,
      ignoreCommonPatterns: true,
      ignoreCustomPatterns: null
    };
    function _Class(config, next) {
      this.listener = __bind(this.listener, this);
      this.bubbler = __bind(this.bubbler, this);
      this.bubble = __bind(this.bubble, this);
      this.isIgnoredPath = __bind(this.isIgnoredPath, this);
      this.log = __bind(this.log, this);
      this.children = {};
      this.config = balUtil.extend({}, this.config);
      this.config.preferredMethods = ['watch', 'watchFile'];
      if (config.next != null) {
        if (next == null) {
          next = config.next;
        }
        delete config.next;
      }
      if (config) {
        this.setup(config);
      }
      if (next) {
        this.watch(next);
      }
      this;
    }
    _Class.prototype.log = function() {
      var args;
      args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      if (this.config.outputLog) {
        console.log.apply(console, args);
      }
      this.emit.apply(this, ['log'].concat(__slice.call(args)));
      return this;
    };
    _Class.prototype.isIgnoredPath = function(path, opts) {
      var ignore,
          _ref,
          _ref1,
          _ref2,
          _ref3;
      if (opts == null) {
        opts = {};
      }
      ignore = balUtil.isIgnoredPath(path, {
        ignorePaths: (_ref = opts.ignorePaths) != null ? _ref : this.config.ignorePaths,
        ignoreHiddenFiles: (_ref1 = opts.ignoreHiddenFiles) != null ? _ref1 : this.config.ignoreHiddenFiles,
        ignoreCommonPatterns: (_ref2 = opts.ignoreCommonPatterns) != null ? _ref2 : this.config.ignoreCommonPatterns,
        ignoreCustomPatterns: (_ref3 = opts.ignoreCustomPatterns) != null ? _ref3 : this.config.ignoreCustomPatterns
      });
      this.log('debug', "ignore: " + path + " " + (ignore ? 'yes' : 'no'));
      return ignore;
    };
    _Class.prototype.setup = function(config) {
      balUtil.extend(this.config, config);
      this.path = this.config.path;
      if (this.config.stat) {
        this.stat = this.config.stat;
        this.isDirectory = this.stat.isDirectory();
        delete this.config.stat;
      }
      if (this.config.listener || this.config.listeners) {
        this.removeAllListeners();
        if (this.config.listener) {
          this.listen(this.config.listener);
          delete this.config.listener;
        }
        if (this.config.listeners) {
          this.listen(this.config.listeners);
          delete this.config.listeners;
        }
      }
      return this;
    };
    _Class.prototype.bubble = function() {
      var args;
      args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      this.emit.apply(this, args);
      return this;
    };
    _Class.prototype.bubbler = function(eventName) {
      var _this = this;
      return function() {
        var args;
        args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
        return _this.bubble.apply(_this, args);
      };
    };
    _Class.prototype.listen = function(eventName, listener) {
      var listenerArray,
          listeners,
          _i,
          _j,
          _len,
          _len1;
      if (listener == null) {
        listeners = eventName;
        if (balUtil.isArray(listeners)) {
          for (_i = 0, _len = listeners.length; _i < _len; _i++) {
            listener = listeners[_i];
            this.listen('change', listener);
          }
        } else if (balUtil.isPlainObject(listeners)) {
          for (eventName in listeners) {
            if (!__hasProp.call(listeners, eventName))
              continue;
            listenerArray = listeners[eventName];
            if (balUtil.isArray(listenerArray)) {
              for (_j = 0, _len1 = listenerArray.length; _j < _len1; _j++) {
                listener = listenerArray[_j];
                this.listen(eventName, listener);
              }
            } else {
              this.listen(eventName, listenerArray);
            }
          }
        } else {
          this.listen('change', listeners);
        }
      } else {
        this.removeListener(eventName, listener);
        this.on(eventName, listener);
        this.log('debug', "added a listener: on " + this.path + " for event " + eventName);
      }
      return this;
    };
    _Class.prototype.cacheTimeout = null;
    _Class.prototype.cachedEvents = null;
    _Class.prototype.emitSafe = function() {
      var args,
          config,
          me,
          thisEvent,
          _ref;
      args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      me = this;
      config = this.config;
      if (this.cacheTimeout != null) {
        clearTimeout(this.cacheTimeout);
      }
      this.cacheTimeout = setTimeout(function() {
        me.cachedEvents = [];
        return me.cacheTimeout = null;
      }, config.duplicateDelay);
      if ((_ref = this.cachedEvents) == null) {
        this.cachedEvents = [];
      }
      thisEvent = args.toString();
      if (__indexOf.call(this.cachedEvents, thisEvent) >= 0) {
        this.log('debug', "event ignored on " + this.path + " due to duplicate:", args);
        return this;
      }
      this.cachedEvents.push(thisEvent);
      this.emit.apply(this, args);
      return this;
    };
    _Class.prototype.listener = function() {
      var args,
          currentStat,
          determineTheChange,
          fileExists,
          fileFullPath,
          isTheSame,
          me,
          previousStat,
          _this = this;
      args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      me = this;
      fileFullPath = this.path;
      currentStat = null;
      previousStat = this.stat;
      fileExists = null;
      this.log('debug', "watch event triggered on " + this.path + ":", args);
      isTheSame = function() {
        if ((currentStat != null) && (previousStat != null)) {
          if (currentStat.size === previousStat.size && currentStat.mtime.toString() === previousStat.mtime.toString()) {
            return true;
          }
        }
        return false;
      };
      determineTheChange = function() {
        if (!fileExists) {
          _this.log('debug', 'determined delete:', fileFullPath);
          return _this.close('deleted');
        } else {
          if (isTheSame()) {
            return _this.log('debug', "determined same:", fileFullPath);
          } else {
            if (_this.isDirectory) {
              if (isTheSame() === false) {
                return balUtil.readdir(fileFullPath, function(err, newFileRelativePaths) {
                  if (err) {
                    return _this.emit('error', err);
                  }
                  balUtil.each(_this.children, function(childFileWatcher, childFileRelativePath) {
                    var childFileFullPath;
                    if (__indexOf.call(newFileRelativePaths, childFileRelativePath) >= 0) {
                      return ;
                    }
                    childFileFullPath = pathUtil.join(fileFullPath, childFileRelativePath);
                    if (_this.isIgnoredPath(childFileFullPath)) {
                      return ;
                    }
                    _this.log('debug', 'determined delete:', childFileFullPath, 'via:', fileFullPath);
                    return _this.closeChild(childFileRelativePath, 'deleted');
                  });
                  return balUtil.each(newFileRelativePaths, function(childFileRelativePath) {
                    var childFileFullPath;
                    if (_this.children[childFileRelativePath] != null) {
                      return ;
                    }
                    _this.children[childFileRelativePath] = false;
                    childFileFullPath = pathUtil.join(fileFullPath, childFileRelativePath);
                    if (_this.isIgnoredPath(childFileFullPath)) {
                      return ;
                    }
                    return balUtil.stat(childFileFullPath, function(err, childFileStat) {
                      if (err) {
                        return _this.emit('error', err);
                      }
                      _this.log('debug', 'determined create:', childFileFullPath, 'via:', fileFullPath);
                      _this.emitSafe('change', 'create', childFileFullPath, childFileStat, null);
                      return _this.watchChild({
                        fullPath: childFileFullPath,
                        relativePath: childFileRelativePath,
                        stat: childFileStat
                      });
                    });
                  });
                });
              }
            } else {
              _this.log('debug', 'determined update:', fileFullPath);
              return _this.emitSafe('change', 'update', fileFullPath, currentStat, previousStat);
            }
          }
        }
      };
      balUtil.exists(fileFullPath, function(exists) {
        fileExists = exists;
        if (fileExists) {
          return balUtil.stat(fileFullPath, function(err, stat) {
            if (err) {
              return this.emit('error', err);
            }
            currentStat = stat;
            me.stat = currentStat;
            return determineTheChange();
          });
        } else {
          return determineTheChange();
        }
      });
      return this;
    };
    _Class.prototype.close = function(reason) {
      var childRelativePath,
          _ref;
      if (this.state !== 'active') {
        return this;
      }
      this.log('debug', "close: " + this.path);
      _ref = this.children;
      for (childRelativePath in _ref) {
        if (!__hasProp.call(_ref, childRelativePath))
          continue;
        this.closeChild(childRelativePath, reason);
      }
      if (this.method === 'watchFile') {
        fsUtil.unwatchFile(this.path);
      }
      if (this.fswatcher != null) {
        this.fswatcher.close();
        this.fswatcher = null;
      }
      if (reason === 'deleted') {
        this.state = 'deleted';
        this.emitSafe('change', 'delete', this.path, null, this.stat);
      } else if (reason === 'failure') {
        this.state = 'closed';
        this.log('warn', "Failed to watch the path " + this.path);
      } else {
        this.state = 'closed';
      }
      if (watchers[this.path] != null) {
        delete watchers[this.path];
        watchersTotal--;
      }
      return this;
    };
    _Class.prototype.closeChild = function(fileRelativePath, reason) {
      var watcher;
      if (this.children[fileRelativePath] != null) {
        watcher = this.children[fileRelativePath];
        if (watcher) {
          watcher.close(reason);
        }
        delete this.children[fileRelativePath];
      }
      return this;
    };
    _Class.prototype.watchChild = function(opts, next) {
      var config,
          me,
          _base,
          _name;
      me = this;
      config = this.config;
      (_base = me.children)[_name = opts.relativePath] || (_base[_name] = watch({
        path: opts.fullPath,
        stat: opts.stat,
        listeners: {
          'log': me.bubbler('log'),
          'change': function() {
            var args,
                changeType,
                path;
            args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
            changeType = args[0], path = args[1];
            if (changeType === 'delete' && path === opts.fullPath) {
              me.closeChild(opts.relativePath, 'deleted');
            }
            return me.bubble.apply(me, ['change'].concat(__slice.call(args)));
          },
          'error': me.bubbler('error')
        },
        next: next,
        outputLog: config.outputLog,
        interval: config.interval,
        persistent: config.persistent,
        duplicateDelay: config.duplicateDelay,
        preferredMethods: config.preferredMethods,
        ignorePaths: config.ignorePaths,
        ignoreHiddenFiles: config.ignoreHiddenFiles,
        ignoreCommonPatterns: config.ignoreCommonPatterns,
        ignoreCustomPatterns: config.ignoreCustomPatterns
      }));
      return me.children[opts.relativePath];
    };
    _Class.prototype.watchChildren = function(next) {
      var config,
          me;
      me = this;
      config = this.config;
      if (this.isDirectory) {
        balUtil.scandir({
          path: this.path,
          ignorePaths: config.ignorePaths,
          ignoreHiddenFiles: config.ignoreHiddenFiles,
          ignoreCommonPatterns: config.ignoreCommonPatterns,
          ignoreCustomPatterns: config.ignoreCustomPatterns,
          recurse: false,
          next: function(err) {
            var watching;
            watching = !err;
            return next(err, watching);
          },
          action: function(fullPath, relativePath, nextFile, stat) {
            if (me.state !== 'active') {
              return nextFile(null, true);
            }
            return me.watchChild({
              fullPath: fullPath,
              relativePath: relativePath,
              stat: stat
            }, function(err, watcher) {
              return nextFile(err);
            });
          }
        });
      } else {
        next(null, true);
      }
      return this;
    };
    _Class.prototype.watchSelf = function(next) {
      var complete,
          config,
          me,
          methodOne,
          methodTwo,
          methods;
      me = this;
      config = this.config;
      this.method = null;
      methods = {
        watch: function(next) {
          if (fsUtil.watch == null) {
            return next(null, false);
          }
          try {
            me.fswatcher = fsUtil.watch(me.path, me.listener);
          } catch (err) {
            return next(err, false);
          }
          me.method = 'watch';
          return next(null, true);
        },
        watchFile: function(next) {
          var watchFileOpts;
          if (fsUtil.watchFile == null) {
            return next(null, false);
          }
          watchFileOpts = {
            persistent: config.persistent,
            interval: config.interval
          };
          try {
            fsUtil.watchFile(me.path, watchFileOpts, me.listener);
          } catch (err) {
            return next(err, false);
          }
          me.method = 'watchFile';
          return next(null, true);
        }
      };
      complete = function(watching) {
        if (!watching) {
          me.close('failure');
          return next(null, false);
        }
        me.state = 'active';
        return next(null, true);
      };
      methodOne = me.config.preferredMethods[0];
      methodTwo = me.config.preferredMethods[1];
      methods[methodOne](function(err1, watching) {
        if (watching) {
          return complete(watching);
        }
        return methods[methodTwo](function(err2, watching) {
          if (watching) {
            return complete(watching);
          }
          if (err1) {
            me.emit('error', err1);
          }
          if (err2) {
            me.emit('error', err2);
          }
          return complete(false);
        });
      });
      return this;
    };
    _Class.prototype.watch = function(next) {
      var complete,
          config,
          me,
          _this = this;
      me = this;
      config = this.config;
      if ((this.stat != null) === false) {
        balUtil.stat(config.path, function(err, stat) {
          if (err) {
            return _this.emit('error', err);
          }
          _this.stat = stat;
          _this.isDirectory = stat.isDirectory();
          return _this.watch(next);
        });
        return this;
      }
      if (next != null) {
        this.listen('watching', next);
      }
      this.close();
      this.log('debug', "watch: " + this.path);
      complete = function(err, result) {
        if (err == null) {
          err = null;
        }
        if (result == null) {
          result = true;
        }
        if (err || !result) {
          me.close();
          return me.emit('watching', err, me, false);
        } else {
          return me.emit('watching', null, me, true);
        }
      };
      balUtil.exists(this.path, function(exists) {
        if (!exists) {
          return complete(null, false);
        }
        return me.watchSelf(function(err, watching) {
          if (err || !watching) {
            return complete(err, watching);
          }
          return me.watchChildren(function(err, watching) {
            return complete(err, watching);
          });
        });
      });
      return this;
    };
    return _Class;
  })(EventEmitter);
  createWatcher = function(opts, next) {
    var attempt,
        listener,
        listeners,
        path,
        watcher;
    path = opts.path, listener = opts.listener, listeners = opts.listeners;
    if (opts.next != null) {
      if (next == null) {
        next = opts.next;
      }
      delete opts.next;
    }
    if (!balUtil.existsSync(path)) {
      if (typeof next === "function") {
        next(null, null);
      }
      return ;
    }
    if (watchers[path] != null) {
      watcher = watchers[path];
      if (listener) {
        watcher.listen(listener);
      }
      if (listeners) {
        watcher.listen(listeners);
      }
      if (typeof next === "function") {
        next(null, watcher);
      }
    } else {
      attempt = 0;
      watcher = new Watcher(opts, function(err) {
        if (!err || attempt !== 0) {
          return typeof next === "function" ? next(err, watcher) : void 0;
        }
        ++attempt;
        watcher.log('debug', "Preferred method failed, trying methods in reverse order", err);
        return watcher.setup({preferredMethods: watcher.config.preferredMethods.reverse()}).watch();
      });
      watchers[path] = watcher;
      ++watchersTotal;
    }
    return watcher;
  };
  watch = function(opts, next) {
    var path,
        paths,
        result,
        tasks,
        _i,
        _len;
    result = [];
    if (opts.next != null) {
      if (next == null) {
        next = opts.next;
      }
      delete opts.next;
    }
    if (opts.paths) {
      paths = opts.paths;
      delete opts.paths;
      if (balUtil.isArray(paths)) {
        tasks = new balUtil.Group(function(err) {
          return typeof next === "function" ? next(err, result) : void 0;
        });
        for (_i = 0, _len = paths.length; _i < _len; _i++) {
          path = paths[_i];
          tasks.push({path: path}, function(complete) {
            var localOpts,
                watcher;
            localOpts = balUtil.extend({}, opts);
            localOpts.path = this.path;
            watcher = createWatcher(localOpts, complete);
            if (watcher) {
              return result.push(watcher);
            }
          });
        }
        tasks.async();
      } else {
        opts.path = paths;
        result.push(createWatcher(opts, function(err) {
          return typeof next === "function" ? next(err, result) : void 0;
        }));
      }
    } else {
      result = createWatcher(opts, next);
    }
    return result;
  };
  module.exports = {
    watch: watch,
    Watcher: Watcher
  };
}).call(this);
