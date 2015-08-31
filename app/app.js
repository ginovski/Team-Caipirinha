import sammy from 'sammy'
import appConfig from 'app/config/appConfig'
import 'parse'

import HomeController from 'app/controllers/HomeController'

Parse.initialize(appConfig.parseConfig.applicationId, appConfig.parseConfig.javaScriptKey);

var app = Sammy('#main', function() {
    this.get('#/', HomeController.index);
});

app.run('#/');