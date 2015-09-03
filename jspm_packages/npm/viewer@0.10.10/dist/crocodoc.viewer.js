/* */ 
(function(process) {
  (function(window) {
    'use strict';
    window.Crocodoc = (function(fn) {
      if (typeof exports === 'object') {
        module.exports = fn;
      } else {
        return fn(jQuery);
      }
    }(function($) {
      var CSS_CLASS_PREFIX = 'crocodoc-',
          ATTR_SVG_VERSION = 'data-svg-version',
          CSS_CLASS_VIEWER = CSS_CLASS_PREFIX + 'viewer',
          CSS_CLASS_DOC = CSS_CLASS_PREFIX + 'doc',
          CSS_CLASS_VIEWPORT = CSS_CLASS_PREFIX + 'viewport',
          CSS_CLASS_LOGO = CSS_CLASS_PREFIX + 'viewer-logo',
          CSS_CLASS_DRAGGABLE = CSS_CLASS_PREFIX + 'draggable',
          CSS_CLASS_DRAGGING = CSS_CLASS_PREFIX + 'dragging',
          CSS_CLASS_TEXT_SELECTED = CSS_CLASS_PREFIX + 'text-selected',
          CSS_CLASS_TEXT_DISABLED = CSS_CLASS_PREFIX + 'text-disabled',
          CSS_CLASS_LINKS_DISABLED = CSS_CLASS_PREFIX + 'links-disabled',
          CSS_CLASS_MOBILE = CSS_CLASS_PREFIX + 'mobile',
          CSS_CLASS_IELT9 = CSS_CLASS_PREFIX + 'ielt9',
          CSS_CLASS_SUPPORTS_SVG = CSS_CLASS_PREFIX + 'supports-svg',
          CSS_CLASS_WINDOW_AS_VIEWPORT = CSS_CLASS_PREFIX + 'window-as-viewport',
          CSS_CLASS_LAYOUT_PREFIX = CSS_CLASS_PREFIX + 'layout-',
          CSS_CLASS_CURRENT_PAGE = CSS_CLASS_PREFIX + 'current-page',
          CSS_CLASS_PRECEDING_PAGE = CSS_CLASS_PREFIX + 'preceding-page',
          CSS_CLASS_PAGE = CSS_CLASS_PREFIX + 'page',
          CSS_CLASS_PAGE_INNER = CSS_CLASS_PAGE + '-inner',
          CSS_CLASS_PAGE_CONTENT = CSS_CLASS_PAGE + '-content',
          CSS_CLASS_PAGE_SVG = CSS_CLASS_PAGE + '-svg',
          CSS_CLASS_PAGE_TEXT = CSS_CLASS_PAGE + '-text',
          CSS_CLASS_PAGE_LINK = CSS_CLASS_PAGE + '-link',
          CSS_CLASS_PAGE_LINKS = CSS_CLASS_PAGE + '-links',
          CSS_CLASS_PAGE_AUTOSCALE = CSS_CLASS_PAGE + '-autoscale',
          CSS_CLASS_PAGE_LOADING = CSS_CLASS_PAGE + '-loading',
          CSS_CLASS_PAGE_ERROR = CSS_CLASS_PAGE + '-error',
          CSS_CLASS_PAGE_VISIBLE = CSS_CLASS_PAGE + '-visible',
          CSS_CLASS_PAGE_AUTOSCALE = CSS_CLASS_PAGE + '-autoscale',
          CSS_CLASS_PAGE_PREV = CSS_CLASS_PAGE + '-prev',
          CSS_CLASS_PAGE_NEXT = CSS_CLASS_PAGE + '-next',
          CSS_CLASS_PAGE_BEFORE = CSS_CLASS_PAGE + '-before',
          CSS_CLASS_PAGE_AFTER = CSS_CLASS_PAGE + '-after',
          CSS_CLASS_PAGE_BEFORE_BUFFER = CSS_CLASS_PAGE + '-before-buffer',
          CSS_CLASS_PAGE_AFTER_BUFFER = CSS_CLASS_PAGE + '-after-buffer',
          PRESENTATION_CSS_CLASSES = [CSS_CLASS_PAGE_NEXT, CSS_CLASS_PAGE_AFTER, CSS_CLASS_PAGE_PREV, CSS_CLASS_PAGE_BEFORE, CSS_CLASS_PAGE_BEFORE_BUFFER, CSS_CLASS_PAGE_AFTER_BUFFER].join(' ');
      var VIEWER_HTML_TEMPLATE = '<div tabindex="-1" class="' + CSS_CLASS_VIEWPORT + '">' + '<div class="' + CSS_CLASS_DOC + '"></div>' + '</div>' + '<div class="' + CSS_CLASS_LOGO + '"></div>';
      var PAGE_HTML_TEMPLATE = '<div class="' + CSS_CLASS_PAGE + ' ' + CSS_CLASS_PAGE_LOADING + '" ' + 'style="width:{{w}}px; height:{{h}}px;" data-width="{{w}}" data-height="{{h}}">' + '<div class="' + CSS_CLASS_PAGE_INNER + '">' + '<div class="' + CSS_CLASS_PAGE_CONTENT + '">' + '<div class="' + CSS_CLASS_PAGE_SVG + '"></div>' + '<div class="' + CSS_CLASS_PAGE_AUTOSCALE + '">' + '<div class="' + CSS_CLASS_PAGE_TEXT + '"></div>' + '<div class="' + CSS_CLASS_PAGE_LINKS + '"></div>' + '</div>' + '</div>' + '</div>' + '</div>';
      var DOCUMENT_100_PERCENT_WIDTH = 1024;
      var ZOOM_FIT_WIDTH = 'fitwidth',
          ZOOM_FIT_HEIGHT = 'fitheight',
          ZOOM_AUTO = 'auto',
          ZOOM_IN = 'in',
          ZOOM_OUT = 'out',
          SCROLL_PREVIOUS = 'previous',
          SCROLL_NEXT = 'next',
          LAYOUT_VERTICAL = 'vertical',
          LAYOUT_VERTICAL_SINGLE_COLUMN = 'vertical-single-column',
          LAYOUT_HORIZONTAL = 'horizontal',
          LAYOUT_PRESENTATION = 'presentation',
          LAYOUT_PRESENTATION_TWO_PAGE = 'presentation-two-page',
          LAYOUT_TEXT = 'text',
          PAGE_STATUS_CONVERTING = 'converting',
          PAGE_STATUS_NOT_LOADED = 'not loaded',
          PAGE_STATUS_LOADING = 'loading',
          PAGE_STATUS_LOADED = 'loaded',
          PAGE_STATUS_ERROR = 'error';
      var STYLE_PADDING_PREFIX = 'padding-',
          STYLE_PADDING_TOP = STYLE_PADDING_PREFIX + 'top',
          STYLE_PADDING_RIGHT = STYLE_PADDING_PREFIX + 'right',
          STYLE_PADDING_LEFT = STYLE_PADDING_PREFIX + 'left',
          STYLE_PADDING_BOTTOM = STYLE_PADDING_PREFIX + 'bottom',
          ZOOM_LEVEL_SIMILARITY_THRESHOLD = 0.95,
          ZOOM_LEVEL_PRESETS_SIMILARITY_THRESHOLD = 0.99;
      var PAGE_LOAD_INTERVAL = 100,
          MAX_PAGE_LOAD_RANGE = 32,
          MAX_PAGE_LOAD_RANGE_MOBILE = 8,
          READY_TRIGGER_PRELOADING_DELAY = 1000;
      function PROXY_SVG() {
        'use strict';
        window.loadSVG = function(svgText) {
          var domParser = new window.DOMParser(),
              svgDoc = domParser.parseFromString(svgText, 'image/svg+xml'),
              svgEl = document.importNode(svgDoc.documentElement, true);
          svgEl.setAttribute('width', '100%');
          svgEl.setAttribute('height', '100%');
          if (document.body) {
            document.body.appendChild(svgEl);
          } else {
            document.documentElement.appendChild(svgEl);
          }
        };
      }
      var SVG_MIME_TYPE = 'image/svg+xml',
          HTML_TEMPLATE = '<style>html,body{width:100%;height:100%;margin:0;overflow:hidden;}</style>',
          SVG_CONTAINER_TEMPLATE = '<svg version="1.1" xmlns="http://www.w3.org/2000/svg"><script><![CDATA[(' + PROXY_SVG + ')()]]></script></svg>',
          EMBED_STRATEGY_IFRAME_INNERHTML = 1,
          EMBED_STRATEGY_DATA_URL = 2,
          EMBED_STRATEGY_INLINE_SVG = 3,
          EMBED_STRATEGY_BASIC_OBJECT = 4,
          EMBED_STRATEGY_BASIC_IMG = 5,
          EMBED_STRATEGY_DATA_URL_PROXY = 6,
          EMBED_STRATEGY_IFRAME_PROXY = 7,
          EMBED_STRATEGY_DATA_URL_IMG = 8;
      if (typeof $ === 'undefined') {
        throw new Error('jQuery is required');
      }
      var Crocodoc = (function() {
        'use strict';
        var components = {},
            utilities = {};
        function findCircularDependencies(componentName, dependencies, path) {
          var i;
          path = path || componentName;
          for (i = 0; i < dependencies.length; ++i) {
            if (componentName === dependencies[i]) {
              throw new Error('Circular dependency detected: ' + path + '->' + dependencies[i]);
            } else if (components[dependencies[i]]) {
              findCircularDependencies(componentName, components[dependencies[i]].mixins, path + '->' + dependencies[i]);
            }
          }
        }
        return {
          ZOOM_FIT_WIDTH: ZOOM_FIT_WIDTH,
          ZOOM_FIT_HEIGHT: ZOOM_FIT_HEIGHT,
          ZOOM_AUTO: ZOOM_AUTO,
          ZOOM_IN: ZOOM_IN,
          ZOOM_OUT: ZOOM_OUT,
          SCROLL_PREVIOUS: SCROLL_PREVIOUS,
          SCROLL_NEXT: SCROLL_NEXT,
          LAYOUT_VERTICAL: LAYOUT_VERTICAL,
          LAYOUT_VERTICAL_SINGLE_COLUMN: LAYOUT_VERTICAL_SINGLE_COLUMN,
          LAYOUT_HORIZONTAL: LAYOUT_HORIZONTAL,
          LAYOUT_PRESENTATION: LAYOUT_PRESENTATION,
          LAYOUT_PRESENTATION_TWO_PAGE: LAYOUT_PRESENTATION_TWO_PAGE,
          LAYOUT_TEXT: LAYOUT_TEXT,
          ASSET_REQUEST_RETRIES: 1,
          viewerTemplate: VIEWER_HTML_TEMPLATE,
          pageTemplate: PAGE_HTML_TEMPLATE,
          components: components,
          utilities: utilities,
          createViewer: function(el, config) {
            return new Crocodoc.Viewer(el, config);
          },
          getViewer: function(id) {
            return Crocodoc.Viewer.get(id);
          },
          addComponent: function(name, mixins, creator) {
            if (mixins instanceof Function) {
              creator = mixins;
              mixins = [];
            }
            findCircularDependencies(name, mixins);
            components[name] = {
              mixins: mixins,
              creator: creator
            };
          },
          createComponent: function(name, scope) {
            var component = components[name];
            if (component) {
              var args = [];
              for (var i = 0; i < component.mixins.length; ++i) {
                args.push(this.createComponent(component.mixins[i], scope));
              }
              args.unshift(scope);
              return component.creator.apply(component.creator, args);
            }
            return null;
          },
          addPlugin: function(name, creator) {
            this.addComponent('plugin-' + name, creator);
          },
          addDataProvider: function(modelName, creator) {
            this.addComponent('data-provider-' + modelName, creator);
          },
          addUtility: function(name, creator) {
            utilities[name] = {
              creator: creator,
              instance: null
            };
          },
          getUtility: function(name) {
            var utility = utilities[name];
            if (utility) {
              if (!utility.instance) {
                utility.instance = utility.creator(this);
              }
              return utility.instance;
            }
            return null;
          }
        };
      })();
      (function() {
        'use strict';
        Crocodoc.Scope = function Scope(config) {
          var util = Crocodoc.getUtility('common');
          var instances = [],
              messageQueue = [],
              dataProviders = {},
              ready = false;
          function broadcast(messageName, data) {
            var i,
                len,
                instance,
                messages;
            for (i = 0, len = instances.length; i < len; ++i) {
              instance = instances[i];
              if (!instance) {
                continue;
              }
              messages = instance.messages || [];
              if (util.inArray(messageName, messages) !== -1) {
                if (util.isFn(instance.onmessage)) {
                  instance.onmessage.call(instance, messageName, data);
                }
              }
            }
          }
          function broadcastQueuedMessages() {
            var message;
            while (messageQueue.length) {
              message = messageQueue.shift();
              broadcast(message.name, message.data);
            }
            messageQueue = null;
          }
          function destroyComponent(instance) {
            if (util.isFn(instance.destroy) && !instance._destroyed) {
              instance.destroy();
              instance._destroyed = true;
            }
          }
          config.dataProviders = config.dataProviders || {};
          this.createComponent = function(componentName) {
            var instance = Crocodoc.createComponent(componentName, this);
            if (instance) {
              instance.componentName = componentName;
              instances.push(instance);
            }
            return instance;
          };
          this.destroyComponent = function(instance) {
            var i,
                len;
            for (i = 0, len = instances.length; i < len; ++i) {
              if (instance === instances[i]) {
                destroyComponent(instance);
                instances.splice(i, 1);
                break;
              }
            }
          };
          this.destroy = function() {
            var i,
                len,
                instance,
                components = instances.slice();
            for (i = 0, len = components.length; i < len; ++i) {
              instance = components[i];
              destroyComponent(instance);
            }
            instances = [];
            dataProviders = {};
          };
          this.broadcast = function(messageName, data) {
            if (ready) {
              broadcast(messageName, data);
            } else {
              messageQueue.push({
                name: messageName,
                data: data
              });
            }
          };
          this.getUtility = function(name) {
            return Crocodoc.getUtility(name);
          };
          this.getConfig = function() {
            return config;
          };
          this.ready = function() {
            if (!ready) {
              ready = true;
              broadcastQueuedMessages();
            }
          };
          this.get = function(objectType, objectKey) {
            var newObjectType = config.dataProviders[objectType] || objectType;
            var provider = this.getDataProvider(newObjectType);
            if (provider) {
              return provider.get(objectType, objectKey);
            }
            return $.Deferred().reject('data-provider not found').promise();
          };
          this.getDataProvider = function(objectType) {
            var provider;
            if (dataProviders[objectType]) {
              provider = dataProviders[objectType];
            } else {
              provider = this.createComponent('data-provider-' + objectType);
              dataProviders[objectType] = provider;
            }
            return provider;
          };
        };
      })();
      (function() {
        'use strict';
        function buildEventObject(type, data) {
          var isDefaultPrevented = false;
          return {
            type: type,
            data: data,
            preventDefault: function() {
              isDefaultPrevented = true;
            },
            isDefaultPrevented: function() {
              return isDefaultPrevented;
            }
          };
        }
        Crocodoc.EventTarget = function() {
          this._handlers = {};
        };
        Crocodoc.EventTarget.prototype = {
          constructor: Crocodoc.EventTarget,
          on: function(type, handler) {
            if (typeof this._handlers[type] === 'undefined') {
              this._handlers[type] = [];
            }
            this._handlers[type].push(handler);
          },
          fire: function(type, data) {
            var handlers,
                i,
                len,
                event = buildEventObject(type, data);
            handlers = this._handlers[event.type];
            if (handlers instanceof Array) {
              handlers = handlers.concat();
              for (i = 0, len = handlers.length; i < len; i++) {
                if (handlers[i]) {
                  handlers[i].call(this, event);
                }
              }
            }
            handlers = this._handlers.all;
            if (handlers instanceof Array) {
              handlers = handlers.concat();
              for (i = 0, len = handlers.length; i < len; i++) {
                if (handlers[i]) {
                  handlers[i].call(this, event);
                }
              }
            }
            return event;
          },
          off: function(type, handler) {
            var handlers = this._handlers[type],
                i,
                len;
            if (handlers instanceof Array) {
              if (!handler) {
                handlers.length = 0;
                return;
              }
              for (i = 0, len = handlers.length; i < len; i++) {
                if (handlers[i] === handler || handlers[i].handler === handler) {
                  handlers.splice(i, 1);
                  break;
                }
              }
            }
          },
          one: function(type, handler) {
            var self = this,
                proxy = function(event) {
                  self.off(type, proxy);
                  handler.call(self, event);
                };
            proxy.handler = handler;
            this.on(type, proxy);
          }
        };
      })();
      (function() {
        'use strict';
        var viewerInstanceCount = 0,
            instances = {};
        Crocodoc.Viewer = function(el, options) {
          Crocodoc.EventTarget.call(this);
          var util = Crocodoc.getUtility('common');
          var layout,
              $el = $(el),
              config = util.extend(true, {}, Crocodoc.Viewer.defaults, options),
              scope = new Crocodoc.Scope(config),
              viewerBase = scope.createComponent('viewer-base');
          if ($el.length === 0) {
            throw new Error('Invalid container element');
          }
          this.id = config.id = ++viewerInstanceCount;
          config.api = this;
          config.$el = $el;
          instances[this.id] = this;
          function init() {
            viewerBase.init();
          }
          this.destroy = function() {
            delete instances[config.id];
            scope.broadcast('destroy');
            scope.destroy();
          };
          this.load = function() {
            viewerBase.loadAssets();
          };
          this.setLayout = function(mode) {
            layout = null;
            layout = viewerBase.setLayout(mode);
          };
          this.zoom = function(val) {
            var valFloat = parseFloat(val);
            if (layout) {
              if (valFloat) {
                val = valFloat / (config.pageScale || 1);
              }
              layout.setZoom(val);
            }
          };
          this.scrollTo = function(page) {
            if (layout && util.isFn(layout.scrollTo)) {
              layout.scrollTo(page);
            }
          };
          this.scrollBy = function(left, top) {
            if (layout) {
              layout.scrollBy(left, top);
            }
          };
          this.focus = function() {
            if (layout) {
              layout.focus();
            }
          };
          this.enableTextSelection = function() {
            $el.toggleClass(CSS_CLASS_TEXT_DISABLED, false);
            if (!config.enableTextSelection) {
              config.enableTextSelection = true;
              scope.broadcast('textenabledchange', {enabled: true});
            }
          };
          this.disableTextSelection = function() {
            $el.toggleClass(CSS_CLASS_TEXT_DISABLED, true);
            if (config.enableTextSelection) {
              config.enableTextSelection = false;
              scope.broadcast('textenabledchange', {enabled: false});
            }
          };
          this.enableLinks = function() {
            if (!config.enableLinks) {
              $el.removeClass(CSS_CLASS_LINKS_DISABLED);
              config.enableLinks = true;
            }
          };
          this.disableLinks = function() {
            if (config.enableLinks) {
              $el.addClass(CSS_CLASS_LINKS_DISABLED);
              config.enableLinks = false;
            }
          };
          this.updateLayout = function() {
            if (layout) {
              layout.update();
            }
          };
          init();
        };
        Crocodoc.Viewer.prototype = new Crocodoc.EventTarget();
        Crocodoc.Viewer.prototype.constructor = Crocodoc.Viewer;
        Crocodoc.Viewer.get = function(id) {
          return instances[id];
        };
        Crocodoc.Viewer.defaults = {
          url: null,
          layout: LAYOUT_VERTICAL,
          zoom: ZOOM_AUTO,
          page: 1,
          enableTextSelection: true,
          enableLinks: true,
          enableDragging: false,
          queryParams: null,
          plugins: {},
          useWindowAsViewport: false,
          conversionIsComplete: true,
          template: {
            svg: 'page-{{page}}.svg',
            img: 'page-{{page}}.png',
            html: 'text-{{page}}.html',
            css: 'stylesheet.css',
            json: 'info.json'
          },
          dataProviders: {
            metadata: 'metadata',
            stylesheet: 'stylesheet',
            'page-svg': 'page-svg',
            'page-text': 'page-text',
            'page-img': 'page-img'
          },
          pageStart: null,
          pageEnd: null,
          autoloadFirstPage: true,
          zoomLevels: [0.25, 0.5, 0.75, 1.0, 1.25, 1.5, 2.0, 3.0]
        };
      })();
      Crocodoc.addDataProvider('metadata', function(scope) {
        'use strict';
        var ajax = scope.getUtility('ajax'),
            util = scope.getUtility('common'),
            config = scope.getConfig();
        function processJSONContent(json) {
          return util.parseJSON(json);
        }
        return {
          get: function() {
            var url = this.getURL(),
                $promise = ajax.fetch(url, Crocodoc.ASSET_REQUEST_RETRIES);
            return $promise.then(processJSONContent).promise({abort: $promise.abort});
          },
          getURL: function() {
            var jsonPath = config.template.json;
            return config.url + jsonPath + config.queryString;
          }
        };
      });
      Crocodoc.addDataProvider('page-img', function(scope) {
        'use strict';
        var util = scope.getUtility('common'),
            config = scope.getConfig();
        return {
          get: function(objectType, pageNum) {
            var img = this.getImage(),
                retries = Crocodoc.ASSET_REQUEST_RETRIES,
                loaded = false,
                url = this.getURL(pageNum),
                $deferred = $.Deferred();
            function loadImage() {
              img.setAttribute('src', url);
            }
            function abortImage() {
              if (img) {
                img.removeAttribute('src');
              }
            }
            img.onload = function() {
              loaded = true;
              $deferred.resolve(img);
            };
            img.onerror = function() {
              if (retries > 0) {
                retries--;
                abortImage();
                loadImage();
              } else {
                img = null;
                loaded = false;
                $deferred.reject({
                  error: 'image failed to load',
                  resource: url
                });
              }
            };
            loadImage();
            return $deferred.promise({abort: function() {
                if (!loaded) {
                  abortImage();
                  $deferred.reject();
                }
              }});
          },
          getURL: function(pageNum) {
            var imgPath = util.template(config.template.img, {page: pageNum});
            return config.url + imgPath + config.queryString;
          },
          getImage: function() {
            return new Image();
          }
        };
      });
      Crocodoc.addDataProvider('page-svg', function(scope) {
        'use strict';
        var MAX_DATA_URLS = 1000;
        var util = scope.getUtility('common'),
            ajax = scope.getUtility('ajax'),
            browser = scope.getUtility('browser'),
            subpx = scope.getUtility('subpx'),
            config = scope.getConfig(),
            destroyed = false,
            cache = {},
            inlineCSSRegExp = /<xhtml:link[^>]*>(\s*<\/xhtml:link>)?/i;
        function interpolateCSSText(text, cssText) {
          var stylesheetHTML = '<style>' + cssText + '</style>';
          if (browser.firefox && !subpx.isSubpxSupported()) {
            stylesheetHTML += '<style>text { text-rendering: geometricPrecision; }</style>';
          }
          text = text.replace(inlineCSSRegExp, stylesheetHTML);
          return text;
        }
        function processSVGContent(text) {
          if (destroyed) {
            return;
          }
          var query = config.queryString.replace('&', '&#38;'),
              dataUrlCount;
          dataUrlCount = util.countInStr(text, 'xlink:href="data:image');
          if (dataUrlCount > MAX_DATA_URLS) {
            text = text.replace(/<image[\s\w-_="]*xlink:href="data:image\/[^"]{0,5120}"[^>]*>/ig, '');
          }
          text = text.replace(/href="([^"#:]*)"/g, function(match, group) {
            return 'href="' + config.url + group + query + '"';
          });
          return scope.get('stylesheet').then(function(cssText) {
            return interpolateCSSText(text, cssText);
          });
        }
        return {
          get: function(objectType, pageNum) {
            var url = this.getURL(pageNum),
                $promise;
            if (cache[pageNum]) {
              return cache[pageNum];
            }
            $promise = ajax.fetch(url, Crocodoc.ASSET_REQUEST_RETRIES);
            cache[pageNum] = $promise.then(processSVGContent).promise({abort: function() {
                $promise.abort();
                if (cache) {
                  delete cache[pageNum];
                }
              }});
            return cache[pageNum];
          },
          getURL: function(pageNum) {
            var svgPath = util.template(config.template.svg, {page: pageNum});
            return config.url + svgPath + config.queryString;
          },
          destroy: function() {
            destroyed = true;
            util = ajax = subpx = browser = config = cache = null;
          }
        };
      });
      Crocodoc.addDataProvider('page-text', function(scope) {
        'use strict';
        var MAX_TEXT_BOXES = 256;
        var util = scope.getUtility('common'),
            ajax = scope.getUtility('ajax'),
            config = scope.getConfig(),
            destroyed = false,
            cache = {};
        function processTextContent(text) {
          if (destroyed) {
            return;
          }
          var numTextBoxes = util.countInStr(text, '<div');
          if (numTextBoxes > MAX_TEXT_BOXES) {
            return '';
          }
          text = text.replace(/<link rel="stylesheet".*/, '');
          return text;
        }
        return {
          get: function(objectType, pageNum) {
            var url = this.getURL(pageNum),
                $promise;
            if (cache[pageNum]) {
              return cache[pageNum];
            }
            $promise = ajax.fetch(url, Crocodoc.ASSET_REQUEST_RETRIES);
            cache[pageNum] = $promise.then(processTextContent).promise({abort: function() {
                $promise.abort();
                if (cache) {
                  delete cache[pageNum];
                }
              }});
            return cache[pageNum];
          },
          getURL: function(pageNum) {
            var textPath = util.template(config.template.html, {page: pageNum});
            return config.url + textPath + config.queryString;
          },
          destroy: function() {
            destroyed = true;
            util = ajax = config = cache = null;
          }
        };
      });
      Crocodoc.addDataProvider('stylesheet', function(scope) {
        'use strict';
        var ajax = scope.getUtility('ajax'),
            browser = scope.getUtility('browser'),
            config = scope.getConfig(),
            $cachedPromise;
        function processStylesheetContent(text) {
          if (browser.ie) {
            text = text.replace(/font-family:[\s\"\']*([\w-]+)\b/g, '$0-' + config.id);
          }
          return text;
        }
        return {
          get: function() {
            if ($cachedPromise) {
              return $cachedPromise;
            }
            var $promise = ajax.fetch(this.getURL(), Crocodoc.ASSET_REQUEST_RETRIES);
            $cachedPromise = $promise.then(processStylesheetContent).promise({abort: function() {
                $promise.abort();
                $cachedPromise = null;
              }});
            return $cachedPromise;
          },
          getURL: function() {
            var cssPath = config.template.css;
            return config.url + cssPath + config.queryString;
          },
          destroy: function() {
            ajax = browser = config = null;
            $cachedPromise = null;
          }
        };
      });
      Crocodoc.addUtility('ajax', function(framework) {
        'use strict';
        var util = framework.getUtility('common'),
            support = framework.getUtility('support'),
            urlUtil = framework.getUtility('url');
        function createRequestWrapper(req) {
          var status,
              statusText,
              responseText;
          try {
            status = req.status;
            statusText = req.statusText;
            responseText = req.responseText;
          } catch (e) {
            status = 0;
            statusText = '';
            responseText = null;
          }
          return {
            status: status,
            statusText: statusText,
            responseText: responseText,
            rawRequest: req
          };
        }
        function isRequestToLocalFile(url) {
          return urlUtil.parse(url).protocol === 'file:';
        }
        function isSuccessfulStatusCode(status) {
          return status >= 200 && status < 300 || status === 304;
        }
        function parseOptions(options) {
          options = util.extend(true, {}, options || {});
          options.method = options.method || 'GET';
          options.headers = options.headers || [];
          options.data = options.data || '';
          if (typeof options.data !== 'string') {
            options.data = $.param(options.data);
            if (options.method !== 'GET') {
              options.data = options.data;
              options.headers.push(['Content-Type', 'application/x-www-form-urlencoded']);
            }
          }
          return options;
        }
        function setHeaders(req, headers) {
          var i;
          for (i = 0; i < headers.length; ++i) {
            req.setRequestHeader(headers[i][0], headers[i][1]);
          }
        }
        function doXHR(url, method, data, headers, success, fail) {
          var req = support.getXHR();
          req.open(method, url, true);
          req.onreadystatechange = function() {
            var status;
            if (req.readyState === 4) {
              req.onreadystatechange = function() {};
              try {
                status = req.status;
              } catch (e) {
                fail(req);
                return;
              }
              if (status === 0 && isRequestToLocalFile(url)) {
                status = 200;
              }
              if (isSuccessfulStatusCode(status)) {
                success(req);
              } else {
                fail(req);
              }
            }
          };
          setHeaders(req, headers);
          req.send(data);
          return req;
        }
        function doXDR(url, method, data, success, fail) {
          var req = support.getXDR();
          try {
            req.open(method, url);
            req.onload = function() {
              success(req);
            };
            req.onerror = function() {
              fail(req);
            };
            req.ontimeout = function() {
              fail(req);
            };
            req.onprogress = function() {};
            req.send(data);
          } catch (e) {
            return fail({
              status: 0,
              statusText: e.message
            });
          }
          return req;
        }
        return {
          request: function(url, options) {
            var opt = parseOptions(options),
                method = opt.method,
                data = opt.data,
                headers = opt.headers;
            if (method === 'GET' && data) {
              url = urlUtil.appendQueryParams(url, data);
              data = '';
            }
            function ajaxSuccess(req) {
              if (util.isFn(opt.success)) {
                opt.success.call(createRequestWrapper(req));
              }
              return req;
            }
            function ajaxFail(req) {
              if (util.isFn(opt.fail)) {
                opt.fail.call(createRequestWrapper(req));
              }
              return req;
            }
            if (!support.isXHRSupported()) {
              return opt.fail({
                status: 0,
                statusText: 'AJAX not supported'
              });
            }
            if (urlUtil.isCrossDomain(url) && !support.isCORSSupported()) {
              return doXDR(url, method, data, ajaxSuccess, ajaxFail);
            } else {
              return doXHR(url, method, data, headers, ajaxSuccess, ajaxFail);
            }
          },
          fetch: function(url, retries) {
            var req,
                aborted = false,
                ajax = this,
                $deferred = $.Deferred();
            function retryOrFail(error) {
              if (retries > 0) {
                retries--;
                req = request();
              } else {
                $deferred.reject(error);
              }
            }
            function request() {
              return ajax.request(url, {
                success: function() {
                  var retryAfter,
                      req;
                  if (!aborted) {
                    req = this.rawRequest;
                    if (this.status === 202 && util.isFn(req.getResponseHeader)) {
                      retryAfter = parseInt(req.getResponseHeader('retry-after'));
                      if (retryAfter > 0) {
                        setTimeout(request, retryAfter * 1000);
                        return;
                      }
                    }
                    if (this.responseText) {
                      $deferred.resolve(this.responseText);
                    } else {
                      retryOrFail({
                        error: 'empty response',
                        status: this.status,
                        resource: url
                      });
                    }
                  }
                },
                fail: function() {
                  if (!aborted) {
                    retryOrFail({
                      error: this.statusText,
                      status: this.status,
                      resource: url
                    });
                  }
                }
              });
            }
            req = request();
            return $deferred.promise({abort: function() {
                aborted = true;
                req.abort();
              }});
          }
        };
      });
      Crocodoc.addUtility('browser', function() {
        'use strict';
        var ua = navigator.userAgent,
            version,
            browser = {},
            ios = /ip(hone|od|ad)/i.test(ua),
            android = /android/i.test(ua),
            blackberry = /blackberry/i.test(ua),
            webos = /webos/i.test(ua),
            kindle = /silk|kindle/i.test(ua),
            ie = /MSIE|Trident/i.test(ua);
        if (ie) {
          browser.ie = true;
          if (/MSIE/i.test(ua)) {
            version = /MSIE\s+(\d+\.\d+)/i.exec(ua);
          } else {
            version = /Trident.*rv[ :](\d+\.\d+)/.exec(ua);
          }
          browser.version = version && parseFloat(version[1]);
          browser.ielt9 = browser.version < 9;
          browser.ielt10 = browser.version < 10;
          browser.ielt11 = browser.version < 11;
        }
        if (ios) {
          browser.ios = true;
          version = (navigator.appVersion).match(/OS (\d+)_(\d+)_?(\d+)?/);
          browser.version = version && parseFloat(version[1] + '.' + version[2]);
        }
        browser.mobile = /mobile/i.test(ua) || ios || android || blackberry || webos || kindle;
        browser.firefox = /firefox/i.test(ua);
        if (/safari/i.test(ua)) {
          browser.chrome = /chrome/i.test(ua);
          browser.safari = !browser.chrome;
        }
        if (browser.safari) {
          version = (navigator.appVersion).match(/Version\/(\d+(\.\d+)?)/);
          browser.version = version && parseFloat(version[1]);
        }
        return browser;
      });
      Crocodoc.addUtility('common', function() {
        'use strict';
        var DEFAULT_PT2PX_RATIO = 1.33333;
        var util = {};
        util.extend = $.extend;
        util.each = $.each;
        util.map = $.map;
        util.param = $.param;
        util.parseJSON = $.parseJSON;
        util.stringifyJSON = typeof window.JSON !== 'undefined' ? window.JSON.stringify : function() {
          throw new Error('JSON.stringify not supported');
        };
        return $.extend(util, {
          bisectLeft: function(list, x, prop) {
            var val,
                mid,
                low = 0,
                high = list.length;
            while (low < high) {
              mid = Math.floor((low + high) / 2);
              val = prop ? list[mid][prop] : list[mid];
              if (val < x) {
                low = mid + 1;
              } else {
                high = mid;
              }
            }
            return low;
          },
          bisectRight: function(list, x, prop) {
            var val,
                mid,
                low = 0,
                high = list.length;
            while (low < high) {
              mid = Math.floor((low + high) / 2);
              val = prop ? list[mid][prop] : list[mid];
              if (x < val) {
                high = mid;
              } else {
                low = mid + 1;
              }
            }
            return low;
          },
          clamp: function(x, a, b) {
            if (x < a) {
              return a;
            } else if (x > b) {
              return b;
            }
            return x;
          },
          sign: function(value) {
            var number = parseInt(value, 10);
            if (!number) {
              return number;
            }
            return number < 0 ? -1 : 1;
          },
          isFn: function(val) {
            return typeof val === 'function';
          },
          inArray: function(value, array) {
            if (util.isFn(array.indexOf)) {
              return array.indexOf(value);
            } else {
              return $.inArray(value, array);
            }
          },
          constrainRange: function(low, high, max) {
            var length = high - low;
            if (length < 0) {
              return {
                min: -1,
                max: -1
              };
            }
            low = util.clamp(low, 0, max);
            high = util.clamp(low + length, 0, max);
            if (high - low < length) {
              low = util.clamp(high - length, 0, max);
            }
            return {
              min: low,
              max: high
            };
          },
          now: function() {
            return (new Date()).getTime();
          },
          throttle: function(wait, fn) {
            var context,
                args,
                timeout,
                result,
                previous = 0;
            function later() {
              previous = util.now();
              timeout = null;
              result = fn.apply(context, args);
            }
            return function throttled() {
              var now = util.now(),
                  remaining = wait - (now - previous);
              context = this;
              args = arguments;
              if (remaining <= 0) {
                clearTimeout(timeout);
                timeout = null;
                previous = now;
                result = fn.apply(context, args);
              } else if (!timeout) {
                timeout = setTimeout(later, remaining);
              }
              return result;
            };
          },
          debounce: function(wait, fn) {
            var context,
                args,
                timeout,
                timestamp,
                result;
            function later() {
              var last = util.now() - timestamp;
              if (last < wait) {
                timeout = setTimeout(later, wait - last);
              } else {
                timeout = null;
                result = fn.apply(context, args);
                context = args = null;
              }
            }
            return function debounced() {
              context = this;
              args = arguments;
              timestamp = util.now();
              if (!timeout) {
                timeout = setTimeout(later, wait);
              }
              return result;
            };
          },
          insertCSS: function(css) {
            var styleEl = document.createElement('style'),
                cssTextNode = document.createTextNode(css);
            try {
              styleEl.setAttribute('type', 'text/css');
              styleEl.appendChild(cssTextNode);
            } catch (err) {}
            document.getElementsByTagName('head')[0].appendChild(styleEl);
            return styleEl;
          },
          appendCSSRule: function(sheet, selector, rule) {
            var index;
            if (sheet.insertRule) {
              return sheet.insertRule(selector + '{' + rule + '}', sheet.cssRules.length);
            } else {
              index = sheet.addRule(selector, rule, sheet.rules.length);
              if (index < 0) {
                index = sheet.rules.length - 1;
              }
              return index;
            }
          },
          deleteCSSRule: function(sheet, index) {
            if (sheet.deleteRule) {
              sheet.deleteRule(index);
            } else {
              sheet.removeRule(index);
            }
          },
          getSelectedNode: function() {
            var node,
                sel,
                range;
            if (window.getSelection) {
              sel = window.getSelection();
              if (sel.rangeCount) {
                range = sel.getRangeAt(0);
                if (!range.collapsed) {
                  node = sel.anchorNode.parentNode;
                }
              }
            } else if (document.selection) {
              node = document.selection.createRange().parentElement();
            }
            return node;
          },
          getComputedStyle: function(el) {
            if ('getComputedStyle' in window) {
              return window.getComputedStyle(el);
            }
            return el.currentStyle;
          },
          calculatePtSize: function() {
            var style,
                px,
                testSize = 10000,
                div = document.createElement('div');
            div.style.display = 'block';
            div.style.position = 'absolute';
            div.style.width = testSize + 'pt';
            document.body.appendChild(div);
            style = util.getComputedStyle(div);
            if (style && style.width) {
              px = parseFloat(style.width) / testSize;
            } else {
              px = DEFAULT_PT2PX_RATIO;
            }
            document.body.removeChild(div);
            return px;
          },
          countInStr: function(str, token) {
            var total = 0,
                i;
            while ((i = str.indexOf(token, i) + 1)) {
              total++;
            }
            return total;
          },
          template: function(template, data) {
            var p;
            for (p in data) {
              if (data.hasOwnProperty(p)) {
                template = template.replace(new RegExp('\\{\\{' + p + '\\}\\}', 'g'), data[p]);
              }
            }
            return template;
          }
        });
      });
      Crocodoc.addUtility('subpx', function(framework) {
        'use strict';
        var CSS_CLASS_SUBPX_FIX = 'crocodoc-subpx-fix',
            TEST_SPAN_TEMPLATE = '<span style="font:{{size}}px serif; color:transparent; white-space:nowrap;">' + (new Array(100)).join('A') + '</span>';
        var util = framework.getUtility('common');
        function isSubpixelRenderingSupported() {
          if (!$.support.leadingWhitespace) {
            return false;
          } else {
            var span = $(util.template(TEST_SPAN_TEMPLATE, {size: 12.5})).appendTo(document.documentElement).get(0);
            var fontsize1 = $(span).css('font-size');
            var width1 = $(span).width();
            $(span).remove();
            span = $(util.template(TEST_SPAN_TEMPLATE, {size: 12.6})).appendTo(document.documentElement).get(0);
            var fontsize2 = $(span).css('font-size');
            var width2 = $(span).width();
            $(span).remove();
            if (!('ontouchstart' in window)) {
              if (fontsize1 === fontsize2) {
                return false;
              }
              if (width1 === width2) {
                return false;
              }
            }
          }
          return true;
        }
        var subpixelRenderingIsSupported = isSubpixelRenderingSupported();
        return {
          fix: function(el) {
            if (!subpixelRenderingIsSupported) {
              if (document.body.style.zoom !== undefined) {
                var $wrap = $('<div>').addClass(CSS_CLASS_SUBPX_FIX);
                $(el).wrap($wrap);
              }
            }
            return el;
          },
          isSubpxSupported: function() {
            return subpixelRenderingIsSupported;
          }
        };
      });
      Crocodoc.addUtility('support', function() {
        'use strict';
        var prefixes = ['Moz', 'Webkit', 'O', 'ms'],
            xhrSupported = null,
            xhrCORSSupported = null;
        function getVendorCSSPropertyName(prop) {
          var testDiv = document.createElement('div'),
              prop_,
              i,
              vendorProp;
          if (prop in testDiv.style) {
            return prop;
          }
          prop_ = prop.charAt(0).toUpperCase() + prop.substr(1);
          if (prop in testDiv.style) {
            return prop;
          }
          for (i = 0; i < prefixes.length; ++i) {
            vendorProp = prefixes[i] + prop_;
            if (vendorProp in testDiv.style) {
              if (vendorProp.indexOf('ms') === 0) {
                vendorProp = '-' + vendorProp;
              }
              return uncamel(vendorProp);
            }
          }
          return false;
        }
        function uncamel(str) {
          return str.replace(/([A-Z])/g, function(letter) {
            return '-' + letter.toLowerCase();
          });
        }
        return {
          svg: document.implementation.hasFeature('http://www.w3.org/TR/SVG11/feature#BasicStructure', '1.1'),
          csstransform: getVendorCSSPropertyName('transform'),
          csstransition: getVendorCSSPropertyName('transition'),
          csszoom: getVendorCSSPropertyName('zoom'),
          isXHRSupported: function() {
            if (xhrSupported === null) {
              xhrSupported = !!this.getXHR();
            }
            return xhrSupported;
          },
          isCORSSupported: function() {
            if (xhrCORSSupported === null) {
              xhrCORSSupported = this.isXHRSupported() && ('withCredentials' in this.getXHR());
            }
            return xhrCORSSupported;
          },
          isXDRSupported: function() {
            return typeof window.XDomainRequest !== 'undefined';
          },
          getXHR: function() {
            if (window.XMLHttpRequest) {
              return new window.XMLHttpRequest();
            } else {
              try {
                return new ActiveXObject('MSXML2.XMLHTTP.3.0');
              } catch (ex) {
                return null;
              }
            }
          },
          getXDR: function() {
            if (this.isXDRSupported()) {
              return new window.XDomainRequest();
            }
            return null;
          }
        };
      });
      Crocodoc.addUtility('url', function(framework) {
        'use strict';
        var browser = framework.getUtility('browser'),
            parsedLocation;
        return {
          getCurrentURL: function() {
            return window.location.href;
          },
          makeAbsolute: function(path) {
            return this.parse(path).href;
          },
          isCrossDomain: function(url) {
            var parsedURL = this.parse(url);
            if (!parsedLocation) {
              parsedLocation = this.parse(this.getCurrentURL());
            }
            if (!parsedURL.hostname) {
              return false;
            }
            return parsedURL.protocol !== parsedLocation.protocol || parsedURL.hostname !== parsedLocation.hostname || parsedURL.port !== parsedLocation.port;
          },
          appendQueryParams: function(url, str) {
            if (url.indexOf('?') > -1) {
              return url + '&' + str;
            } else {
              return url + '?' + str;
            }
          },
          parse: function(url) {
            var parsed = document.createElement('a'),
                pathname;
            parsed.href = url;
            if (browser.ie && url !== parsed.href) {
              url = parsed.href;
              parsed.href = url;
            }
            pathname = parsed.pathname;
            if (!/^\//.test(pathname)) {
              pathname = '/' + pathname;
            }
            return {
              href: parsed.href,
              protocol: parsed.protocol,
              host: parsed.host,
              hostname: parsed.hostname,
              port: parsed.port,
              pathname: pathname,
              hash: parsed.hash,
              search: parsed.search
            };
          }
        };
      });
      Crocodoc.addComponent('controller-paged', function(scope) {
        'use strict';
        var util = scope.getUtility('common');
        var config,
            $el,
            lazyLoader;
        function validateConfig() {
          var metadata = config.metadata;
          config.numPages = metadata.numpages;
          if (!config.pageStart) {
            config.pageStart = 1;
          } else if (config.pageStart < 0) {
            config.pageStart = metadata.numpages + config.pageStart;
          }
          config.pageStart = util.clamp(config.pageStart, 1, metadata.numpages);
          if (!config.pageEnd) {
            config.pageEnd = metadata.numpages;
          } else if (config.pageEnd < 0) {
            config.pageEnd = metadata.numpages + config.pageEnd;
          }
          config.pageEnd = util.clamp(config.pageEnd, config.pageStart, metadata.numpages);
          config.numPages = config.pageEnd - config.pageStart + 1;
        }
        function prepareDOM() {
          var i,
              pageNum,
              zoomLevel,
              maxZoom,
              ptWidth,
              ptHeight,
              pxWidth,
              pxHeight,
              pt2px = util.calculatePtSize(),
              dimensions = config.metadata.dimensions,
              skeleton = '';
          config.pageScale = DOCUMENT_100_PERCENT_WIDTH / (dimensions.width * pt2px);
          zoomLevel = config.zoomLevels[config.zoomLevels.length - 1];
          maxZoom = 3 / config.pageScale;
          while (zoomLevel < maxZoom) {
            zoomLevel += zoomLevel / 2;
            config.zoomLevels.push(zoomLevel);
          }
          dimensions.exceptions = dimensions.exceptions || {};
          for (i = config.pageStart - 1; i < config.pageEnd; i++) {
            pageNum = i + 1;
            if (pageNum in dimensions.exceptions) {
              ptWidth = dimensions.exceptions[pageNum].width;
              ptHeight = dimensions.exceptions[pageNum].height;
            } else {
              ptWidth = dimensions.width;
              ptHeight = dimensions.height;
            }
            pxWidth = ptWidth * pt2px;
            pxHeight = ptHeight * pt2px;
            pxWidth *= config.pageScale;
            pxHeight *= config.pageScale;
            skeleton += util.template(Crocodoc.pageTemplate, {
              w: pxWidth,
              h: pxHeight
            });
          }
          config.$pages = $(skeleton).appendTo(config.$doc);
        }
        function getInitialPageStatus(pageIndex) {
          if (config.conversionIsComplete || (pageIndex === 0 && config.autoloadFirstPage)) {
            return PAGE_STATUS_NOT_LOADED;
          }
          return PAGE_STATUS_CONVERTING;
        }
        function createPages() {
          var i,
              pages = [],
              page,
              start = config.pageStart - 1,
              end = config.pageEnd,
              links = sortPageLinks();
          for (i = start; i < end; i++) {
            page = scope.createComponent('page');
            page.init(config.$pages.eq(i - start), {
              index: i,
              status: getInitialPageStatus(i),
              enableLinks: config.enableLinks,
              links: links[i],
              pageScale: config.pageScale,
              useSVG: config.useSVG
            });
            pages.push(page);
          }
          config.pages = pages;
        }
        function sortPageLinks() {
          var i,
              len,
              link,
              destination,
              start = config.pageStart,
              end = config.pageEnd,
              links = config.metadata.links || [],
              sorted = [];
          for (i = 0, len = config.metadata.numpages; i < len; ++i) {
            sorted[i] = [];
          }
          for (i = 0, len = links.length; i < len; ++i) {
            link = links[i];
            if (link.pagenum < start || link.pagenum > end) {
              continue;
            }
            if (link.destination) {
              destination = link.destination.pagenum;
              if (destination < start || destination > end) {
                continue;
              } else {
                link.destination.pagenum = destination - (start - 1);
              }
            }
            sorted[link.pagenum - 1].push(link);
          }
          return sorted;
        }
        function handleMouseUp() {
          updateSelectedPages();
        }
        function updateSelectedPages() {
          var node = util.getSelectedNode();
          var $page = $(node).closest('.' + CSS_CLASS_PAGE);
          $el.find('.' + CSS_CLASS_TEXT_SELECTED).removeClass(CSS_CLASS_TEXT_SELECTED);
          if (node && $el.has(node)) {
            $page.addClass(CSS_CLASS_TEXT_SELECTED);
          }
        }
        return {
          init: function() {
            config = scope.getConfig();
            $el = config.$el;
            $(document).on('mouseup', handleMouseUp);
            validateConfig();
            prepareDOM();
            createPages();
            lazyLoader = scope.createComponent('lazy-loader');
            lazyLoader.init(config.pages);
          },
          destroy: function() {
            $(document).off('mouseup', handleMouseUp);
          }
        };
      });
      Crocodoc.addComponent('controller-text', function(scope) {
        'use strict';
        var $promise;
        return {
          init: function() {
            var config = scope.getConfig();
            config.$textContainer = $();
            $promise = scope.get('page-text', 1).then(function(html) {
              var $viewport = config.$doc.parent();
              config.$doc = $(html);
              $viewport.html(config.$doc);
            });
          },
          destroy: function() {
            $promise.abort();
          }
        };
      });
      Crocodoc.addComponent('dragger', function(scope) {
        'use strict';
        var $el,
            $window = $(window),
            downScrollPosition,
            downMousePosition;
        function handleMousemove(event) {
          $el.scrollTop(downScrollPosition.top - (event.clientY - downMousePosition.y));
          $el.scrollLeft(downScrollPosition.left - (event.clientX - downMousePosition.x));
          event.preventDefault();
        }
        function handleMouseup(event) {
          scope.broadcast('dragend');
          $window.off('mousemove', handleMousemove);
          $window.off('mouseup', handleMouseup);
          event.preventDefault();
        }
        function handleMousedown(event) {
          scope.broadcast('dragstart');
          downScrollPosition = {
            top: $el.scrollTop(),
            left: $el.scrollLeft()
          };
          downMousePosition = {
            x: event.clientX,
            y: event.clientY
          };
          $window.on('mousemove', handleMousemove);
          $window.on('mouseup', handleMouseup);
          event.preventDefault();
        }
        return {
          init: function(el) {
            $el = $(el);
            $el.on('mousedown', handleMousedown);
          },
          destroy: function() {
            $el.off('mousedown', handleMousedown);
            $el.off('mousemove', handleMousemove);
            $window.off('mouseup', handleMouseup);
          }
        };
      });
      Crocodoc.addComponent('layout-base', function(scope) {
        'use strict';
        var util = scope.getUtility('common');
        return {
          messages: ['resize', 'scroll', 'scrollend'],
          onmessage: function(name, data) {
            switch (name) {
              case 'resize':
                this.handleResize(data);
                break;
              case 'scroll':
                this.handleScroll(data);
                break;
              case 'scrollend':
                this.handleScrollEnd(data);
                break;
            }
          },
          init: function() {
            var config = scope.getConfig();
            this.config = config;
            this.$el = config.$el;
            this.$doc = config.$doc;
            this.$viewport = config.$viewport;
            this.$pages = config.$pages;
            this.numPages = config.numPages;
            this.layoutClass = CSS_CLASS_LAYOUT_PREFIX + config.layout;
            this.$el.addClass(this.layoutClass);
            this.initState();
          },
          initState: function() {
            var viewportEl = this.$viewport[0],
                dimensionsEl = viewportEl;
            if (viewportEl === window) {
              dimensionsEl = document.documentElement;
            }
            this.state = {
              scrollTop: viewportEl.scrollTop,
              scrollLeft: viewportEl.scrollLeft,
              viewportDimensions: {
                clientWidth: dimensionsEl.clientWidth,
                clientHeight: dimensionsEl.clientHeight,
                offsetWidth: dimensionsEl.offsetWidth,
                offsetHeight: dimensionsEl.offsetHeight
              },
              zoomState: {
                zoom: 1,
                prevZoom: 0,
                zoomMode: null
              },
              initialWidth: 0,
              initialHeight: 0,
              totalWidth: 0,
              totalHeight: 0
            };
            this.zoomLevels = [];
          },
          destroy: function() {
            this.$doc.removeAttr('style');
            this.$el.removeClass(this.layoutClass);
          },
          setZoom: function() {},
          calculateNextZoomLevel: function(direction) {
            var i,
                zoom = false,
                currentZoom = this.state.zoomState.zoom,
                zoomLevels = this.zoomLevels;
            if (direction === Crocodoc.ZOOM_IN) {
              for (i = 0; i < zoomLevels.length; ++i) {
                if (zoomLevels[i] > currentZoom) {
                  zoom = zoomLevels[i];
                  break;
                }
              }
            } else if (direction === Crocodoc.ZOOM_OUT) {
              for (i = zoomLevels.length - 1; i >= 0; --i) {
                if (zoomLevels[i] < currentZoom) {
                  zoom = zoomLevels[i];
                  break;
                }
              }
            }
            return zoom;
          },
          isDraggable: function() {
            var state = this.state;
            return (state.viewportDimensions.clientHeight < state.totalHeight) || (state.viewportDimensions.clientWidth < state.totalWidth);
          },
          scrollBy: function(left, top) {
            left = parseInt(left, 10) || 0;
            top = parseInt(top, 10) || 0;
            this.scrollToOffset(left + this.state.scrollLeft, top + this.state.scrollTop);
          },
          scrollToOffset: function(left, top) {
            this.$viewport.scrollLeft(left);
            this.$viewport.scrollTop(top);
          },
          handleScroll: function(data) {
            this.state.scrollTop = data.scrollTop;
            this.state.scrollLeft = data.scrollLeft;
          },
          handleResize: function() {},
          handleScrollEnd: function() {},
          update: function() {},
          focus: function() {
            this.$viewport.focus();
          },
          extend: function(layout) {
            return util.extend({}, this, layout);
          }
        };
      });
      Crocodoc.addComponent('layout-' + LAYOUT_HORIZONTAL, ['layout-paged'], function(scope, paged) {
        'use strict';
        var util = scope.getUtility('common'),
            browser = scope.getUtility('browser');
        return paged.extend({
          calculateZoomAutoValue: function() {
            var state = this.state,
                fitWidth = this.calculateZoomValue(ZOOM_FIT_WIDTH),
                fitHeight = this.calculateZoomValue(ZOOM_FIT_HEIGHT);
            if (state.widestPage.actualWidth > state.tallestPage.actualHeight) {
              return Math.min(fitWidth, fitHeight);
            } else {
              if (browser.mobile) {
                return fitHeight;
              }
              return Math.min(1, fitHeight);
            }
          },
          calculateCurrentPage: function() {
            var prev,
                page,
                state = this.state,
                pages = state.pages;
            prev = util.bisectRight(pages, state.scrollLeft, 'x0') - 1;
            page = util.bisectRight(pages, state.scrollLeft + pages[prev].width / 2, 'x0') - 1;
            return 1 + page;
          },
          calculateNextPage: function() {
            return this.state.currentPage + 1;
          },
          calculatePreviousPage: function() {
            return this.state.currentPage - 1;
          },
          handleResize: function(data) {
            paged.handleResize.call(this, data);
            this.updateCurrentPage();
          },
          handleScroll: function(data) {
            paged.handleScroll.call(this, data);
            this.updateCurrentPage();
          },
          updateLayout: function() {
            var state = this.state,
                zoomState = state.zoomState,
                zoom = zoomState.zoom,
                zoomedWidth = state.sumWidths,
                zoomedHeight = Math.floor(state.tallestPage.totalActualHeight * zoom),
                docWidth = Math.max(zoomedWidth, state.viewportDimensions.clientWidth),
                docHeight = Math.max(zoomedHeight, state.viewportDimensions.clientHeight);
            this.$doc.css({
              height: docHeight,
              lineHeight: docHeight + 'px',
              width: docWidth
            });
          }
        });
      });
      Crocodoc.addComponent('layout-paged', ['layout-base'], function(scope, base) {
        'use strict';
        var util = scope.getUtility('common'),
            support = scope.getUtility('support');
        function applyZoomResize(layout, zoom) {
          var i,
              len,
              pageState,
              cssRule,
              state = layout.state,
              selector = '.' + layout.config.namespace + ' .' + CSS_CLASS_PAGE_AUTOSCALE,
              stylesheet = layout.config.stylesheet,
              pages = state.pages,
              scale = zoom * layout.config.pageScale,
              percent = 100 / scale;
          if (support.csstransform) {
            cssRule = support.csstransform + ':scale(' + scale + ');' + 'width:' + percent + '%;' + 'height:' + percent + '%;';
          } else if (support.csszoom) {
            cssRule = 'zoom:' + scale;
          } else {
            cssRule = '';
          }
          if (state.previousStyleIndex) {
            util.deleteCSSRule(stylesheet, state.previousStyleIndex);
          }
          state.previousStyleIndex = util.appendCSSRule(stylesheet, selector, cssRule);
          for (i = 0, len = pages.length; i < len; ++i) {
            pageState = pages[i];
            layout.$pages.eq(i).css({
              width: pageState.actualWidth * zoom,
              height: pageState.actualHeight * zoom,
              paddingTop: pageState.paddingTop * zoom,
              paddingRight: pageState.paddingRight * zoom,
              paddingBottom: pageState.paddingBottom * zoom,
              paddingLeft: pageState.paddingLeft * zoom
            });
          }
        }
        function getMaxY1InRow(pages, row) {
          if (!row || row.length === 0) {
            return Infinity;
          }
          var y1s = util.map(row, function(pageIndex) {
            return pages[pageIndex].y1;
          });
          return Math.max.apply(Math, y1s);
        }
        return base.extend({
          init: function() {
            base.init.call(this);
            this.updatePageStates();
            this.updateZoomLevels();
          },
          initState: function() {
            base.initState.call(this);
            util.extend(this.state, {
              pages: [],
              widestPage: {
                index: 0,
                actualWidth: 0
              },
              tallestPage: {
                index: 0,
                actualHeight: 0
              },
              sumWidths: 0,
              sumHeights: 0,
              rows: [],
              currentPage: null,
              visiblePages: [],
              fullyVisiblePages: []
            });
          },
          destroy: function() {
            base.destroy.call(this);
            this.$pages.css('padding', '');
          },
          update: function() {
            this.updatePageStates(true);
            this.setZoom();
          },
          setZoom: function(val) {
            var state = this.state,
                zoom = this.parseZoomValue(val),
                zoomState = state.zoomState,
                currentZoom = zoomState.zoom,
                zoomMode,
                shouldNotCenter;
            zoomMode = this.calculateZoomMode(val, zoom);
            zoom = util.clamp(zoom, state.minZoom, state.maxZoom);
            scope.broadcast('beforezoom', util.extend({
              page: state.currentPage,
              visiblePages: util.extend([], state.visiblePages),
              fullyVisiblePages: util.extend([], state.fullyVisiblePages)
            }, zoomState));
            zoomState.prevZoom = currentZoom;
            zoomState.zoom = zoom;
            zoomState.zoomMode = zoomMode;
            this.applyZoom(zoom);
            zoomState.canZoomIn = this.calculateNextZoomLevel(Crocodoc.ZOOM_IN) !== false;
            zoomState.canZoomOut = this.calculateNextZoomLevel(Crocodoc.ZOOM_OUT) !== false;
            this.updatePageStates();
            this.updateLayout();
            shouldNotCenter = val === Crocodoc.ZOOM_AUTO || val === Crocodoc.ZOOM_FIT_WIDTH || val === Crocodoc.ZOOM_FIT_HEIGHT;
            this.updateScrollPosition(shouldNotCenter);
            this.updatePageStates();
            this.updateVisiblePages(true);
            scope.broadcast('zoom', util.extend({
              page: state.currentPage,
              visiblePages: util.extend([], state.visiblePages),
              fullyVisiblePages: util.extend([], state.fullyVisiblePages),
              isDraggable: this.isDraggable()
            }, zoomState));
          },
          parseZoomValue: function(val) {
            var zoomVal = parseFloat(val),
                state = this.state,
                zoomState = state.zoomState,
                currentZoom = zoomState.zoom,
                nextZoom = currentZoom;
            if (zoomVal) {
              nextZoom = zoomVal;
            } else {
              switch (val) {
                case Crocodoc.ZOOM_FIT_WIDTH:
                case Crocodoc.ZOOM_FIT_HEIGHT:
                case Crocodoc.ZOOM_AUTO:
                  nextZoom = this.calculateZoomValue(val);
                  break;
                case Crocodoc.ZOOM_IN:
                case Crocodoc.ZOOM_OUT:
                  nextZoom = this.calculateNextZoomLevel(val) || currentZoom;
                  break;
                default:
                  if (!currentZoom) {
                    nextZoom = this.calculateZoomValue(this.config.zoom || Crocodoc.ZOOM_AUTO);
                  } else if (zoomState.zoomMode) {
                    nextZoom = this.calculateZoomValue(zoomState.zoomMode);
                  } else {
                    nextZoom = currentZoom;
                  }
                  break;
              }
            }
            return nextZoom;
          },
          calculateZoomMode: function(val, parsedZoom) {
            switch (parsedZoom) {
              case this.calculateZoomValue(Crocodoc.ZOOM_AUTO):
                if (typeof val === 'string' && (val === Crocodoc.ZOOM_FIT_WIDTH || val === Crocodoc.ZOOM_FIT_HEIGHT)) {
                  return val;
                }
                return Crocodoc.ZOOM_AUTO;
              case this.calculateZoomValue(Crocodoc.ZOOM_FIT_WIDTH):
                return Crocodoc.ZOOM_FIT_WIDTH;
              case this.calculateZoomValue(Crocodoc.ZOOM_FIT_HEIGHT):
                return Crocodoc.ZOOM_FIT_HEIGHT;
              default:
                return null;
            }
          },
          updateZoomLevels: function() {
            var i,
                lastZoomLevel,
                zoomLevels = this.config.zoomLevels.slice() || [1],
                auto = this.calculateZoomValue(Crocodoc.ZOOM_AUTO),
                fitWidth = this.calculateZoomValue(Crocodoc.ZOOM_FIT_WIDTH),
                fitHeight = this.calculateZoomValue(Crocodoc.ZOOM_FIT_HEIGHT),
                presets = [fitWidth, fitHeight];
            this.state.minZoom = this.config.minZoom || zoomLevels[0];
            this.state.maxZoom = this.config.maxZoom || zoomLevels[zoomLevels.length - 1];
            if (auto !== fitWidth && auto !== fitHeight) {
              presets.push(auto);
            }
            zoomLevels = zoomLevels.concat(presets);
            zoomLevels.sort(function sortZoomLevels(a, b) {
              return a - b;
            });
            this.zoomLevels = [];
            function shouldUseZoomLevel(zoomLevel) {
              var similarity = lastZoomLevel / zoomLevel;
              if (zoomLevel === lastZoomLevel) {
                return false;
              }
              if (similarity < ZOOM_LEVEL_SIMILARITY_THRESHOLD) {
                return true;
              }
              if (util.inArray(zoomLevel, presets) > -1) {
                if (similarity < ZOOM_LEVEL_PRESETS_SIMILARITY_THRESHOLD) {
                  return true;
                }
              }
              return false;
            }
            lastZoomLevel = 0;
            for (i = 0; i < zoomLevels.length; ++i) {
              if (shouldUseZoomLevel(zoomLevels[i])) {
                lastZoomLevel = zoomLevels[i];
                this.zoomLevels.push(lastZoomLevel);
              }
            }
          },
          calculateZoomValue: function(mode) {
            var state = this.state,
                val = parseFloat(mode);
            if (val) {
              return val;
            }
            if (mode === Crocodoc.ZOOM_FIT_WIDTH) {
              return state.viewportDimensions.clientWidth / state.widestPage.totalActualWidth;
            } else if (mode === Crocodoc.ZOOM_FIT_HEIGHT) {
              return state.viewportDimensions.clientHeight / state.tallestPage.totalActualHeight;
            } else if (mode === Crocodoc.ZOOM_AUTO) {
              return this.calculateZoomAutoValue();
            } else {
              return state.zoomState.zoom;
            }
          },
          applyZoom: function(zoom) {
            applyZoomResize(this, zoom);
          },
          scrollTo: function(val) {
            var state = this.state,
                pageNum = parseInt(val, 10);
            if (typeof val === 'string') {
              if (val === Crocodoc.SCROLL_PREVIOUS && state.currentPage > 1) {
                pageNum = this.calculatePreviousPage();
              } else if (val === Crocodoc.SCROLL_NEXT && state.currentPage < this.numPages) {
                pageNum = this.calculateNextPage();
              } else if (!pageNum) {
                return;
              }
            } else if (!pageNum && pageNum !== 0) {
              return;
            }
            pageNum = util.clamp(pageNum, 1, this.numPages);
            this.scrollToPage(pageNum);
          },
          scrollToPage: function(page) {
            var offset = this.calculateScrollPositionForPage(page);
            this.scrollToOffset(offset.left, offset.top);
          },
          calculateCurrentPage: function() {
            return this.state.currentPage;
          },
          calculateScrollPositionForPage: function(pageNum) {
            var index = util.clamp(pageNum - 1, 0, this.numPages - 1),
                page = this.state.pages[index];
            return {
              top: page.y0,
              left: page.x0
            };
          },
          calculateVisibleRange: function() {
            var state = this.state,
                pages = state.pages,
                viewportHeight = state.viewportDimensions.clientHeight,
                viewportWidth = state.viewportDimensions.clientWidth;
            if (viewportWidth === 0 || viewportHeight === 0) {
              return {
                min: -1,
                max: -1
              };
            }
            var viewportY0 = state.scrollTop,
                viewportY1 = viewportY0 + viewportHeight,
                viewportX0 = state.scrollLeft,
                viewportX1 = viewportX0 + viewportWidth,
                lowY = util.bisectLeft(pages, viewportY0, 'y1'),
                highY = util.bisectRight(pages, viewportY1, 'y0') - 1,
                lowX = util.bisectLeft(pages, viewportX0, 'x1'),
                highX = util.bisectRight(pages, viewportX1, 'x0') - 1,
                low = Math.max(lowX, lowY),
                high = Math.min(highX, highY);
            return util.constrainRange(low, high, this.numPages - 1);
          },
          calculateFullyVisibleRange: function() {
            var state = this.state,
                pages = state.pages,
                viewportHeight = state.viewportDimensions.clientHeight,
                viewportWidth = state.viewportDimensions.clientWidth;
            if (viewportWidth === 0 || viewportHeight === 0) {
              return {
                min: -1,
                max: -1
              };
            }
            var viewportY0 = state.scrollTop,
                viewportY1 = viewportY0 + viewportHeight,
                viewportX0 = state.scrollLeft,
                viewportX1 = viewportX0 + viewportWidth,
                lowY = util.bisectLeft(pages, viewportY0, 'y0'),
                highY = util.bisectRight(pages, viewportY1, 'y1') - 1,
                lowX = util.bisectLeft(pages, viewportX0, 'x0'),
                highX = util.bisectRight(pages, viewportX1, 'x1') - 1,
                low = Math.max(lowX, lowY),
                high = Math.min(highX, highY);
            return util.constrainRange(low, high, this.numPages - 1);
          },
          setCurrentPage: function(page) {
            var state = this.state;
            if (state.currentPage !== page) {
              state.currentPage = page;
              this.updateVisiblePages();
              scope.broadcast('pagefocus', {
                page: state.currentPage,
                numPages: this.numPages,
                visiblePages: util.extend([], state.visiblePages),
                fullyVisiblePages: util.extend([], state.fullyVisiblePages)
              });
            } else {
              this.updateVisiblePages();
            }
          },
          updateVisiblePages: function(updateClasses) {
            var i,
                len,
                $page,
                state = this.state,
                visibleRange = this.calculateVisibleRange(),
                fullyVisibleRange = this.calculateFullyVisibleRange();
            state.visiblePages.length = 0;
            state.fullyVisiblePages.length = 0;
            for (i = 0, len = this.$pages.length; i < len; ++i) {
              $page = this.$pages.eq(i);
              if (i < visibleRange.min || i > visibleRange.max) {
                if (updateClasses && $page.hasClass(CSS_CLASS_PAGE_VISIBLE)) {
                  $page.removeClass(CSS_CLASS_PAGE_VISIBLE);
                }
              } else {
                if (updateClasses && !$page.hasClass(CSS_CLASS_PAGE_VISIBLE)) {
                  $page.addClass(CSS_CLASS_PAGE_VISIBLE);
                }
                state.visiblePages.push(i + 1);
              }
              if (i >= fullyVisibleRange.min && i <= fullyVisibleRange.max) {
                state.fullyVisiblePages.push(i + 1);
              }
            }
          },
          updatePageStates: function(forceUpdatePaddings) {
            var state = this.state,
                pages = state.pages,
                rows = state.rows,
                scrollTop = this.$viewport.scrollTop(),
                scrollLeft = this.$viewport.scrollLeft(),
                rowIndex = 0,
                lastY1 = 0,
                rightmostPageIndex = 0,
                bottommostPageIndex = 0,
                i,
                len,
                page,
                pageEl,
                $pageEl;
            rows.length = state.sumWidths = state.sumHeights = state.totalWidth = state.totalHeight = 0;
            state.widestPage.totalActualWidth = state.tallestPage.totalActualHeight = 0;
            for (i = 0, len = this.$pages.length; i < len; ++i) {
              $pageEl = this.$pages.eq(i);
              pageEl = $pageEl[0];
              page = pages[i];
              if (!page || forceUpdatePaddings) {
                $pageEl.css('padding', '');
                page = {
                  index: i,
                  paddingLeft: parseFloat($pageEl.css(STYLE_PADDING_LEFT)),
                  paddingRight: parseFloat($pageEl.css(STYLE_PADDING_RIGHT)),
                  paddingTop: parseFloat($pageEl.css(STYLE_PADDING_TOP)),
                  paddingBottom: parseFloat($pageEl.css(STYLE_PADDING_BOTTOM))
                };
              }
              if (!page.actualWidth) {
                page.actualWidth = parseFloat(pageEl.getAttribute('data-width'));
              }
              if (!page.actualHeight) {
                page.actualHeight = parseFloat(pageEl.getAttribute('data-height'));
              }
              page.totalActualWidth = page.actualWidth + page.paddingLeft + page.paddingRight;
              page.totalActualHeight = page.actualHeight + page.paddingTop + page.paddingBottom;
              page.width = pageEl.offsetWidth;
              page.height = pageEl.offsetHeight;
              page.x0 = pageEl.offsetLeft;
              page.y0 = pageEl.offsetTop;
              page.x1 = page.width + page.x0;
              page.y1 = page.height + page.y0;
              if (lastY1 && getMaxY1InRow(pages, rows[rowIndex]) <= page.y0 + 2) {
                rowIndex++;
              }
              lastY1 = page.y1;
              if (!rows[rowIndex]) {
                rows[rowIndex] = [];
              }
              if (page.totalActualWidth > state.widestPage.totalActualWidth) {
                state.widestPage = page;
              }
              if (page.totalActualHeight > state.tallestPage.totalActualHeight) {
                state.tallestPage = page;
              }
              state.sumWidths += page.width;
              state.sumHeights += page.height;
              page.rowIndex = rowIndex;
              pages[i] = page;
              rows[rowIndex].push(i);
              if (pages[rightmostPageIndex].x0 + pages[rightmostPageIndex].width < page.x0 + page.width) {
                rightmostPageIndex = i;
              }
              if (pages[bottommostPageIndex].y0 + pages[bottommostPageIndex].height < page.y0 + page.height) {
                bottommostPageIndex = i;
              }
            }
            state.totalWidth = pages[rightmostPageIndex].x0 + pages[rightmostPageIndex].width;
            state.totalHeight = pages[bottommostPageIndex].y0 + pages[bottommostPageIndex].height;
            state.scrollTop = scrollTop;
            state.scrollLeft = scrollLeft;
            this.setCurrentPage(this.calculateCurrentPage());
          },
          updateCurrentPage: function() {
            var currentPage = this.calculateCurrentPage();
            this.setCurrentPage(currentPage);
          },
          handleResize: function(data) {
            var zoomMode = this.state.zoomState.zoomMode;
            this.state.viewportDimensions = data;
            this.updateZoomLevels();
            this.setZoom(zoomMode);
          },
          handleScrollEnd: function(data) {
            this.$doc.find('.' + CSS_CLASS_CURRENT_PAGE).removeClass(CSS_CLASS_CURRENT_PAGE);
            this.$pages.eq(this.state.currentPage - 1).addClass(CSS_CLASS_CURRENT_PAGE);
            this.updateVisiblePages(true);
            this.handleScroll(data);
          },
          updateScrollPosition: function(shouldNotCenter) {
            var state = this.state,
                zoomState = state.zoomState,
                ratio = zoomState.zoom / zoomState.prevZoom,
                newScrollLeft,
                newScrollTop;
            newScrollLeft = state.scrollLeft * ratio;
            newScrollTop = state.scrollTop * ratio;
            if (shouldNotCenter !== true) {
              newScrollTop += state.viewportDimensions.offsetHeight * (ratio - 1) / 2;
              newScrollLeft += state.viewportDimensions.offsetWidth * (ratio - 1) / 2;
            }
            this.scrollToOffset(newScrollLeft, newScrollTop);
          },
          updateLayout: function() {},
          calculateZoomAutoValue: function() {
            return 1;
          },
          calculateNextPage: function() {
            return 1;
          },
          calculatePreviousPage: function() {
            return 1;
          }
        });
      });
      Crocodoc.addComponent('layout-' + LAYOUT_PRESENTATION_TWO_PAGE, ['layout-' + LAYOUT_PRESENTATION], function(scope, presentation) {
        'use strict';
        var util = scope.getUtility('common');
        return presentation.extend({
          init: function() {
            this.twoPageMode = true;
            presentation.init.call(this);
          },
          calculateNextPage: function() {
            return this.state.currentPage + 2;
          },
          calculatePreviousPage: function() {
            return this.state.currentPage - 2;
          },
          calculateZoomValue: function(mode) {
            var baseVal = presentation.calculateZoomValue.call(this, mode);
            if (mode === ZOOM_FIT_WIDTH) {
              baseVal /= 2;
            }
            return baseVal;
          },
          scrollToPage: function(page) {
            presentation.scrollToPage.call(this, page - (page + 1) % 2);
          },
          calculateVisibleRange: function() {
            var min = this.state.currentPage - 1,
                max = min + 1;
            return util.constrainRange(min, max, this.numPages);
          },
          calculateFullyVisibleRange: function() {
            return this.calculateVisibleRange();
          }
        });
      });
      Crocodoc.addComponent('layout-' + LAYOUT_PRESENTATION, ['layout-paged'], function(scope, paged) {
        'use strict';
        var util = scope.getUtility('common');
        return paged.extend({
          init: function() {
            paged.init.call(this);
            this.updatePageMargins();
            this.updatePageClasses();
          },
          destroy: function() {
            paged.destroy.call(this);
            this.$pages.css({
              margin: '',
              left: ''
            }).removeClass(PRESENTATION_CSS_CLASSES);
          },
          calculateZoomAutoValue: function() {
            var fitWidth = this.calculateZoomValue(ZOOM_FIT_WIDTH),
                fitHeight = this.calculateZoomValue(ZOOM_FIT_HEIGHT);
            return Math.min(fitWidth, fitHeight);
          },
          calculateCurrentPage: function() {
            return this.state.currentPage;
          },
          calculateNextPage: function() {
            return this.state.currentPage + 1;
          },
          calculatePreviousPage: function() {
            return this.state.currentPage - 1;
          },
          calculateVisibleRange: function() {
            var index = this.state.currentPage - 1;
            return util.constrainRange(index, index, this.numPages);
          },
          calculateFullyVisibleRange: function() {
            return this.calculateVisibleRange();
          },
          setCurrentPage: function(page) {
            var index = util.clamp(page - 1, 0, this.numPages),
                $precedingPage,
                $currentPage;
            paged.setCurrentPage.call(this, page);
            this.$doc.find('.' + CSS_CLASS_PRECEDING_PAGE).removeClass(CSS_CLASS_PRECEDING_PAGE);
            $precedingPage = this.$doc.find('.' + CSS_CLASS_CURRENT_PAGE);
            $currentPage = this.$pages.eq(index);
            if ($precedingPage[0] !== $currentPage[0]) {
              $precedingPage.addClass(CSS_CLASS_PRECEDING_PAGE).removeClass(CSS_CLASS_CURRENT_PAGE);
              $currentPage.addClass(CSS_CLASS_CURRENT_PAGE);
            }
            this.updateVisiblePages(true);
            this.updatePageClasses(index);
          },
          scrollToPage: function(page) {
            this.setCurrentPage(page);
          },
          updateLayout: function() {
            var state = this.state,
                zoomState = state.zoomState,
                zoom = zoomState.zoom,
                page = this.currentPage || 1,
                currentPage = state.pages[page - 1],
                secondPage = this.twoPageMode ? state.pages[page] : currentPage,
                viewportWidth = state.viewportDimensions.clientWidth,
                viewportHeight = state.viewportDimensions.clientHeight,
                secondPageWidth,
                currentPageWidth,
                currentPageHeight,
                zoomedWidth,
                zoomedHeight,
                docWidth,
                docHeight;
            secondPageWidth = secondPage.actualWidth;
            currentPageWidth = currentPage.actualWidth + (this.twoPageMode ? secondPageWidth : 0);
            currentPageHeight = currentPage.actualHeight;
            zoomedWidth = Math.floor((currentPageWidth + currentPage.paddingLeft + secondPage.paddingRight) * zoom);
            zoomedHeight = Math.floor((currentPage.totalActualHeight) * zoom);
            docWidth = Math.max(zoomedWidth, viewportWidth);
            docHeight = Math.max(zoomedHeight, viewportHeight);
            this.$doc.css({
              width: docWidth,
              height: docHeight
            });
            this.updatePageMargins();
            if (docWidth > viewportWidth || docHeight > viewportHeight) {
              this.$el.addClass('crocodoc-scrollable');
            } else {
              this.$el.removeClass('crocodoc-scrollable');
            }
          },
          updatePageMargins: function() {
            var i,
                len,
                page,
                $page,
                width,
                height,
                left,
                top,
                paddingH,
                state = this.state,
                viewportWidth = state.viewportDimensions.clientWidth,
                viewportHeight = state.viewportDimensions.clientHeight;
            for (i = 0, len = this.$pages.length; i < len; ++i) {
              $page = this.$pages.eq(i);
              page = state.pages[i];
              if (this.twoPageMode) {
                paddingH = (i % 2 === 1) ? page.paddingRight : page.paddingLeft;
              } else {
                paddingH = page.paddingRight + page.paddingLeft;
              }
              width = (page.actualWidth + paddingH) * state.zoomState.zoom;
              height = (page.actualHeight + page.paddingTop + page.paddingBottom) * state.zoomState.zoom;
              if (this.twoPageMode) {
                left = Math.max(0, (viewportWidth - width * 2) / 2);
                if (i % 2 === 1) {
                  left += width;
                }
              } else {
                left = (viewportWidth - width) / 2;
              }
              top = (viewportHeight - height) / 2;
              left = Math.max(left, 0);
              top = Math.max(top, 0);
              $page.css({
                marginLeft: left,
                marginTop: top
              });
            }
          },
          updatePageClasses: function() {
            var $pages = this.$pages,
                index = this.state.currentPage - 1,
                next = index + 1,
                prev = index - 1,
                buffer = 20;
            $pages.removeClass(PRESENTATION_CSS_CLASSES);
            if (this.twoPageMode) {
              next = index + 2;
              prev = index - 2;
              $pages.slice(Math.max(prev, 0), index).addClass(CSS_CLASS_PAGE_PREV);
              $pages.slice(next, next + 2).addClass(CSS_CLASS_PAGE_NEXT);
            } else {
              if (prev >= 0) {
                $pages.eq(prev).addClass(CSS_CLASS_PAGE_PREV);
              }
              if (next < this.numPages) {
                $pages.eq(next).addClass(CSS_CLASS_PAGE_NEXT);
              }
            }
            $pages.slice(0, index).addClass(CSS_CLASS_PAGE_BEFORE);
            $pages.slice(Math.max(0, index - buffer), index).addClass(CSS_CLASS_PAGE_BEFORE_BUFFER);
            $pages.slice(next).addClass(CSS_CLASS_PAGE_AFTER);
            $pages.slice(next, Math.min(this.numPages, next + buffer)).addClass(CSS_CLASS_PAGE_AFTER_BUFFER);
          }
        });
      });
      Crocodoc.addComponent('layout-' + LAYOUT_TEXT, ['layout-base'], function(scope, base) {
        'use strict';
        var util = scope.getUtility('common');
        return base.extend({
          init: function() {
            base.init.call(this);
            this.zoomLevels = this.config.zoomLevels.slice();
            this.minZoom = this.zoomLevels[0];
            this.maxZoom = this.zoomLevels[this.zoomLevels.length - 1];
          },
          setZoom: function(val) {
            var z,
                zoomState = this.state.zoomState,
                currentZoom = zoomState.zoom;
            if (typeof val === 'string') {
              z = this.calculateNextZoomLevel(val);
              if (!z) {
                if (val === 'auto' || val === 'fitwidth' || val === 'fitheight') {
                  z = 1;
                } else {
                  z = currentZoom;
                }
              }
            } else {
              z = parseFloat(val) || currentZoom;
            }
            z = util.clamp(z, this.minZoom, this.maxZoom);
            this.config.$doc.css('font-size', (z * 10) + 'pt');
            zoomState.prevZoom = currentZoom;
            zoomState.zoom = z;
            zoomState.canZoomIn = this.calculateNextZoomLevel(Crocodoc.ZOOM_IN) !== false;
            zoomState.canZoomOut = this.calculateNextZoomLevel(Crocodoc.ZOOM_OUT) !== false;
            scope.broadcast('zoom', util.extend({isDraggable: this.isDraggable()}, zoomState));
          }
        });
      });
      Crocodoc.addComponent('layout-' + LAYOUT_VERTICAL_SINGLE_COLUMN, ['layout-' + LAYOUT_VERTICAL], function(scope, vertical) {
        'use strict';
        return vertical;
      });
      Crocodoc.addComponent('layout-' + LAYOUT_VERTICAL, ['layout-paged'], function(scope, paged) {
        'use strict';
        var util = scope.getUtility('common'),
            browser = scope.getUtility('browser');
        return paged.extend({
          calculateZoomAutoValue: function() {
            var state = this.state,
                fitWidth = this.calculateZoomValue(ZOOM_FIT_WIDTH),
                fitHeight = this.calculateZoomValue(ZOOM_FIT_HEIGHT);
            if (state.widestPage.actualWidth > state.tallestPage.actualHeight) {
              return Math.min(1, fitWidth, fitHeight);
            } else {
              if (browser.mobile) {
                return fitWidth;
              }
              return Math.min(1, fitWidth);
            }
          },
          calculateCurrentPage: function() {
            var prevPageIndex,
                currentPageIndex,
                rowIndex,
                row,
                offset,
                state = this.state,
                pages = state.pages;
            prevPageIndex = util.bisectRight(pages, state.scrollTop, 'y0') - 1;
            if (prevPageIndex < 0) {
              return 1;
            }
            offset = state.scrollTop + pages[prevPageIndex].height / 2;
            currentPageIndex = util.bisectRight(pages, offset, 'y0') - 1;
            rowIndex = pages[currentPageIndex].rowIndex;
            row = state.rows[rowIndex];
            return 1 + row[0];
          },
          calculateNextPage: function() {
            var state = this.state,
                currentPage = state.pages[state.currentPage - 1],
                rowIndex = currentPage.rowIndex,
                nextRow = state.rows[rowIndex + 1];
            return nextRow && nextRow[0] + 1 || state.currentPage;
          },
          calculatePreviousPage: function() {
            var state = this.state,
                currentPage = state.pages[state.currentPage - 1],
                rowIndex = currentPage.rowIndex,
                prevRow = state.rows[rowIndex - 1];
            return prevRow && prevRow[0] + 1 || state.currentPage;
          },
          handleResize: function(data) {
            paged.handleResize.call(this, data);
            this.updateCurrentPage();
          },
          handleScroll: function(data) {
            paged.handleScroll.call(this, data);
            this.updateCurrentPage();
          },
          updateLayout: function() {
            var state = this.state,
                zoom = state.zoomState.zoom,
                zoomedWidth,
                docWidth;
            zoomedWidth = Math.floor(state.widestPage.totalActualWidth * zoom);
            if (zoomedWidth <= state.viewportDimensions.clientWidth) {
              docWidth = 'auto';
            } else {
              docWidth = zoomedWidth;
            }
            this.$doc.css({width: docWidth});
          }
        });
      });
      Crocodoc.addComponent('lazy-loader', function(scope) {
        'use strict';
        var util = scope.getUtility('common'),
            browser = scope.getUtility('browser'),
            api = {},
            pages,
            numPages,
            pagefocusTriggerLoadingTID,
            readyTriggerLoadingTID,
            pageLoadTID,
            pageLoadQueue = [],
            pageLoadRange = 1,
            pageLoadingStopped = true,
            scrollDirection = 1,
            ready = false,
            layoutState = {
              page: 1,
              visiblePages: [1]
            };
        function calculateRange(range) {
          range = range || pageLoadRange;
          var currentIndex = layoutState.page - 1,
              low = currentIndex - range,
              high = currentIndex + range;
          return util.constrainRange(low, high, numPages - 1);
        }
        function pageLoadLoop() {
          var index;
          clearTimeout(pageLoadTID);
          if (pageLoadQueue.length > 0) {
            index = pageLoadQueue.shift();
            if (pages[index]) {
              api.loadPage(index, function loadPageCallback(pageIsLoading) {
                if (pageIsLoading === false) {
                  pageLoadLoop();
                } else {
                  pageLoadTID = setTimeout(pageLoadLoop, PAGE_LOAD_INTERVAL);
                }
              });
            } else {
              pageLoadLoop();
            }
          } else {
            stopPageLoadLoop();
          }
        }
        function startPageLoadLoop() {
          clearTimeout(pageLoadTID);
          pageLoadingStopped = false;
          pageLoadTID = setTimeout(pageLoadLoop, PAGE_LOAD_INTERVAL);
        }
        function stopPageLoadLoop() {
          clearTimeout(pageLoadTID);
          pageLoadingStopped = true;
        }
        function pushPageLoadQueue(index) {
          pageLoadQueue.push(index);
          if (pageLoadingStopped) {
            startPageLoadLoop();
          }
        }
        function clearPageLoadQueue() {
          pageLoadQueue.length = 0;
          stopPageLoadLoop();
        }
        function indexInRange(index, rangeLength) {
          var range = calculateRange(rangeLength);
          if (index >= range.min && index <= range.max) {
            return true;
          }
          return false;
        }
        function shouldLoadPage(index) {
          var page = pages[index];
          if (page) {
            if (indexInRange(index)) {
              return true;
            }
            if (pageIsVisible(index)) {
              return true;
            }
          }
          return false;
        }
        function shouldUnloadPage(index, rangeLength) {
          if (indexInRange(index, rangeLength)) {
            return false;
          }
          if (pageIsVisible(index)) {
            return false;
          }
          return true;
        }
        function pageIsVisible(index) {
          return util.inArray(index + 1, layoutState.visiblePages) > -1;
        }
        function queuePagesToLoadInOrder(start, end) {
          var increment = util.sign(end - start);
          while (start !== end) {
            api.queuePageToLoad(start);
            start += increment;
          }
          api.queuePageToLoad(start);
        }
        return util.extend(api, {
          messages: ['beforezoom', 'pageavailable', 'pagefocus', 'ready', 'scroll', 'scrollend', 'zoom'],
          onmessage: function(name, data) {
            switch (name) {
              case 'beforezoom':
                this.handleBeforeZoom(data);
                break;
              case 'pageavailable':
                this.handlePageAvailable(data);
                break;
              case 'pagefocus':
                this.handlePageFocus(data);
                break;
              case 'ready':
                this.handleReady();
                break;
              case 'scroll':
                this.handleScroll();
                break;
              case 'scrollend':
                this.handleScrollEnd();
                break;
              case 'zoom':
                this.handleZoom(data);
                break;
            }
          },
          init: function(pageComponents) {
            pages = pageComponents;
            numPages = pages.length;
            pageLoadRange = (browser.mobile || browser.ielt10) ? MAX_PAGE_LOAD_RANGE_MOBILE : MAX_PAGE_LOAD_RANGE;
            pageLoadRange = Math.min(pageLoadRange, numPages);
          },
          destroy: function() {
            this.cancelAllLoading();
          },
          updateLayoutState: function(state) {
            scrollDirection = util.sign(state.page - layoutState.page);
            layoutState = state;
          },
          loadNecessaryPages: util.debounce(100, function() {
            this.cancelAllLoading();
            this.queuePageToLoad(layoutState.page - 1);
            this.loadVisiblePages();
            this.loadPagesInRange(pageLoadRange);
          }),
          loadPagesInRange: function(range) {
            var currentIndex = layoutState.page - 1;
            if (range > 0) {
              range = calculateRange(range);
              if (scrollDirection >= 0) {
                queuePagesToLoadInOrder(currentIndex + 1, range.max);
                queuePagesToLoadInOrder(currentIndex - 1, range.min);
              } else {
                queuePagesToLoadInOrder(currentIndex - 1, range.min);
                queuePagesToLoadInOrder(currentIndex + 1, range.max);
              }
            }
          },
          loadVisiblePages: function() {
            var i,
                len;
            for (i = 0, len = layoutState.visiblePages.length; i < len; ++i) {
              this.queuePageToLoad(layoutState.visiblePages[i] - 1);
            }
          },
          queuePageToLoad: function(index) {
            if (shouldLoadPage(index)) {
              pages[index].preload();
              pushPageLoadQueue(index);
            }
          },
          cancelAllLoading: function() {
            clearTimeout(readyTriggerLoadingTID);
            clearTimeout(pagefocusTriggerLoadingTID);
            clearPageLoadQueue();
          },
          loadPage: function(index, callback) {
            $.when(pages[index] && pages[index].load()).always(callback);
          },
          unloadPage: function(index) {
            var page = pages[index];
            if (page) {
              page.unload();
            }
          },
          unloadUnnecessaryPages: function(rangeLength) {
            var i,
                l;
            for (i = 0, l = pages.length; i < l; ++i) {
              if (shouldUnloadPage(i, rangeLength)) {
                this.unloadPage(i);
              }
            }
          },
          handleReady: function() {
            ready = true;
            this.loadVisiblePages();
            readyTriggerLoadingTID = setTimeout(function() {
              api.loadNecessaryPages();
            }, READY_TRIGGER_PRELOADING_DELAY);
          },
          handlePageAvailable: function(data) {
            if (!ready) {
              return;
            }
            var i;
            if (data.all === true) {
              data.upto = numPages;
            }
            if (data.page) {
              this.queuePageToLoad(data.page - 1);
            } else if (data.upto) {
              for (i = 0; i < data.upto; ++i) {
                this.queuePageToLoad(i);
              }
            }
          },
          handlePageFocus: function(data) {
            this.updateLayoutState(data);
            if (!ready) {
              return;
            }
            this.cancelAllLoading();
            pagefocusTriggerLoadingTID = setTimeout(function() {
              api.loadNecessaryPages();
            }, 200);
          },
          handleBeforeZoom: function(data) {
            if (!ready) {
              return;
            }
            this.cancelAllLoading();
            this.unloadUnnecessaryPages(data.visiblePages.length * 2);
          },
          handleZoom: function(data) {
            this.updateLayoutState(data);
            if (!ready) {
              return;
            }
            this.loadNecessaryPages();
          },
          handleScroll: function() {
            this.cancelAllLoading();
          },
          handleScrollEnd: function() {
            if (!ready) {
              return;
            }
            this.loadNecessaryPages();
            this.unloadUnnecessaryPages(pageLoadRange);
          }
        });
      });
      Crocodoc.addComponent('page-img', function(scope) {
        'use strict';
        var browser = scope.getUtility('browser');
        var $img,
            $el,
            $loadImgPromise,
            page,
            imageLoaded = false,
            removeOnUnload = browser.mobile;
        return {
          init: function(el, pageNum) {
            $el = $(el);
            page = pageNum;
          },
          destroy: function() {
            removeOnUnload = true;
            this.unload();
            $el.empty();
          },
          prepare: function() {},
          preload: function() {
            if (!$loadImgPromise) {
              $loadImgPromise = scope.get('page-img', page);
            }
          },
          load: function() {
            this.preload();
            $loadImgPromise.done(function loadImgSuccess(img) {
              if (!imageLoaded) {
                imageLoaded = true;
                $img = $(img).appendTo($el);
              }
            });
            $loadImgPromise.fail(function loadImgFail(error) {
              imageLoaded = false;
              if (error) {
                scope.broadcast('asseterror', error);
              }
            });
            return $loadImgPromise;
          },
          unload: function() {
            if ($loadImgPromise) {
              $loadImgPromise.abort();
              $loadImgPromise = null;
            }
            if (removeOnUnload) {
              if ($img) {
                $img.remove();
                $img = null;
              }
              imageLoaded = false;
            }
          }
        };
      });
      Crocodoc.addComponent('page-links', function(scope) {
        'use strict';
        var $el,
            browser = scope.getUtility('browser');
        function createLink(link) {
          var $link = $('<a>').addClass(CSS_CLASS_PAGE_LINK),
              left = link.bbox[0],
              top = link.bbox[1],
              attr = {};
          if (browser.ie) {
            $('<span>').appendTo($link).on('click', handleClick);
          }
          $link.css({
            left: left + 'pt',
            top: top + 'pt',
            width: link.bbox[2] - left + 'pt',
            height: link.bbox[3] - top + 'pt'
          });
          if (link.uri) {
            if (/^http|^mailto/.test(link.uri)) {
              attr.href = encodeURI(link.uri);
              attr.target = '_blank';
            } else {
              return;
            }
          } else if (link.destination) {
            attr.href = '#page-' + link.destination.pagenum;
          }
          $link.attr(attr);
          $link.data('link', link);
          $link.appendTo($el);
        }
        function handleClick(event) {
          var targetEl = browser.ie ? event.target.parentNode : event.target,
              $link = $(targetEl),
              data = $link.data('link');
          if (data) {
            scope.broadcast('linkclick', data);
          }
          event.preventDefault();
        }
        return {
          init: function(el, links) {
            $el = $(el);
            this.createLinks(links);
            if (!browser.ie) {
              $el.on('click', '.' + CSS_CLASS_PAGE_LINK, handleClick);
            }
          },
          destroy: function() {
            $el.empty().off('click');
            $el = browser = null;
          },
          createLinks: function(links) {
            var i,
                len;
            for (i = 0, len = links.length; i < len; ++i) {
              createLink(links[i]);
            }
          }
        };
      });
      Crocodoc.addComponent('page-svg', function(scope) {
        'use strict';
        var browser = scope.getUtility('browser'),
            DOMParser = window.DOMParser;
        var $svg,
            $svgLayer,
            $loadSVGPromise,
            page,
            destroyed = false,
            unloaded = false,
            svgLoaded = false,
            viewerConfig = scope.getConfig(),
            removeOnUnload = browser.mobile || browser.ielt10,
            embedStrategy = browser.ielt11 || browser.firefox ? EMBED_STRATEGY_DATA_URL_IMG : EMBED_STRATEGY_IFRAME_INNERHTML;
        function createSVGEl() {
          switch (embedStrategy) {
            case EMBED_STRATEGY_IFRAME_INNERHTML:
            case EMBED_STRATEGY_IFRAME_PROXY:
              return $('<iframe>');
            case EMBED_STRATEGY_DATA_URL_PROXY:
            case EMBED_STRATEGY_DATA_URL:
              return $('<object>').attr({
                type: SVG_MIME_TYPE,
                data: 'data:' + SVG_MIME_TYPE + ';base64,' + window.btoa(SVG_CONTAINER_TEMPLATE)
              });
            case EMBED_STRATEGY_INLINE_SVG:
              return $('<div>');
            case EMBED_STRATEGY_BASIC_OBJECT:
              return $('<object>');
            case EMBED_STRATEGY_BASIC_IMG:
            case EMBED_STRATEGY_DATA_URL_IMG:
              return $('<img>');
          }
        }
        function prepareSVGContainer() {
          if (!$svg || $svg.length === 0) {
            svgLoaded = false;
            $svg = createSVGEl();
          }
          if ($svg.parent().length === 0) {
            $svg.appendTo($svgLayer);
          }
        }
        function loadSVGText() {
          if (svgLoaded || embedStrategy === EMBED_STRATEGY_BASIC_OBJECT || embedStrategy === EMBED_STRATEGY_BASIC_IMG) {
            return $.Deferred().resolve().promise({abort: function() {}});
          } else {
            return scope.get('page-svg', page);
          }
        }
        function fixUseElements(contentDocument) {
          var useEls = contentDocument.querySelectorAll('use');
          [].forEach.call(useEls, function(use) {
            var id = use.getAttribute('xlink:href'),
                image = contentDocument.querySelector(id).cloneNode(),
                parent = use.parentNode;
            image.removeAttribute('id');
            image.setAttribute('transform', use.getAttribute('transform'));
            parent.replaceChild(image, use);
          });
        }
        function embedSVG(svgText) {
          var domParser,
              svgDoc,
              svgEl,
              html,
              dataURLPrefix,
              contentDocument = $svg[0].contentDocument,
              contentWindow = $svg[0].contentWindow || contentDocument && contentDocument.defaultView;
          switch (embedStrategy) {
            case EMBED_STRATEGY_IFRAME_INNERHTML:
              if (browser.ielt10) {
                svgText = svgText.replace(/<xhtml:link.*/, '');
              }
              html = HTML_TEMPLATE + svgText;
              if (browser.ielt10) {
                contentDocument.body.innerHTML = html;
              } else {
                contentDocument.documentElement.innerHTML = html;
                if ((browser.ios || browser.safari) && browser.version < 7) {
                  fixUseElements(contentDocument);
                }
              }
              svgEl = contentDocument.getElementsByTagName('svg')[0];
              break;
            case EMBED_STRATEGY_IFRAME_PROXY:
              contentDocument.documentElement.innerHTML = HTML_TEMPLATE;
              var head = contentDocument.getElementsByTagName('head')[0] || contentDocument.documentElement,
                  script = contentDocument.createElement('script'),
                  data = '(' + proxySVG + ')()';
              script.type = 'text/javascript';
              try {
                script.appendChild(document.createTextNode(data));
              } catch (e) {
                script.text = data;
              }
              head.insertBefore(script, head.firstChild);
              if (contentDocument.readyState === 'complete') {
                contentWindow.loadSVG(svgText);
              } else {
                contentWindow.onload = function() {
                  this.loadSVG(svgText);
                };
              }
              return;
            case EMBED_STRATEGY_DATA_URL:
              domParser = new DOMParser();
              svgDoc = domParser.parseFromString(svgText, SVG_MIME_TYPE);
              svgEl = contentDocument.importNode(svgDoc.documentElement, true);
              contentDocument.documentElement.appendChild(svgEl);
              break;
            case EMBED_STRATEGY_DATA_URL_PROXY:
              contentWindow.loadSVG(svgText);
              svgEl = contentDocument.querySelector('svg');
              break;
            case EMBED_STRATEGY_INLINE_SVG:
              domParser = new DOMParser();
              svgDoc = domParser.parseFromString(svgText, SVG_MIME_TYPE);
              svgEl = document.importNode(svgDoc.documentElement, true);
              $svg.append(svgEl);
              break;
            case EMBED_STRATEGY_BASIC_OBJECT:
              $svg.attr({
                type: SVG_MIME_TYPE,
                data: scope.getDataProvider('page-svg').getURL(page)
              });
              svgEl = $svg[0];
              break;
            case EMBED_STRATEGY_BASIC_IMG:
              svgEl = $svg[0];
              svgEl.src = scope.getDataProvider('page-svg').getURL(page);
              break;
            case EMBED_STRATEGY_DATA_URL_IMG:
              svgEl = $svg[0];
              dataURLPrefix = 'data:' + SVG_MIME_TYPE;
              if (!browser.ie && window.btoa) {
                svgEl.src = dataURLPrefix + ';base64,' + window.btoa(svgText);
              } else {
                svgEl.src = dataURLPrefix + ',' + encodeURIComponent(svgText);
              }
              break;
          }
          svgEl.setAttribute('width', '100%');
          svgEl.setAttribute('height', '100%');
        }
        function loadSVGSuccess(text) {
          if (!destroyed && !unloaded) {
            if (!svgLoaded && text) {
              embedSVG(text);
              svgLoaded = true;
              if (!removeOnUnload) {
                $loadSVGPromise.abort();
                $loadSVGPromise = null;
              }
            }
            if ($svg.parent().length === 0) {
              $svg.appendTo($svgLayer);
            }
          }
        }
        function loadSVGFail(error) {
          scope.broadcast('asseterror', error);
          svgLoaded = false;
          if ($loadSVGPromise) {
            $loadSVGPromise.abort();
          }
        }
        return {
          init: function($el, pageNum) {
            $svgLayer = $el;
            page = pageNum;
            embedStrategy = viewerConfig.embedStrategy || embedStrategy;
          },
          destroy: function() {
            destroyed = true;
            removeOnUnload = true;
            this.unload();
            $svgLayer.empty();
          },
          prepare: function() {
            prepareSVGContainer();
          },
          preload: function() {
            this.prepare();
            if (!$loadSVGPromise) {
              $loadSVGPromise = loadSVGText();
            }
          },
          load: function() {
            unloaded = false;
            this.preload();
            $loadSVGPromise.done(loadSVGSuccess).fail(loadSVGFail);
            return $loadSVGPromise;
          },
          unload: function() {
            unloaded = true;
            if ($loadSVGPromise && $loadSVGPromise.state() !== 'resolved') {
              $loadSVGPromise.abort();
              $loadSVGPromise = null;
            }
            if (removeOnUnload) {
              if ($svg) {
                $svg.remove();
                $svg = null;
              }
              svgLoaded = false;
            }
          }
        };
      });
      Crocodoc.addComponent('page-text', function(scope) {
        'use strict';
        var browser = scope.getUtility('browser'),
            subpx = scope.getUtility('subpx');
        var destroyed = false,
            loaded = false,
            $textLayer,
            $loadTextPromise,
            page,
            viewerConfig = scope.getConfig();
        function shouldUseTextLayer() {
          return viewerConfig.enableTextSelection && !browser.ielt9;
        }
        function loadTextLayerHTMLSuccess(text) {
          var doc,
              textEl;
          if (!text || loaded || destroyed) {
            return;
          }
          loaded = true;
          doc = document.implementation.createHTMLDocument('');
          doc.getElementsByTagName('body')[0].innerHTML = text;
          text = null;
          textEl = document.importNode(doc.querySelector('.' + CSS_CLASS_PAGE_TEXT), true);
          $textLayer.attr('class', textEl.getAttribute('class'));
          $textLayer.html(textEl.innerHTML);
          subpx.fix($textLayer);
        }
        function loadTextLayerHTMLFail(error) {
          if (error) {
            scope.broadcast('asseterror', error);
          }
        }
        function loadTextLayerHTML() {
          if (!$loadTextPromise) {
            if (shouldUseTextLayer()) {
              $loadTextPromise = scope.get('page-text', page);
            } else {
              $loadTextPromise = $.Deferred().resolve().promise({abort: function() {}});
            }
          }
          return $loadTextPromise;
        }
        return {
          init: function($el, pageNum) {
            $textLayer = $el;
            page = pageNum;
          },
          destroy: function() {
            destroyed = true;
            this.unload();
            $textLayer.empty();
          },
          preload: function() {
            loadTextLayerHTML();
          },
          load: function() {
            return loadTextLayerHTML().done(loadTextLayerHTMLSuccess).fail(loadTextLayerHTMLFail);
          },
          unload: function() {
            if ($loadTextPromise && $loadTextPromise.state() !== 'resolved') {
              $loadTextPromise.abort();
              $loadTextPromise = null;
            }
          },
          enable: function() {
            $textLayer.css('display', '');
            if ($loadTextPromise && !loaded) {
              $loadTextPromise = null;
            }
          },
          disable: function() {
            $textLayer.css('display', 'none');
          }
        };
      });
      Crocodoc.addComponent('page', function(scope) {
        'use strict';
        var support = scope.getUtility('support'),
            util = scope.getUtility('common');
        var $el,
            pageText,
            pageContent,
            pageLinks,
            pageNum,
            index,
            isVisible,
            status,
            loadRequested = false;
        return {
          messages: ['pageavailable', 'pagefocus', 'textenabledchange', 'zoom'],
          onmessage: function(name, data) {
            switch (name) {
              case 'pageavailable':
                if (data.page === index + 1 || data.upto > index || data.all === true) {
                  if (status === PAGE_STATUS_CONVERTING) {
                    status = PAGE_STATUS_NOT_LOADED;
                  }
                }
                break;
              case 'textenabledchange':
                if (data.enabled === true) {
                  this.enableTextSelection();
                } else {
                  this.disableTextSelection();
                }
                break;
              case 'pagefocus':
              case 'zoom':
                isVisible = pageNum === data.page || (util.inArray(pageNum, data.visiblePages) > -1);
                break;
            }
          },
          init: function($pageEl, config) {
            var $text,
                $svg,
                $links;
            $el = $pageEl;
            $svg = $pageEl.find('.' + CSS_CLASS_PAGE_SVG);
            $text = $pageEl.find('.' + CSS_CLASS_PAGE_TEXT);
            $links = $pageEl.find('.' + CSS_CLASS_PAGE_LINKS);
            status = config.status || PAGE_STATUS_NOT_LOADED;
            index = config.index;
            pageNum = index + 1;
            this.config = config;
            config.url = config.url || '';
            pageText = scope.createComponent('page-text');
            if (config.useSVG === undefined) {
              config.useSVG = true;
            }
            pageContent = support.svg && config.useSVG ? scope.createComponent('page-svg') : scope.createComponent('page-img');
            pageText.init($text, pageNum);
            pageContent.init($svg, pageNum);
            if (config.enableLinks && config.links.length) {
              pageLinks = scope.createComponent('page-links');
              pageLinks.init($links, config.links);
            }
          },
          destroy: function() {
            this.unload();
          },
          preload: function() {
            pageContent.prepare();
            if (status === PAGE_STATUS_NOT_LOADED) {
              pageContent.preload();
              pageText.preload();
            }
          },
          load: function() {
            var pageComponent = this;
            loadRequested = true;
            if (status === PAGE_STATUS_ERROR) {
              return false;
            }
            if (status === PAGE_STATUS_CONVERTING) {
              return false;
            }
            if (status !== PAGE_STATUS_LOADED) {
              status = PAGE_STATUS_LOADING;
            }
            return $.when(pageContent.load(), pageText.load()).done(function handleLoadDone() {
              if (loadRequested) {
                if (status !== PAGE_STATUS_LOADED) {
                  $el.removeClass(CSS_CLASS_PAGE_LOADING);
                  status = PAGE_STATUS_LOADED;
                  scope.broadcast('pageload', {page: pageNum});
                }
              } else {
                pageComponent.unload();
              }
            }).fail(function handleLoadFail(error) {
              status = PAGE_STATUS_ERROR;
              $el.addClass(CSS_CLASS_PAGE_ERROR);
              scope.broadcast('pagefail', {
                page: index + 1,
                error: error
              });
            });
          },
          unload: function() {
            loadRequested = false;
            pageContent.unload();
            pageText.unload();
            if (status === PAGE_STATUS_LOADED) {
              status = PAGE_STATUS_NOT_LOADED;
              $el.addClass(CSS_CLASS_PAGE_LOADING);
              $el.removeClass(CSS_CLASS_PAGE_ERROR);
              scope.broadcast('pageunload', {page: pageNum});
            }
          },
          enableTextSelection: function() {
            pageText.enable();
            if (isVisible) {
              pageText.load();
            }
          },
          disableTextSelection: function() {
            pageText.disable();
          }
        };
      });
      Crocodoc.addComponent('resizer', function(scope) {
        'use strict';
        var util = scope.getUtility('common');
        var FULLSCREENCHANGE_EVENT = ['', ' webkit', ' moz', ' '].join('fullscreenchange') + 'MSFullscreenChange';
        var $window = $(window),
            $document = $(document),
            element,
            frameWidth = 0,
            currentClientWidth,
            currentClientHeight,
            currentOffsetWidth,
            currentOffsetHeight,
            inIframe = (function() {
              try {
                return window.self !== window.top;
              } catch (e) {
                return true;
              }
            })();
        function broadcast() {
          scope.broadcast('resize', {
            width: currentOffsetWidth,
            height: currentOffsetHeight,
            clientWidth: currentClientWidth,
            clientHeight: currentClientHeight,
            offsetWidth: currentOffsetWidth,
            offsetHeight: currentOffsetHeight
          });
        }
        function fixElementPosition() {
          var style = util.getComputedStyle(element);
          if (style && style.position === 'static') {
            $(element).css({position: 'relative'});
          }
        }
        function initResizer() {
          var $iframe = $('<iframe frameborder="0">'),
              $div = $('<div>');
          $iframe.add($div).css({
            opacity: 0,
            visiblility: 'hidden',
            position: 'absolute',
            width: '100%',
            height: '100%',
            top: 0,
            left: 0,
            border: 0
          });
          $iframe.prependTo($div.prependTo(element));
          fixElementPosition();
          $window = $($iframe[0].contentWindow);
          $window.on('resize', checkResize);
        }
        function checkResize() {
          var newOffsetHeight = element.offsetHeight,
              newOffsetWidth = element.offsetWidth;
          if (inIframe) {
            if (frameWidth === 0 && window.innerWidth !== 0) {
              frameWidth = window.innerWidth;
              fixElementPosition();
              scope.broadcast('layoutchange');
              return;
            }
          }
          if (newOffsetHeight) {
            if (newOffsetHeight !== currentOffsetHeight || newOffsetWidth !== currentOffsetWidth) {
              currentOffsetHeight = newOffsetHeight;
              currentOffsetWidth = newOffsetWidth;
              currentClientHeight = element.clientHeight;
              currentClientWidth = element.clientWidth;
              broadcast();
            }
          }
        }
        return {
          messages: ['layoutchange'],
          onmessage: function() {
            currentOffsetHeight = null;
            checkResize();
          },
          init: function(el) {
            element = $(el).get(0);
            if (element === window) {
              element = document.documentElement;
              $window.on('resize', checkResize);
            } else {
              initResizer();
            }
            $document.on(FULLSCREENCHANGE_EVENT, checkResize);
            checkResize();
          },
          destroy: function() {
            $document.off(FULLSCREENCHANGE_EVENT, checkResize);
            $window.off('resize', checkResize);
          }
        };
      });
      Crocodoc.addComponent('scroller', function(scope) {
        'use strict';
        var util = scope.getUtility('common'),
            browser = scope.getUtility('browser');
        var GHOST_SCROLL_TIMEOUT = 3000,
            GHOST_SCROLL_INTERVAL = 30,
            SCROLL_EVENT_THROTTLE_INTERVAL = 200,
            SCROLL_END_TIMEOUT = browser.mobile ? 500 : 250;
        var $el,
            scrollendTID,
            scrollingStarted = false,
            touchStarted = false,
            touchEnded = false,
            touchMoved = false,
            touchEndTime = 0,
            ghostScrollStart = null;
        function buildEventData() {
          return {
            scrollTop: $el.scrollTop(),
            scrollLeft: $el.scrollLeft()
          };
        }
        var fireScroll = util.throttle(SCROLL_EVENT_THROTTLE_INTERVAL, function() {
          scope.broadcast('scroll', buildEventData());
        });
        function handleScrollEnd() {
          scrollingStarted = false;
          ghostScrollStart = null;
          clearTimeout(scrollendTID);
          scope.broadcast('scrollend', buildEventData());
        }
        function handleScroll() {
          if (!scrollingStarted) {
            scrollingStarted = true;
            scope.broadcast('scrollstart', buildEventData());
          }
          clearTimeout(scrollendTID);
          scrollendTID = setTimeout(handleScrollEnd, SCROLL_END_TIMEOUT);
          fireScroll();
        }
        function handleTouchstart() {
          touchStarted = true;
          touchEnded = false;
          touchMoved = false;
          handleScroll();
        }
        function handleTouchmove() {
          touchMoved = true;
          handleScroll();
        }
        function handleTouchend() {
          touchStarted = false;
          touchEnded = true;
          touchEndTime = new Date().getTime();
          if (touchMoved) {
            ghostScroll();
          }
        }
        function ghostScroll() {
          clearTimeout(scrollendTID);
          if (ghostScrollStart === null) {
            ghostScrollStart = new Date().getTime();
          }
          if (new Date().getTime() - ghostScrollStart > GHOST_SCROLL_TIMEOUT) {
            handleScrollEnd();
            return;
          }
          fireScroll();
          scrollendTID = setTimeout(ghostScroll, GHOST_SCROLL_INTERVAL);
        }
        return {
          init: function(el) {
            $el = $(el);
            $el.on('scroll', handleScroll);
            $el.on('touchstart', handleTouchstart);
            $el.on('touchmove', handleTouchmove);
            $el.on('touchend', handleTouchend);
          },
          destroy: function() {
            clearTimeout(scrollendTID);
            $el.off('scroll', handleScroll);
            $el.off('touchstart', handleTouchstart);
            $el.off('touchmove', handleTouchmove);
            $el.off('touchend', handleTouchend);
          }
        };
      });
      Crocodoc.addComponent('viewer-base', function(scope) {
        'use strict';
        var util = scope.getUtility('common'),
            browser = scope.getUtility('browser'),
            support = scope.getUtility('support');
        var api,
            config,
            $el,
            stylesheetEl,
            layout,
            scroller,
            resizer,
            dragger,
            $assetsPromise;
        function setCSSFlags() {
          $el.attr(ATTR_SVG_VERSION, config.metadata.version || '0.0.0');
          if (browser.mobile) {
            $el.addClass(CSS_CLASS_MOBILE);
          }
          if (browser.ielt9) {
            $el.addClass(CSS_CLASS_IELT9);
          }
          if (support.svg && config.useSVG) {
            $el.addClass(CSS_CLASS_SUPPORTS_SVG);
          }
        }
        function initViewerHTML() {
          $el.html(Crocodoc.viewerTemplate);
          if (config.useWindowAsViewport) {
            config.$viewport = $(window);
            $el.addClass(CSS_CLASS_WINDOW_AS_VIEWPORT);
          } else {
            config.$viewport = $el.find('.' + CSS_CLASS_VIEWPORT);
          }
          config.$doc = $el.find('.' + CSS_CLASS_DOC);
        }
        function initPlugins() {
          var name,
              plugin,
              plugins = config.plugins || {};
          for (name in plugins) {
            plugin = scope.createComponent('plugin-' + name);
            if (plugin && util.isFn(plugin.init)) {
              plugin.init(config.plugins[name]);
            }
          }
        }
        function completeInit() {
          setCSSFlags();
          scroller = scope.createComponent('scroller');
          scroller.init(config.$viewport);
          resizer = scope.createComponent('resizer');
          resizer.init(config.$viewport);
          var controller;
          switch (config.metadata.type) {
            case 'text':
              controller = scope.createComponent('controller-text');
              config.layout = LAYOUT_TEXT;
              break;
            case 'paged':
            default:
              controller = scope.createComponent('controller-paged');
              break;
          }
          controller.init();
          if (config.metadata.type === 'text') {
            if (!config.enableTextSelection) {
              api.disableTextSelection();
            }
          } else if (browser.ielt9) {
            api.disableTextSelection();
          }
          if (!config.enableLinks || browser.ielt9) {
            api.disableLinks();
          }
          api.setLayout(config.layout);
          scope.broadcast('ready', {
            page: config.page || 1,
            numPages: config.numPages
          });
          scope.ready();
        }
        function handleLinkClick(data) {
          var event = api.fire('linkclick', data);
          if (!event.isDefaultPrevented()) {
            if (data.uri) {
              window.open(data.uri);
            } else if (data.destination) {
              api.scrollTo(data.destination.pagenum);
            }
          }
        }
        function updateDragger(isDraggable) {
          if (isDraggable) {
            if (!dragger) {
              $el.addClass(CSS_CLASS_DRAGGABLE);
              dragger = scope.createComponent('dragger');
              dragger.init(config.$viewport);
            }
          } else {
            if (dragger) {
              $el.removeClass(CSS_CLASS_DRAGGABLE);
              scope.destroyComponent(dragger);
              dragger = null;
            }
          }
        }
        function validateQueryParams() {
          var queryString;
          if (config.queryParams) {
            if (typeof config.queryParams === 'string') {
              queryString = config.queryParams.replace(/^\?/, '');
            } else {
              queryString = util.param(config.queryParams);
            }
          }
          config.queryString = queryString ? '?' + queryString : '';
        }
        return {
          messages: ['asseterror', 'destroy', 'dragend', 'dragstart', 'fail', 'layoutchange', 'linkclick', 'pagefail', 'pagefocus', 'pageload', 'pageunload', 'ready', 'resize', 'scrollstart', 'scrollend', 'zoom'],
          onmessage: function(name, data) {
            switch (name) {
              case 'layoutchange':
                api.updateLayout();
                break;
              case 'linkclick':
                handleLinkClick(data);
                break;
              case 'zoom':
                data.zoom *= config.pageScale;
                data.prevZoom *= config.pageScale;
                if (config.enableDragging) {
                  updateDragger(data.isDraggable);
                }
                api.fire(name, data);
                break;
              case 'dragstart':
                if (!$el.hasClass(CSS_CLASS_DRAGGING)) {
                  $el.addClass(CSS_CLASS_DRAGGING);
                }
                api.fire(name, data);
                break;
              case 'dragend':
                if ($el.hasClass(CSS_CLASS_DRAGGING)) {
                  $el.removeClass(CSS_CLASS_DRAGGING);
                }
                api.fire(name, data);
                break;
              default:
                api.fire(name, data);
                break;
            }
          },
          init: function() {
            config = scope.getConfig();
            api = config.api;
            config.namespace = CSS_CLASS_VIEWER + '-' + config.id;
            $el = config.$el;
            $el.addClass(CSS_CLASS_VIEWER);
            $el.addClass(config.namespace);
            if (config.url) {
              if (!/\/$/.test(config.url)) {
                config.url += '/';
              }
            } else {
              throw new Error('no URL given for viewer assets');
            }
            config.url = scope.getUtility('url').makeAbsolute(config.url);
            if (config.useSVG === undefined) {
              config.useSVG = true;
            }
            validateQueryParams();
            initViewerHTML();
            initPlugins();
          },
          destroy: function() {
            $el.empty().removeClass(function(i, cls) {
              var match = cls.match(new RegExp('crocodoc\\S+', 'g'));
              return match && match.join(' ');
            });
            $(stylesheetEl).remove();
            if ($assetsPromise) {
              $assetsPromise.abort();
            }
          },
          setLayout: function(layoutMode) {
            var lastPage = config.page,
                lastZoom = config.zoom || 1,
                previousLayoutMode = config.layout,
                newLayout;
            if (layout) {
              if (layoutMode === previousLayoutMode) {
                return layout;
              }
              lastPage = layout.state.currentPage;
              lastZoom = layout.state.zoomState;
            }
            newLayout = scope.createComponent('layout-' + layoutMode);
            if (!newLayout) {
              throw new Error('Invalid layout ' + layoutMode);
            }
            if (layout) {
              scope.destroyComponent(layout);
            }
            config.layout = layoutMode;
            layout = newLayout;
            layout.init();
            layout.setZoom(lastZoom.zoomMode || lastZoom.zoom || lastZoom);
            if (util.isFn(layout.scrollTo)) {
              layout.scrollTo(lastPage);
            }
            config.currentLayout = layout;
            scope.broadcast('layoutchange', {
              previousLayout: previousLayoutMode,
              layout: layoutMode
            });
            return layout;
          },
          loadAssets: function() {
            var $loadStylesheetPromise,
                $loadMetadataPromise,
                $pageOneContentPromise,
                $pageOneTextPromise;
            if ($assetsPromise) {
              return;
            }
            $loadMetadataPromise = scope.get('metadata');
            $loadMetadataPromise.then(function handleMetadataResponse(metadata) {
              config.metadata = metadata;
            });
            if (browser.ielt9) {
              stylesheetEl = util.insertCSS('');
              config.stylesheet = stylesheetEl.styleSheet;
              $loadStylesheetPromise = $.when('').promise({abort: function() {}});
            } else {
              $loadStylesheetPromise = scope.get('stylesheet');
              $loadStylesheetPromise.then(function handleStylesheetResponse(cssText) {
                stylesheetEl = util.insertCSS(cssText);
                config.stylesheet = stylesheetEl.sheet;
              });
            }
            if (config.autoloadFirstPage && (!config.pageStart || config.pageStart === 1)) {
              if (support.svg && config.useSVG) {
                $pageOneContentPromise = scope.get('page-svg', 1);
              } else if (config.conversionIsComplete) {
                $pageOneContentPromise = scope.get('page-img', 1);
              }
              if (config.enableTextSelection) {
                $pageOneTextPromise = scope.get('page-text', 1);
              }
            }
            $assetsPromise = $.when($loadMetadataPromise, $loadStylesheetPromise).fail(function(error) {
              if ($assetsPromise) {
                $assetsPromise.abort();
              }
              scope.ready();
              scope.broadcast('asseterror', error);
              scope.broadcast('fail', error);
            }).then(completeInit).promise({abort: function() {
                $assetsPromise = null;
                $loadMetadataPromise.abort();
                $loadStylesheetPromise.abort();
                if ($pageOneContentPromise) {
                  $pageOneContentPromise.abort();
                }
                if ($pageOneTextPromise) {
                  $pageOneTextPromise.abort();
                }
              }});
          }
        };
      });
      return Crocodoc;
    }));
  })(typeof window !== 'undefined' ? window : this);
})(require("process"));
