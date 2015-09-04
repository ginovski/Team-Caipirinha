/* */ 
(function(process) {
  if (!this.JSON) {
    JSON = function() {
      function f(n) {
        return n < 10 ? '0' + n : n;
      }
      Date.prototype.toJSON = function() {
        return this.getUTCFullYear() + '-' + f(this.getUTCMonth() + 1) + '-' + f(this.getUTCDate()) + 'T' + f(this.getUTCHours()) + ':' + f(this.getUTCMinutes()) + ':' + f(this.getUTCSeconds()) + 'Z';
      };
      var m = {
        '\b': '\\b',
        '\t': '\\t',
        '\n': '\\n',
        '\f': '\\f',
        '\r': '\\r',
        '"': '\\"',
        '\\': '\\\\'
      };
      function stringify(value, whitelist) {
        var a,
            i,
            k,
            l,
            r = /["\\\x00-\x1f\x7f-\x9f]/g,
            v;
        switch (typeof value) {
          case 'string':
            return r.test(value) ? '"' + value.replace(r, function(a) {
              var c = m[a];
              if (c) {
                return c;
              }
              c = a.charCodeAt();
              return '\\u00' + Math.floor(c / 16).toString(16) + (c % 16).toString(16);
            }) + '"' : '"' + value + '"';
          case 'number':
            return isFinite(value) ? String(value) : 'null';
          case 'boolean':
          case 'null':
            return String(value);
          case 'object':
            if (!value) {
              return 'null';
            }
            if (typeof value.toJSON === 'function') {
              return stringify(value.toJSON());
            }
            a = [];
            if (typeof value.length === 'number' && !(value.propertyIsEnumerable('length'))) {
              l = value.length;
              for (i = 0; i < l; i += 1) {
                a.push(stringify(value[i], whitelist) || 'null');
              }
              return '[' + a.join(',') + ']';
            }
            if (whitelist) {
              l = whitelist.length;
              for (i = 0; i < l; i += 1) {
                k = whitelist[i];
                if (typeof k === 'string') {
                  v = stringify(value[k], whitelist);
                  if (v) {
                    a.push(stringify(k) + ':' + v);
                  }
                }
              }
            } else {
              for (k in value) {
                if (typeof k === 'string') {
                  v = stringify(value[k], whitelist);
                  if (v) {
                    a.push(stringify(k) + ':' + v);
                  }
                }
              }
            }
            return '{' + a.join(',') + '}';
        }
      }
      return {
        stringify: stringify,
        parse: function(text, filter) {
          var j;
          function walk(k, v) {
            var i,
                n;
            if (v && typeof v === 'object') {
              for (i in v) {
                if (Object.prototype.hasOwnProperty.apply(v, [i])) {
                  n = walk(i, v[i]);
                  if (n !== undefined) {
                    v[i] = n;
                  } else {
                    delete v[i];
                  }
                }
              }
            }
            return filter(k, v);
          }
          if (/^[\],:{}\s]*$/.test(text.replace(/\\["\\\/bfnrtu]/g, '@').replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, ']').replace(/(?:^|:|,)(?:\s*\[)+/g, ''))) {
            j = eval('(' + text + ')');
            return typeof filter === 'function' ? walk('', j) : j;
          }
          throw new SyntaxError('parseJSON');
        }
      };
    }();
  }
  (function() {
    function map(arr, fun) {
      var len = arr.length;
      if (typeof fun != "function")
        throw new TypeError();
      var res = new Array(len);
      var thisp = arguments[2];
      for (var i = 0; i < len; i++) {
        if (i in arr)
          res[i] = fun.call(thisp, arr[i], i, arr);
      }
      return res;
    }
    function filter(arr, fun) {
      var len = arr.length;
      if (typeof fun != "function")
        throw new TypeError();
      var res = new Array();
      var thisp = arguments[2];
      for (var i = 0; i < len; i++) {
        if (i in arr) {
          var val = arr[i];
          if (fun.call(thisp, val, i, arr))
            res.push(val);
        }
      }
      return res;
    }
    ;
    function slice(obj, start, end, step) {
      var len = obj.length,
          results = [];
      end = end || len;
      start = (start < 0) ? Math.max(0, start + len) : Math.min(len, start);
      end = (end < 0) ? Math.max(0, end + len) : Math.min(len, end);
      for (var i = start; i < end; i += step) {
        results.push(obj[i]);
      }
      return results;
    }
    function expand(obj, name) {
      var results = [];
      function walk(obj) {
        if (name) {
          if (name === true && !(obj instanceof Array)) {
            results.push(obj);
          } else if (obj[name]) {
            results.push(obj[name]);
          }
        }
        for (var i in obj) {
          var val = obj[i];
          if (!name) {
            results.push(val);
          } else if (val && typeof val == 'object') {
            walk(val);
          }
        }
      }
      if (name instanceof Array) {
        if (name.length == 1) {
          return obj[name[0]];
        }
        for (var i = 0; i < name.length; i++) {
          results.push(obj[name[i]]);
        }
      } else {
        walk(obj);
      }
      return results;
    }
    function distinctFilter(array, callback) {
      var outArr = [];
      var primitives = {};
      for (var i = 0,
          l = array.length; i < l; ++i) {
        var value = array[i];
        if (callback(value, i, array)) {
          if ((typeof value == 'object') && value) {
            if (!value.__included) {
              value.__included = true;
              outArr.push(value);
            }
          } else if (!primitives[value + typeof value]) {
            primitives[value + typeof value] = true;
            outArr.push(value);
          }
        }
      }
      for (i = 0, l = outArr.length; i < l; ++i) {
        if (outArr[i]) {
          delete outArr[i].__included;
        }
      }
      return outArr;
    }
    var JSONQuery = function(query, obj) {
      tokens = [];
      var depth = 0;
      var str = [];
      query = query.replace(/"(\\.|[^"\\])*"|'(\\.|[^'\\])*'|[\[\]]/g, function(t) {
        depth += t == '[' ? 1 : t == ']' ? -1 : 0;
        return (t == ']' && depth > 0) ? '`]' : (t.charAt(0) == '"' || t.charAt(0) == "'") ? "`" + (str.push(t) - 1) : t;
      });
      var prefix = '';
      function call(name) {
        prefix = name + "(" + prefix;
      }
      function makeRegex(t, a, b, c, d) {
        return str[d].match(/[\*\?]/) || c == '~' ? "/^" + str[d].substring(1, str[d].length - 1).replace(/\\([btnfr\\"'])|([^\w\*\?])/g, "\\$1$2").replace(/([\*\?])/g, ".$1") + (c == '~' ? '$/i' : '$/') + ".test(" + a + ")" : t;
      }
      query.replace(/(\]|\)|push|pop|shift|splice|sort|reverse)\s*\(/, function() {
        throw new Error("Unsafe function call");
      });
      query = query.replace(/([^<>=]=)([^=])/g, "$1=$2").replace(/@|(\.\s*)?[a-zA-Z\$_]+(\s*:)?/g, function(t) {
        return t.charAt(0) == '.' ? t : t == '@' ? "$obj" : (t.match(/:|^(\$|Math|true|false|null)$/) ? "" : "$obj.") + t;
      }).replace(/\.?\.?\[(`\]|[^\]])*\]|\?.*|\.\.([\w\$_]+)|\.\*/g, function(t, a, b) {
        var oper = t.match(/^\.?\.?(\[\s*\^?\?|\^?\?|\[\s*==)(.*?)\]?$/);
        if (oper) {
          var prefix = '';
          if (t.match(/^\./)) {
            call("expand");
            prefix = ",true)";
          }
          call(oper[1].match(/\=/) ? "map" : oper[1].match(/\^/) ? "distinctFilter" : "filter");
          return prefix + ",function($obj){return " + oper[2] + "})";
        }
        oper = t.match(/^\[\s*([\/\\].*)\]/);
        if (oper) {
          return ".concat().sort(function(a,b){" + oper[1].replace(/\s*,?\s*([\/\\])\s*([^,\\\/]+)/g, function(t, a, b) {
            return "var av= " + b.replace(/\$obj/, "a") + ",bv= " + b.replace(/\$obj/, "b") + ";if(av>bv||bv==null){return " + (a == "/" ? 1 : -1) + ";}\n" + "if(bv>av||av==null){return " + (a == "/" ? -1 : 1) + ";}\n";
          }) + "})";
        }
        oper = t.match(/^\[(-?[0-9]*):(-?[0-9]*):?(-?[0-9]*)\]/);
        if (oper) {
          call("slice");
          return "," + (oper[1] || 0) + "," + (oper[2] || 0) + "," + (oper[3] || 1) + ")";
        }
        if (t.match(/^\.\.|\.\*|\[\s*\*\s*\]|,/)) {
          call("expand");
          return (t.charAt(1) == '.' ? ",'" + b + "'" : t.match(/,/) ? "," + t : "") + ")";
        }
        return t;
      }).replace(/(\$obj\s*(\.\s*[\w_$]+\s*)*)(==|~)\s*`([0-9]+)/g, makeRegex).replace(/`([0-9]+)\s*(==|~)\s*(\$obj(\s*\.\s*[\w_$]+)*)/g, function(t, a, b, c, d) {
        return makeRegex(t, c, d, b, a);
      });
      query = prefix + (query.charAt(0) == '$' ? "" : "$") + query.replace(/`([0-9]+|\])/g, function(t, a) {
        return a == ']' ? ']' : str[a];
      });
      var executor = eval("1&&function($,$1,$2,$3,$4,$5,$6,$7,$8,$9){var $obj=$;return " + query + "}");
      for (var i = 0; i < arguments.length - 1; i++) {
        arguments[i] = arguments[i + 1];
      }
      return obj ? executor.apply(this, arguments) : executor;
    };
    if (typeof namespace == "function") {
      namespace("json::JSONQuery", JSONQuery);
    } else {
      window["JSONQuery"] = JSONQuery;
    }
  })();
  (function($) {
    $.cloudkit = $.cloudkit || {};
    var buildResource = function(collection, spec, metadata) {
      var that = {};
      var meta = {};
      var json = spec;
      var generateId = function() {
        return (new Date).getTime() + '-' + Math.floor(Math.random() * 10000);
      };
      var saveFromRemote = function() {
        meta = metadata;
        meta.id = generateId();
      };
      that.save = function(callbacks) {
        if (!(typeof metadata === 'undefined')) {
          return saveFromRemote();
        }
        $.ajax({
          type: 'POST',
          url: collection,
          data: JSON.stringify(spec),
          contentType: 'application/json',
          dataType: 'json',
          processData: false,
          complete: function(response, statusText) {
            if (response.status == 201) {
              meta = JSON.parse(response.responseText);
              meta.id = generateId();
              callbacks.success();
            } else {
              callbacks.error(response.status);
            }
          }
        });
      };
      that.update = function(spec, callbacks) {
        var id = meta.id;
        $.ajax({
          type: 'PUT',
          url: meta.uri,
          data: JSON.stringify($.extend(json, spec)),
          contentType: 'application/json',
          dataType: 'json',
          beforeSend: function(xhr) {
            xhr.setRequestHeader('If-Match', meta.etag);
          },
          processData: false,
          complete: function(response, statusText) {
            if (response.status == 200) {
              meta = JSON.parse(response.responseText);
              meta.id = id;
              json = $.extend(json, spec);
              callbacks.success();
            } else {
              callbacks.error(response.status);
            }
          }
        });
      };
      that.destroy = function(callbacks) {
        var id = meta.id;
        $.ajax({
          type: 'DELETE',
          url: meta.uri,
          dataType: 'json',
          beforeSend: function(xhr) {
            xhr.setRequestHeader('If-Match', meta.etag);
          },
          processData: false,
          complete: function(response, statusText) {
            meta = JSON.parse(response.responseText);
            meta.id = id;
            if (response.status == 200) {
              meta.deleted = true;
              callbacks.success();
            } else {
              callbacks.error(response.status);
            }
          }
        });
      };
      that.json = function() {
        return json;
      };
      that.id = function() {
        return meta.id;
      };
      that.uri = function() {
        return meta.uri;
      };
      that.isDeleted = function() {
        return (meta.deleted == true);
      };
      that.attr = function(name, value) {
        if (typeof json[name] != 'undefined') {
          switch (typeof value) {
            case 'undefined':
              return json[name];
              break;
            case 'function':
              return json[name] = value.apply(json[name]);
              break;
            default:
              return json[name] = value;
          }
        } else if (typeof meta[name] != 'undefined') {
          return meta[name];
        }
      };
      return that;
    };
    var buildStore = function(collection) {
      var that = {};
      var key = function(resource) {
        return collection + resource.id();
      };
      var persist = function(resource) {
        var k = key(resource);
        $.data(window, k, resource);
        var index = $.data(window, collection + 'index') || [];
        index.push(k);
        $.data(window, collection + 'index', index);
      };
      that.create = function(spec, callbacks) {
        resource = buildResource(collection, spec);
        resource.save({
          success: function() {
            persist(resource);
            callbacks.success(resource);
          },
          error: function(status) {
            callbacks.error(status);
          }
        });
      };
      that.createFromRemote = function(spec, metadata) {
        resource = buildResource(collection, spec, metadata);
        resource.save();
        persist(resource);
        return resource;
      };
      that.all = function(spec) {
        var result = [];
        var index = $.data(window, collection + 'index');
        $(index).each(function(count, id) {
          var item = $.data(window, id);
          if (!item.isDeleted()) {
            result.push(item);
          }
        });
        return result;
      };
      that.get = function(id) {
        return $.data(window, collection + id);
      };
      that.query = function(spec) {
        var jsonObjects = [];
        var self = this;
        $(this.all()).each(function(index, item) {
          json = $.extend(item.json(), {'___id___': item.id()});
          jsonObjects.push(json);
        });
        var query_result = JSONQuery(spec, jsonObjects);
        var resources = [];
        $(query_result).each(function(index, item) {
          resources.push(self.get(item['___id___']));
        });
        return resources;
      };
      return that;
    };
    var collectionURIs = [];
    var collections = {};
    var loadMeta = function(callbacks) {
      $.ajax({
        type: 'GET',
        url: '/cloudkit-meta',
        complete: function(response, statusText) {
          data = JSON.parse(response.responseText);
          if (response.status == 200) {
            collectionURIs = data.uris;
            callbacks.success();
          } else if (response.status >= 400) {
            callbacks.error(response.status);
          } else {
            callbacks.error('unexpected error');
          }
        }
      });
    };
    var configureCollection = function(collection) {
      $.data(window, collection + 'index', []);
      var name = collection.replace(/^\//, '');
      collections[name] = buildStore(collection);
    };
    var populateCollectionsFromRemote = function(index, callbacks) {
      if (index == collectionURIs.length) {
        callbacks.success();
        return;
      }
      $.ajax({
        type: 'GET',
        url: collectionURIs[index] + "/_resolved",
        dataType: 'json',
        processData: false,
        complete: function(response, statusText) {
          if (response.status == 200) {
            var resources = JSON.parse(response.responseText).documents;
            var name = collectionURIs[index].replace(/^\//, '');
            for (var i = 0; i < resources.length; i++) {
              var resource = resources[i];
              collections[name].createFromRemote(JSON.parse(resource.document), {
                uri: resource.uri,
                etag: resource.etag,
                last_modified: resource.last_modified
              });
            }
            populateCollectionsFromRemote(index + 1, callbacks);
          } else {
            callbacks.error(response.status);
          }
        }
      });
    };
    $.fn.extend($.cloudkit, {
      boot: function(callbacks) {
        collectionURIs = [];
        collections = [];
        loadMeta({
          success: function() {
            $(collectionURIs).each(function(index, collection) {
              configureCollection(collection);
            });
            populateCollectionsFromRemote(0, {
              success: function() {
                callbacks.success();
              },
              error: function(status) {
                callbacks.error(status);
              }
            });
          },
          error: function(status) {
            callbacks.error(status);
          }
        });
      },
      collections: function() {
        return collections;
      },
      collection: function(name) {
        return this.collections()[name];
      }
    });
  })(jQuery);
})(require("process"));
