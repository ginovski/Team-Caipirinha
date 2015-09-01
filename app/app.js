import sammy from 'sammy'

import BooksController from 'app/controllers/BooksController'
import HomeController from 'app/controllers/HomeController'
import UsersController from 'app/controllers/UsersController'

var app = Sammy('#main', function() {
    this.get('#/', HomeController.index);
    this.get('#/login', UsersController.login);
    this.get('#/register', UsersController.register);
    this.post('#/login', UsersController.postLogin);
    this.post('#/register', UsersController.postRegister);
    this.get('#/titles', BooksController.titles)
});

app.run('#/');