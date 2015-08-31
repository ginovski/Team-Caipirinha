import sammy from 'sammy'
import appConfig from 'app/config/appConfig'
import 'parse'

import HomeController from 'app/controllers/HomeController'
import UsersController from 'app/controllers/UsersController'

Parse.initialize(appConfig.parseConfig.applicationId, appConfig.parseConfig.javaScriptKey);

var app = Sammy('#main', function() {
    this.get('#/', HomeController.index);
    this.get('#/login', UsersController.login);
    this.get('#/register', UsersController.register);
});

app.run('#/');