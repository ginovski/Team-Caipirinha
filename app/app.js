import sammy from 'sammy'

import HomeController from 'app/controllers/HomeController'
import UsersController from 'app/controllers/UsersController'

var app = Sammy('#main', function() {
    this.get('#/', HomeController.index);
    this.get('#/login', UsersController.login);
    this.get('#/register', UsersController.register);
});

app.run('#/');