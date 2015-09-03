/* */ 
(function(process) {
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
})(require("process"));
