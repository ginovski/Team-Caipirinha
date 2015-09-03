/* */ 
(function(process) {
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
})(require("process"));
