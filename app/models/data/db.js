import appConfig from 'app/config/appConfig'
import 'parse'

Parse.initialize(appConfig.parseConfig.applicationId, appConfig.parseConfig.javaScriptKey);

var db = (function () {
    function add(dataClass, dataObject){
        var DataClass = Parse.Object.extend(dataClass);
        var data = new DataClass();

        data.save(dataObject);
    }

    return {
        add: add
    };
}());

export default db;