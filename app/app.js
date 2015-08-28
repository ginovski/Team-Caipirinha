import sammy from 'sammy'
import HomeController from 'app/controllers/HomeController'
import parseConfig from 'app/config/appConfig'

Parse.initialize(parseConfig.applicationId, parseConfig.javaScriptKey);

var app = Sammy('#main', function() {
    this.get('#/', HomeController.index);
});

app.run('#/');