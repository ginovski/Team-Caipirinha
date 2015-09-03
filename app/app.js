import sammy from 'sammy';

import BooksController from 'app/controllers/BooksController';
import HomeController from 'app/controllers/HomeController';
import UsersController from 'app/controllers/UsersController';

var app = new Sammy('#main', function () {
    this.get('#/', HomeController.index);
    this.get('#/login', UsersController.login);
    this.get('#/register', UsersController.register);
    this.get('#/loggedOut', UsersController.logout);
    this.post('#/login', UsersController.postLogin);
    this.post('#/register', UsersController.postRegister);
    this.get('#/titles', BooksController.titles);
    this.get('#/books/details/:id', BooksController.details);
});

app.run('#/');