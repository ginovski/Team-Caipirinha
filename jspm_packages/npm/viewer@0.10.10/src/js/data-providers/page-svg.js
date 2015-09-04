/* */ 
(function(process) {
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
})(require("process"));
