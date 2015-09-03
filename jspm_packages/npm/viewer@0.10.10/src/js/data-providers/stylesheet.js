/* */ 
(function(process) {
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
})(require("process"));
